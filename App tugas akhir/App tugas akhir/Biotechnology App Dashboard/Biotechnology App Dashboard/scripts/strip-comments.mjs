import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const PROJECT_ROOT = process.cwd();

const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".vscode",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  ".idea",
  "coverage",
]);

const EXCLUDED_PATH_PARTS = [
  `${path.sep}android${path.sep}app${path.sep}build${path.sep}`,
  `${path.sep}android${path.sep}build${path.sep}`,
  `${path.sep}android${path.sep}.gradle${path.sep}`,
  `${path.sep}android${path.sep}capacitor-cordova-android-plugins${path.sep}build${path.sep}`,
  `${path.sep}android${path.sep}jdk-`,
  `${path.sep}android${path.sep}gradle${path.sep}wrapper${path.sep}dists${path.sep}`,
];

const TS_LIKE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const C_STYLE_EXTS = new Set([
  ".kt",
  ".kts",
  ".java",
  ".gradle",
  ".php",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".htm",
  ".jsonc",
  ".md",
]);

function isExcludedPath(fullPath) {
  const normalized = fullPath;
  for (const part of EXCLUDED_PATH_PARTS) {
    if (normalized.includes(part)) return true;
  }
  return false;
}

function walkDir(dirPath, outFiles) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (isExcludedPath(fullPath)) continue;

    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      walkDir(fullPath, outFiles);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (TS_LIKE_EXTS.has(ext) || C_STYLE_EXTS.has(ext)) {
      outFiles.push(fullPath);
    }
  }
}

function stripCommentsWithTypeScriptScanner(sourceText, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const isJsx = ext === ".tsx" || ext === ".jsx";
  const languageVariant = isJsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;

  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    languageVariant,
    sourceText,
  );

  const tokens = [];
  while (true) {
    const kind = scanner.scan();
    tokens.push({ kind, text: scanner.getTokenText() });
    if (kind === ts.SyntaxKind.EndOfFileToken) break;
  }

  const isWhitespaceKind = (k) =>
    k === ts.SyntaxKind.WhitespaceTrivia || k === ts.SyntaxKind.NewLineTrivia;

  const nextNonWsIndex = (start) => {
    for (let i = start; i < tokens.length; i++) {
      if (!isWhitespaceKind(tokens[i].kind)) return i;
    }
    return -1;
  };

  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (isJsx && tok.kind === ts.SyntaxKind.OpenBraceToken) {
      const j = nextNonWsIndex(i + 1);
      if (j !== -1 && tokens[j].kind === ts.SyntaxKind.MultiLineCommentTrivia) {
        const k = nextNonWsIndex(j + 1);
        if (k !== -1 && tokens[k].kind === ts.SyntaxKind.CloseBraceToken) {
          i = k;
          continue;
        }
      }
    }

    if (tok.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
      if (tok.text.startsWith("///")) {
        result += tok.text;
      }
      continue;
    }

    if (tok.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      continue;
    }

    result += tok.text;
  }

  return result;
}

function stripCStyleComments(sourceText) {
  let out = "";

  const State = {
    Normal: 0,
    Slash: 1,
    LineComment: 2,
    BlockComment: 3,
    SingleQuote: 4,
    DoubleQuote: 5,
    Backtick: 6,
  };

  let state = State.Normal;
  for (let i = 0; i < sourceText.length; i++) {
    const ch = sourceText[i];
    const next = i + 1 < sourceText.length ? sourceText[i + 1] : "";

    if (state === State.Normal) {
      if (ch === "/") {
        state = State.Slash;
        continue;
      }
      if (ch === "'") {
        state = State.SingleQuote;
        out += ch;
        continue;
      }
      if (ch === '"') {
        state = State.DoubleQuote;
        out += ch;
        continue;
      }
      if (ch === "`") {
        state = State.Backtick;
        out += ch;
        continue;
      }
      out += ch;
      continue;
    }

    if (state === State.Slash) {
      if (ch === "/" && next === "/") {
        state = State.LineComment;
        i++;
        continue;
      }
      if (ch === "/" && next === "*") {
        state = State.BlockComment;
        i++;
        continue;
      }
      out += "/";
      state = State.Normal;
      i--;
      continue;
    }

    if (state === State.LineComment) {
      if (ch === "\n") {
        out += "\n";
        state = State.Normal;
      }
      continue;
    }

    if (state === State.BlockComment) {
      if (ch === "*" && next === "/") {
        state = State.Normal;
        i++;
      }
      continue;
    }

    if (state === State.SingleQuote) {
      out += ch;
      if (ch === "\\" && next) {
        out += next;
        i++;
        continue;
      }
      if (ch === "'") state = State.Normal;
      continue;
    }

    if (state === State.DoubleQuote) {
      out += ch;
      if (ch === "\\" && next) {
        out += next;
        i++;
        continue;
      }
      if (ch === '"') state = State.Normal;
      continue;
    }

    if (state === State.Backtick) {
      out += ch;
      if (ch === "\\" && next) {
        out += next;
        i++;
        continue;
      }
      if (ch === "`") state = State.Normal;
      continue;
    }
  }

  if (state === State.Slash) {
    out += "/";
  }

  return out;
}

function processFile(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  const rel = path.relative(PROJECT_ROOT, fullPath);

  const original = fs.readFileSync(fullPath, "utf8");

  let stripped = original;
  if (TS_LIKE_EXTS.has(ext)) {
    stripped = stripCommentsWithTypeScriptScanner(original, fullPath);
  } else {
    stripped = stripCStyleComments(original);
  }

  if (stripped !== original) {
    fs.writeFileSync(fullPath, stripped, "utf8");
    return rel;
  }
  return null;
}

function main() {
  const targetDirs = process.argv.slice(2);
  const roots = targetDirs.length > 0 ? targetDirs : ["src", "."];

  const files = [];
  for (const root of roots) {
    const fullRoot = path.resolve(PROJECT_ROOT, root);
    if (!fs.existsSync(fullRoot)) continue;

    const stat = fs.statSync(fullRoot);
    if (stat.isFile()) {
      files.push(fullRoot);
      continue;
    }
    if (stat.isDirectory()) {
      walkDir(fullRoot, files);
    }
  }

  const changed = [];
  for (const file of files) {
    const ch = processFile(file);
    if (ch) changed.push(ch);
  }

  changed.sort();
  process.stdout.write(`${changed.length} files changed\n`);
  for (const p of changed) process.stdout.write(`${p}\n`);
}

main();
