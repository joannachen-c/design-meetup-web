function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHref(href) {
  if (typeof href !== "string") return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return null;
}

function wrapMarks(html, marks = []) {
  let output = html;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
      case "strong":
        output = `<strong>${output}</strong>`;
        break;
      case "italic":
      case "em":
        output = `<em>${output}</em>`;
        break;
      case "underline":
        output = `<u>${output}</u>`;
        break;
      case "strike":
      case "strikethrough":
        output = `<s>${output}</s>`;
        break;
      case "code":
        output = `<code>${output}</code>`;
        break;
      case "link": {
        const href = sanitizeHref(mark.attrs?.href);
        if (href) {
          const isExternal = /^(https?:)/i.test(href);
          const attrs = isExternal
            ? ` href="${escapeHtml(href)}" target="_blank" rel="noreferrer"`
            : ` href="${escapeHtml(href)}"`;
          output = `<a${attrs}>${output}</a>`;
        }
        break;
      }
      default:
        break;
    }
  }
  return output;
}

function renderInline(nodes = []) {
  return (nodes ?? [])
    .map((node) => {
      if (!node) return "";
      if (node.type === "hard_break") return "<br />";
      if (node.type === "text") {
        return wrapMarks(escapeHtml(node.text ?? ""), node.marks);
      }
      if (Array.isArray(node.content)) {
        return wrapMarks(renderInline(node.content), node.marks);
      }
      return "";
    })
    .join("");
}

function renderPlainInline(nodes = []) {
  return (nodes ?? [])
    .map((node) => {
      if (!node) return "";
      if (node.type === "hard_break") return "\n";
      if (node.type === "text") return node.text ?? "";
      if (Array.isArray(node.content)) return renderPlainInline(node.content);
      return "";
    })
    .join("");
}

function headingTag(level) {
  const normalized = Math.min(Math.max(Number(level) || 2, 2), 4);
  return `h${normalized}`;
}

function renderBlock(node) {
  if (!node || typeof node !== "object") return "";

  switch (node.type) {
    case "paragraph": {
      const html = renderInline(node.content).trim();
      return html ? `<p>${html}</p>` : "";
    }
    case "heading": {
      const tag = headingTag(node.attrs?.level);
      const html = renderInline(node.content).trim();
      return html ? `<${tag}>${html}</${tag}>` : "";
    }
    case "blockquote": {
      const inner = (node.content ?? []).map(renderBlock).filter(Boolean).join("");
      return inner ? `<blockquote>${inner}</blockquote>` : "";
    }
    case "bullet_list": {
      const items = (node.content ?? [])
        .map((item) => {
          const html = (item.content ?? []).map(renderBlock).join("") ||
            `<p>${renderInline(item.content)}</p>`;
          return `<li>${html}</li>`;
        })
        .join("");
      return items ? `<ul>${items}</ul>` : "";
    }
    case "ordered_list": {
      const items = (node.content ?? [])
        .map((item) => {
          const html = (item.content ?? []).map(renderBlock).join("") ||
            `<p>${renderInline(item.content)}</p>`;
          return `<li>${html}</li>`;
        })
        .join("");
      return items ? `<ol>${items}</ol>` : "";
    }
    case "list_item":
      return (node.content ?? []).map(renderBlock).join("");
    case "horizontal_rule":
      return "<hr />";
    case "code_block": {
      const code = escapeHtml(renderPlainInline(node.content));
      return code ? `<pre><code>${code}</code></pre>` : "";
    }
    default:
      if (Array.isArray(node.content)) {
        return node.content.map(renderBlock).filter(Boolean).join("");
      }
      return "";
  }
}

function renderPlainBlock(node) {
  if (!node || typeof node !== "object") return "";

  switch (node.type) {
    case "paragraph":
    case "heading":
      return renderPlainInline(node.content).trim();
    case "blockquote":
      return (node.content ?? [])
        .map(renderPlainBlock)
        .filter(Boolean)
        .join("\n")
        .trim();
    case "bullet_list":
    case "ordered_list":
      return (node.content ?? [])
        .map((item) => {
          const text = renderPlainBlock(item).trim();
          return text ? `• ${text}` : "";
        })
        .filter(Boolean)
        .join("\n");
    case "list_item":
      return (node.content ?? [])
        .map(renderPlainBlock)
        .filter(Boolean)
        .join("\n")
        .trim();
    case "hard_break":
      return "\n";
    case "horizontal_rule":
      return "";
    case "code_block":
      return renderPlainInline(node.content).trim();
    default:
      if (Array.isArray(node.content)) {
        return node.content.map(renderPlainBlock).filter(Boolean).join("\n\n");
      }
      return renderPlainInline([node]).trim();
  }
}

