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

const CAPACITY_NOTICE_BODY =
  /(?:we(?:'re| are) at full capacity|this event is (?:at |sold out|full capacity)|sold out)[\s\S]{0,240}(?:subscribe to our calendars|for future gatherings)/i;

// Figma Field Days eligibility + selective RSVP footnotes.
const FIGMA_ELIGIBILITY_BODY =
  /(?:this event is open to (?:current |all )?interns and students|verified figma for education email is required|figma\.com\/education\/apply)/i;

const FIGMA_CAPACITY_RSVP_BODY =
  /capacity is limited to \d+\s+attendees[\s\S]{0,200}rsvps? will be reviewed/i;

const PARTNER_INTRO_HEADING =
  /^what is (figma for edu|design meetup)\??$/i;

const PARTNER_INTRO_BODY =
  /figma for education .+empowers educators and students|empowers educators and students to make the most out of figma|qualifying educators and students can access figma.?s professional tools for free|your role as a product, brand, and visual designer is changing with next-gen tools|continuously upskill while making meaningful friendships|we are your space to learn and define where design is heading/i;

function stripInvisibleChars(text) {
  return String(text ?? "").replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
}

export function isLiabilityText(text) {
  const normalized = stripInvisibleChars(text).trim();
  if (!normalized) return false;
  if (LIABILITY_HEADING.test(firstMeaningfulLine(normalized))) return true;
  return LIABILITY_BODY.test(normalized);
}

export function isCapacityNoticeText(text) {
  const normalized = stripInvisibleChars(text).trim();
  if (!normalized) return false;
  return CAPACITY_NOTICE_BODY.test(normalized);
}

export function isFigmaEligibilityText(text) {
  const normalized = stripInvisibleChars(text).trim();
  if (!normalized) return false;
  return (
    FIGMA_ELIGIBILITY_BODY.test(normalized) ||
    FIGMA_CAPACITY_RSVP_BODY.test(normalized)
  );
}

export function isPartnerIntroText(text) {
  const normalized = stripInvisibleChars(text).trim();
  if (!normalized) return false;
  if (PARTNER_INTRO_HEADING.test(firstMeaningfulLine(normalized))) return true;
  return PARTNER_INTRO_BODY.test(normalized);
}

function isBoilerplateText(text) {
  return (
    isLiabilityText(text) ||
    isCapacityNoticeText(text) ||
    isFigmaEligibilityText(text) ||
    isPartnerIntroText(text)
  );
}

function firstMeaningfulLine(text) {
  return stripInvisibleChars(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
}

function isBoilerplateNode(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "horizontal_rule") return false;
  return isBoilerplateText(renderPlainBlock(node));
}

/**
 * Drop host liability / policy boilerplate, sold-out notices, Figma Field Days
 * eligibility/RSVP footnotes, and recurring partner intro copy from a Luma
 * TipTap description.
 */
export function stripLiabilityContent(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const content = Array.isArray(doc.content) ? doc.content : [];
  const kept = content.filter((node) => !isBoilerplateNode(node));

  // Drop horizontal rules that only separated stripped boilerplate blocks.
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
    .filter((block) => block && !isBoilerplateText(block))
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
    // Sold-out / full-capacity calendar notices (+ trailing divider).
    .replace(
      /<p>(?:(?!<\/p>)[\s\S])*?(?:we(?:&#39;|'|’)re at full capacity|we are at full capacity|this event is (?:at |sold out|full capacity)|sold out)(?:(?!<\/p>)[\s\S])*?(?:subscribe to our calendars|for future gatherings)(?:(?!<\/p>)[\s\S])*?<\/p>\s*(?:<hr\s*\/?>\s*)?/gi,
      "",
    )
    // Figma Field Days eligibility footnotes (+ leading divider).
    .replace(
      /(?:<hr\s*\/?>\s*)*<p>(?:(?!<\/p>)[\s\S])*?(?:this event is open to (?:current |all )?interns and students|verified Figma for Education email is required|figma\.com\/education\/apply)(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
      "",
    )
    // Capacity + selective RSVP footnotes (+ leading divider).
    .replace(
      /(?:<hr\s*\/?>\s*)*<p>(?:(?!<\/p>)[\s\S])*?Capacity is limited to \d+\s+attendees(?:(?!<\/p>)[\s\S])*?RSVPs? will be reviewed(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
      "",
    )
    // Figma Edu / Design Meetup partner intro headings + following body.
    .replace(
      /(?:<hr\s*\/?>\s*)*<(?:h[1-4]|p)>(?:(?!<\/(?:h[1-4]|p)>)[\s\S])*?What is (?:Figma for Edu|Design Meetup)\??(?:(?!<\/(?:h[1-4]|p)>)[\s\S])*?<\/(?:h[1-4]|p)>\s*(?:<(?:h[1-4]|p)>(?:(?!<\/(?:h[1-4]|p)>)[\s\S])*?(?:empowers educators and students|continuously upskill while making meaningful friendships|your role as a product, brand, and visual designer)(?:(?!<\/(?:h[1-4]|p)>)[\s\S])*?<\/(?:h[1-4]|p)>)?/gi,
      "",
    )
    // Standalone partner intro body paragraphs (if heading already removed).
    .replace(
      /(?:<hr\s*\/?>\s*)*<p>(?:(?!<\/p>)[\s\S])*?(?:empowers educators and students to make the most out of Figma|qualifying educators and students can access Figma.?s professional tools for free|continuously upskill while making meaningful friendships|we are your space to learn and define where design is heading)(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
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
