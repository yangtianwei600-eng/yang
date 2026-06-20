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
MEM_LIMIT = "2048m"
CPU_LIMIT = "3.0"
PIDS_LIMIT = "512"
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
        WS = "/root/workspaces/main"
        os.makedirs(WS + "/.pylibs", exist_ok=True)
        try:
            os.chmod(WS, 0o777)
            os.chmod(WS + "/.pylibs", 0o777)
        except Exception:
            pass
        low = code.strip().lstrip("!%").strip()
        if low.startswith("pip install") or low.startswith("pip3 install"):
            run_argv = ["pip", "install", "--target=/workspace/.pylibs", "--no-cache-dir"] + low.split()[2:]
        else:
            run_argv = ["python", "/code/main.py"]

        cmd = [
            "docker", "run", "--rm",
            "--name", container_name,
            "--network", "bridge",          # 允许联网（爬虫）
            "--memory", MEM_LIMIT,
            "--memory-swap", MEM_LIMIT,      # 禁用 swap，内存硬上限
            "--cpus", CPU_LIMIT,
            "--pids-limit", PIDS_LIMIT,
            "--read-only",                   # 根文件系统只读
            "--tmpfs", "/tmp:rw,size=256m",   # 可写 /tmp（含临时文件）
            "--shm-size", "512m",            # 共享内存（Chromium 必需）
            "--user", "nobody",              # 非 root
            "--cap-drop", "ALL",             # 去掉所有 Linux capability
            "--security-opt", "no-new-privileges",
            "-v", f"{workdir}:/code:ro",     # 代码以只读挂载
            "-v", f"{WS}:/workspace:rw",
            "-w", "/workspace",
            "-e", "PYTHONUNBUFFERED=1",
            "-e", "HOME=/tmp",
            "-e", "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright",
            "-e", "PYTHONPATH=/workspace/.pylibs",
            IMAGE,
            *run_argv,
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


# ============ 交互式执行（C：交互终端）============

class InteractiveSession:
    """一个常驻交互容器会话。生命周期由调用方（WebSocket 端点）掌控。"""

    def __init__(self) -> None:
        self.workdir: str | None = None
        self.container_name: str | None = None
        self.proc: asyncio.subprocess.Process | None = None
        self._killed = False

    async def start(self, code: str) -> None:
        self.workdir = tempfile.mkdtemp(prefix="irun_")
        script_path = os.path.join(self.workdir, "main.py")
        self.container_name = f"irun_{uuid.uuid4().hex[:12]}"
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
        os.chmod(self.workdir, 0o777)
        os.chmod(script_path, 0o644)

        cmd = [
            "docker", "run", "-i", "--rm",
            "--name", self.container_name,
            "--network", "bridge",
            "--memory", MEM_LIMIT,
            "--memory-swap", MEM_LIMIT,
            "--cpus", CPU_LIMIT,
            "--pids-limit", PIDS_LIMIT,
            "--read-only",
            "--tmpfs", "/tmp:rw,size=256m",
            "--shm-size", "512m",
            "--user", "nobody",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "-v", f"{self.workdir}:/code:ro",
            "-w", "/code",
            "-e", "PYTHONUNBUFFERED=1",
            "-e", "HOME=/tmp",
            "-e", "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright",
            IMAGE,
            "python", "-u", "main.py",
        ]
        self.proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

    async def write_stdin(self, line: str) -> None:
        """把一整行写入容器 stdin（前端回车触发）。自动补换行。"""
        if self.proc and self.proc.stdin and not self.proc.stdin.is_closing():
            if not line.endswith("\n"):
                line += "\n"
            try:
                self.proc.stdin.write(line.encode("utf-8"))
                await self.proc.stdin.drain()
            except (BrokenPipeError, ConnectionResetError):
                pass

    async def close_stdin(self) -> None:
        if self.proc and self.proc.stdin and not self.proc.stdin.is_closing():
            try:
                self.proc.stdin.write_eof()
            except Exception:
                pass

    async def stream_output(self):
        """异步生成 (stream, text) 元组。两路并发读取，任一有数据就 yield。"""
        assert self.proc is not None
        q: asyncio.Queue = asyncio.Queue()

        async def _pump(reader, name):
            sent = 0
            while True:
                chunk = await reader.read(1024)
                if not chunk:
                    break
                text = chunk.decode("utf-8", errors="replace")
                sent += len(text)
                if sent > OUTPUT_LIMIT:
                    await q.put((name, "\n[输出过长，已截断]"))
                    break
                await q.put((name, text))
            await q.put((name, None))

        tasks = [
            asyncio.create_task(_pump(self.proc.stdout, "stdout")),
            asyncio.create_task(_pump(self.proc.stderr, "stderr")),
        ]
        finished = 0
        while finished < 2:
            name, text = await q.get()
            if text is None:
                finished += 1
                continue
            yield (name, text)
        for t in tasks:
            if not t.done():
                t.cancel()

    async def wait(self) -> int:
        if self.proc:
            await self.proc.wait()
            return self.proc.returncode if self.proc.returncode is not None else -1
        return -1

    async def kill(self) -> None:
        """强杀容器 + 进程，清理临时目录。WS 断开或超时调用。"""
        if self._killed:
            return
        self._killed = True
        if self.container_name:
            await _kill_container(self.container_name)
        if self.proc:
            try:
                self.proc.kill()
            except ProcessLookupError:
                pass
        if self.workdir:
            shutil.rmtree(self.workdir, ignore_errors=True)
