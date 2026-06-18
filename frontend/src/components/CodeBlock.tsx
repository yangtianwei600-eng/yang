// 只读 Python 代码块，轻量语法着色（用于课程内容/练习展示）
// 真正可编辑的编辑器（Monaco）在下一阶段接入。

const KEYWORDS = new Set([
  "import", "from", "for", "in", "if", "else", "elif", "def", "return",
  "while", "class", "with", "as", "try", "except", "finally", "and", "or",
  "not", "is", "lambda", "pass", "break", "continue", "global", "nonlocal",
  "yield", "raise", "assert", "del", "async", "await",
]);
const CONSTS = new Set(["None", "True", "False"]);
const BUILTINS = new Set([
  "print", "len", "range", "str", "int", "float", "list", "dict", "set",
  "tuple", "open", "input", "enumerate", "zip", "map", "filter", "sum",
  "max", "min", "sorted", "type", "get", "select", "select_one", "text",
  "requests", "BeautifulSoup", "status_code",
]);

const COLOR: Record<string, string> = {
  kw: "text-[#C792EA]",
  str: "text-[#C3E88D]",
  num: "text-[#F78C6C]",
  const: "text-[#F78C6C]",
  fn: "text-[#82AAFF]",
  op: "text-[#89DDFF]",
  comment: "text-text-tertiary",
  plain: "text-text-primary",
};

interface Token {
  text: string;
  cls: keyof typeof COLOR;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i];

    // 注释
    if (ch === "#") {
      tokens.push({ text: line.slice(i), cls: "comment" });
      break;
    }

    // 字符串
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, n);
      tokens.push({ text: line.slice(i, j), cls: "str" });
      i = j;
      continue;
    }

    // 数字
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9._]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), cls: "num" });
      i = j;
      continue;
    }

    // 标识符
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let cls: keyof typeof COLOR = "plain";
      if (KEYWORDS.has(word)) cls = "kw";
      else if (CONSTS.has(word)) cls = "const";
      else if (BUILTINS.has(word)) cls = "fn";
      tokens.push({ text: word, cls });
      i = j;
      continue;
    }

    // 运算符
    if ("=+-*/%<>!&|.:".includes(ch)) {
      tokens.push({ text: ch, cls: "op" });
      i++;
      continue;
    }

    // 其它（括号、逗号、空格）
    tokens.push({ text: ch, cls: "plain" });
    i++;
  }

  return tokens;
}

export function CodeBlock({ code }: { code: string }) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className="overflow-x-auto rounded-card border border-white/[0.05] bg-bg-editor">
      <pre className="px-4 py-3 font-mono text-code leading-5">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line === "" ? (
              <span>&nbsp;</span>
            ) : (
              tokenizeLine(line).map((tok, j) => (
                <span key={j} className={COLOR[tok.cls]}>
                  {tok.text}
                </span>
              ))
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}
