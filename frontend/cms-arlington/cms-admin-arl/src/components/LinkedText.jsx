import { createElement } from "react";

export default function LinkedText({ children = "" }) {
  const text = String(children);
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(/(?<![\w@/.-])(?:https?:\/\/[^\s<>"']+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}\b(?::\d+)?(?:[/?#][^\s<>"']*)?)/gi)) {
    let label = match[0].replace(/[.,!?;:]+$/, "");
    // Keep balanced parentheses in URLs, but exclude surrounding punctuation.
    while (/[)\]}]$/.test(label)) {
      const close = label.at(-1);
      const open = { ")": "(", "]": "[", "}": "{" }[close];
      if (label.split(close).length <= label.split(open).length) break;
      label = label.slice(0, -1).replace(/[.,!?;:]+$/, "");
    }
    const href = /^https?:\/\//i.test(label) ? label : `https://${label}`;
    try {
      const url = new URL(href);
      if (!["http:", "https:"].includes(url.protocol)) continue;
    } catch { continue; }
    parts.push(text.slice(cursor, match.index));
    parts.push(createElement("a", {
      key: match.index, href, target: "_blank", rel: "noopener noreferrer",
    }, label));
    cursor = match.index + label.length;
  }
  parts.push(text.slice(cursor));
  return parts;
}
