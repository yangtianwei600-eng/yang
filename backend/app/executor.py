"""
代码执行引擎：把用户 Python 代码丢进一次性 Docker 容器里跑。
安全隔离：内存/CPU/进程数上限、根文件系统只读、非 root、超时强杀。
联网开启（为了跑爬虫），其余权限收紧。
"""
import asyncio
import os
import tempfile
import shutil
import uuid
from dataclasses import dataclass

IMAGE = "pysandbox:latest"
TIMEOUT_SECONDS = 14 * 60  # 14 分钟
MEM_LIMIT = "1024m"        # 放宽到 1G（Playwright/pandas 需要）
CPU_LIMIT = "0.9"
PIDS_LIMIT = "256"
OUTPUT_LIMIT = 256 * 1024  # 输出最多 256KB


@dataclass
class RunResult:
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    duration_ms: int


async def run_python(code: str) -> RunResult:
    """在隔离容器中执行一段 Python 代码，返回输出。"""
    # 在宿主机建一个临时目录，放用户代码，挂进容器
    workdir = tempfile.mkdtemp(prefix="run_")
    script_path = os.path.join(workdir, "main.py")
    container_name = f"run_{uuid.uuid4().hex[:12]}"
    try:
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
        os.chmod(workdir, 0o777)
        os.chmod(script_path, 0o644)

        cmd = [
            "docker", "run", "--rm",
            "--name", container_name,
            "--network", "bridge",          # 允许联网（爬虫）
            "--memory", MEM_LIMIT,
            "--memory-swap", MEM_LIMIT,      # 禁用 swap，内存硬上限
            "--cpus", CPU_LIMIT,
            "--pids-limit", PIDS_LIMIT,
            "--read-only",                   # 根文件系统只读
            "--tmpfs", "/tmp:rw,size=128m",   # 可写 /tmp（含临时文件）
            "--shm-size", "256m",            # 共享内存（Chromium 必需）
            "--user", "nobody",              # 非 root
            "--cap-drop", "ALL",             # 去掉所有 Linux capability
            "--security-opt", "no-new-privileges",
            "-v", f"{workdir}:/code:ro",     # 代码以只读挂载
            "-w", "/code",
            "-e", "PYTHONUNBUFFERED=1",
            "-e", "HOME=/tmp",
            IMAGE,
            "python", "main.py",
        ]

        loop = asyncio.get_event_loop()
        start = loop.time()
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        timed_out = False
        try:
            stdout_b, stderr_b = await asyncio.wait_for(
                proc.communicate(), timeout=TIMEOUT_SECONDS + 2
            )
        except asyncio.TimeoutError:
            timed_out = True
            # 超时：强杀容器
            await _kill_container(container_name)
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            stdout_b, stderr_b = b"", b""

        duration_ms = int((loop.time() - start) * 1000)

        stdout = _decode_trim(stdout_b)
        stderr = _decode_trim(stderr_b)
        exit_code = proc.returncode if proc.returncode is not None else -1

        if timed_out:
            stderr = (stderr + f"\n[运行超时，已强制终止，上限 {TIMEOUT_SECONDS} 秒]").strip()

        return RunResult(
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            timed_out=timed_out,
            duration_ms=duration_ms,
        )
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


async def _kill_container(name: str) -> None:
    try:
        proc = await asyncio.create_subprocess_exec(
            "docker", "kill", name,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.communicate(), timeout=5)
    except Exception:
        pass


def _decode_trim(b: bytes) -> str:
    text = b.decode("utf-8", errors="replace")
    if len(text) > OUTPUT_LIMIT:
        text = text[:OUTPUT_LIMIT] + "\n[输出过长，已截断]"
    return text