const LIABILITY_HEADING =
  /^(photography(\s+and\s+filming)?|safety\s+and\s+inclusivity|code\s+of\s+conduct)$/i;

const LIABILITY_BODY =
  /please be aware that this event will be photographed|reserves the right to use these images|by attending,?\s+you (give your )?consent|all .+ events are inclusive and welcoming|discrimination of any kind will not be tolerated|governed by .+ code of conduct/i;

export function isLiabilityText(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  if (LIABILITY_HEADING.test(firstMeaningfulLine(normalized))) return true;
  return LIABILITY_BODY.test(normalized);
}

function firstMeaningfulLine(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
}

function isLiabilityNode(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "horizontal_rule") return false;
  return isLiabilityText(renderPlainBlock(node));
}

/**
 * Drop host liability / policy boilerplate from a Luma TipTap description
 * (photography consent, code of conduct, inclusivity legal copy, etc.).
 */
export function stripLiabilityContent(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const content = Array.isArray(doc.content) ? doc.content : [];
  const kept = content.filter((node) => !isLiabilityNode(node));

  // Drop horizontal rules that only separated stripped liability blocks.
  const withoutOrphanRules = [];
  for (let index = 0; index < kept.length; index += 1) {
    const node = kept[index];
    if (node?.type !== "horizontal_rule") {
      withoutOrphanRules.push(node);
      continue;
    }
    const prev = withoutOrphanRules[withoutOrphanRules.length - 1];
    const next = kept.slice(index + 1).find((candidate) => candidate?.type !== "horizontal_rule");
    if (!prev || !next) continue;
    if (prev.type === "horizontal_rule") continue;
    withoutOrphanRules.push(node);
  }

  return { ...doc, content: withoutOrphanRules };
}

/** Strip liability/policy paragraphs from already-rendered plain summaries. */
export function stripLiabilityFromPlainText(text) {
  if (typeof text !== "string" || !text.trim()) return text ?? "";
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !isLiabilityText(block))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strip liability/policy blocks from already-rendered HTML summaries.
 * Handles both dedicated paragraphs and title+body packed into one <p>.
 */
export function stripLiabilityFromHtml(html) {
  if (typeof html !== "string" || !html.trim()) return html ?? "";

  let output = html
    // Title-only or title+body paragraphs (Figma Field Days style).
    .replace(
      /(?:<hr\s*\/?>\s*)?<p>(?:\s|<br\s*\/?>)*<(?:strong|b)>\s*(?:Photography(?:\s+and\s+Filming)?|Safety\s+and\s+Inclusivity|Code\s+of\s+Conduct)\s*<\/(?:strong|b)>[\s\S]*?<\/p>/gi,
      "",
    )
    // Standalone consent paragraphs.
    .replace(
      /<p>(?:(?!<\/p>)[\s\S])*?\b(?:by attending,?\s+you (?:give your )?consent|please be aware that this event will be photographed|reserves the right to use these images|discrimination of any kind will not be tolerated)(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
      "",
    )
    .replace(/(?:<hr\s*\/?>\s*)+$/gi, "")
    .replace(/^(?:\s*<hr\s*\/?>)+/gi, "")
    .replace(/(<hr\s*\/?>\s*){2,}/gi, "<hr />")
    .trim();

  return output;
}

export function tipTapToHtml(doc) {
  if (!doc || typeof doc !== "object") return "";
  const cleaned = stripLiabilityContent(doc);
  return (cleaned.content ?? [])
    .map(renderBlock)
    .filter(Boolean)
    .join("")
    .replace(/(<\/p>)\s*(<p>)/g, "$1$2")
    .trim();
}

export function tipTapToPlainText(doc) {
  if (!doc || typeof doc !== "object") return "";
  const cleaned = stripLiabilityContent(doc);
  return (cleaned.content ?? [])
    .map(renderPlainBlock)
    .map((block) => block.replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** @deprecated Prefer tipTapToPlainText */
export function normalizeTipTapDescription(doc) {
  return tipTapToPlainText(doc);
}
