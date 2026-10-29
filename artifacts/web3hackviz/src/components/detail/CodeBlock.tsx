"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** GitHub dark (Primer) token colors. */
const COLOR = {
  text: "#e6edf3",
  comment: "#8b949e",
  keyword: "#ff7b72",
  string: "#a5d6ff",
  number: "#79c0ff",
  fn: "#d2a8ff",
  type: "#ffa657",
  gutter: "#6e7681",
  bg: "#0d1117",
  header: "#161b22",
  border: "#30363d",
};

const KEYWORDS = new Set([
  "function", "external", "payable", "private", "public", "internal", "returns", "return",
  "require", "assembly", "if", "else", "for", "while", "memory", "calldata", "storage",
  "view", "pure", "override", "virtual", "indexed", "event", "modifier", "emit", "new",
  "delete", "revert", "unchecked", "import", "pragma", "contract", "interface", "library",
  "is", "using", "constant", "immutable", "mapping", "struct", "true", "false", "this",
  "super", "break", "continue", "abstract", "error", "let", "const", "var", "type",
]);

const TYPE_RE = /^(u?int\d*|bytes\d*|address|bool|string)$/;

type Span = { text: string; color: string };

function highlightLine(line: string): Span[] {
  const spans: Span[] = [];
  const push = (text: string, color: string) => {
    if (!text) return;
    const last = spans[spans.length - 1];
    if (last && last.color === color) last.text += text;
    else spans.push({ text, color });
  };

  let i = 0;
  while (i < line.length) {
    if (line.startsWith("//", i)) {
      push(line.slice(i), COLOR.comment);
      break;
    }
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      push(line.slice(i, j), COLOR.string);
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch) && (i === 0 || !/[A-Za-z_]/.test(line[i - 1]))) {
      let j = i + 1;
      while (j < line.length && /[0-9a-fA-Fx_]/.test(line[j])) j++;
      push(line.slice(i, j), COLOR.number);
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let k = j;
      while (k < line.length && line[k] === " ") k++;
      const isCall = line[k] === "(";
      if (KEYWORDS.has(word)) push(word, COLOR.keyword);
      else if (TYPE_RE.test(word) || /^[A-Z]/.test(word)) push(word, COLOR.type);
      else if (isCall) push(word, COLOR.fn);
      else push(word, COLOR.text);
      i = j;
      continue;
    }
    push(ch, COLOR.text);
    i++;
  }
  return spans;
}

export function CodeBlock({
  code,
  language = "solidity",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const source = code.replace(/\n$/, "");
  const lines = source.split("\n");
  const label = language.trim() || "text";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
    } catch {
      const area = document.createElement("textarea");
      area.value = source;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="my-3 overflow-hidden rounded-md text-xs"
      style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}` }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: COLOR.header, borderBottom: `1px solid ${COLOR.border}` }}
      >
        <span className="font-sans text-[11px]" style={{ color: COLOR.comment }}>
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-sans text-[11px] hover:bg-white/5"
          style={{ color: COLOR.comment }}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[12px] leading-5">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td
                  className="select-none px-3 text-right align-top"
                  style={{ color: COLOR.gutter, width: "1%" }}
                >
                  {index + 1}
                </td>
                <td className="pr-4 whitespace-pre" style={{ color: COLOR.text }}>
                  {line.length === 0
                    ? " "
                    : highlightLine(line).map((span, spanIndex) => (
                        <span key={spanIndex} style={{ color: span.color }}>
                          {span.text}
                        </span>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
