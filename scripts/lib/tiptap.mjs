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
      // Luma uses HRs as section dividers; omit them entirely (no line, no gap).
      return "";
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

// Promo headings Luma often bolds inside an h2 (credits, merch, etc.).
const PROMO_PERK_HEADING = /^special perk(s)?(\s+for\s+attendees)?$/i;

const SOCIAL_FOOTER_BODY =
  /(?:instagram:\s*@designmeetup|follow us on instagram:\s*@designmeetup|(?:^|\n)\s*(?:follow us on\s+)?(?:x|twitter):\s*@designmeetup)/i;

const TIME_LABEL = /^\d{1,2}:\d{2}\s*(?:am|pm)?\.?$/i;

function stripInvisibleChars(text) {
  return String(text ?? "").replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
}

function normalizeTitleKey(text) {
  return stripInvisibleChars(text)
    .toLowerCase()
    .replace(/[×x]/g, "x")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasBoldMark(node) {
  return (node?.marks ?? []).some(
    (mark) => mark?.type === "bold" || mark?.type === "strong",
  );
}

function withoutBoldMarks(node) {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map(withoutBoldMarks),
      marks: (node.marks ?? []).filter(
        (mark) => mark?.type !== "bold" && mark?.type !== "strong",
      ),
    };
  }
  if (node.type === "text") {
    return {
      ...node,
      marks: (node.marks ?? []).filter(
        (mark) => mark?.type !== "bold" && mark?.type !== "strong",
      ),
    };
  }
  return node;
}

/** True when a leading Luma block just restates the event title. */
export function isRedundantEventTitle(text, eventTitle = "") {
  const raw = stripInvisibleChars(text).trim();
  if (!raw || raw.length > 100) return false;
  // Body sentences keep terminal punctuation; short title/CTA lines may use !.
  if (/[.]$/.test(raw) && !/[✨☕]/.test(raw)) return false;
  if (
    /[?]$/.test(raw) &&
    !/[✨☕]/.test(raw) &&
    !/^(?:join us|design meetup)\b/i.test(raw)
  ) {
    return false;
  }

  const normalized = normalizeTitleKey(raw);
  if (!normalized) return false;

  if (eventTitle) {
    const titleKey = normalizeTitleKey(eventTitle);
    if (
      titleKey &&
      (titleKey === normalized ||
        titleKey.startsWith(normalized) ||
        normalized.startsWith(titleKey) ||
        titleKey.includes(normalized))
    ) {
      return true;
    }
  }

  if (/^design meetup(?:\s+x\s+|\s+)/i.test(normalized)) return true;
  if (/^join us at scale\b/i.test(normalized)) return true;
  // Short emoji-decorated title lines ("✨ Creators and Founders Night…").
  if (raw.length <= 80 && /[✨☕]/.test(raw)) return true;
  return false;
}

export function isPromoPerkHeading(text) {
  return PROMO_PERK_HEADING.test(stripInvisibleChars(text).trim());
}

export function isSocialFooterText(text) {
  const normalized = stripInvisibleChars(text).trim();
  if (!normalized) return false;
  if (!SOCIAL_FOOTER_BODY.test(normalized)) return false;
  // Pure social footers, or short sign-off blocks that only add handles.
  const withoutSocial = stripSocialLinesFromPlainText(normalized)
    .replace(/[✨\s/|]+/g, " ")
    .trim();
  return withoutSocial.length === 0 || withoutSocial.length <= 40;
}

function stripSocialLinesFromPlainText(text) {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/^(?:follow us on\s+)?instagram:\s*@designmeetup/i.test(line) &&
        !/^(?:follow us on\s+)?(?:x|twitter):\s*@designmeetup/i.test(line),
    )
    .join("\n")
    .trim();
}

/** Drop trailing Instagram/X handles from a rendered HTML paragraph. */
function stripSocialLinesFromHtmlParagraph(inner) {
  return inner
    .replace(
      /(?:<br\s*\/?>\s*)+(?:<(?:strong|b)\b[^>]*>\s*)?(?:Follow us on\s+)?Instagram:\s*(?:<\/(?:strong|b)>\s*)?@designmeetup[\s\S]*$/i,
      "",
    )
    .replace(
      /(?:<(?:strong|b)\b[^>]*>\s*)?(?:Follow us on\s+)?Instagram:\s*(?:<\/(?:strong|b)>\s*)?@designmeetup[\s\S]*$/i,
      "",
    )
    .replace(
      /(?:<br\s*\/?>\s*)+(?:<(?:strong|b)\b[^>]*>\s*)?(?:Follow us on\s+)?(?:X|Twitter):\s*(?:<\/(?:strong|b)>\s*)?@designmeetuphq?\s*$/i,
      "",
    )
    .replace(
      /(?:<(?:strong|b)\b[^>]*>\s*)?(?:Follow us on\s+)?(?:X|Twitter):\s*(?:<\/(?:strong|b)>\s*)?@designmeetuphq?\s*$/i,
      "",
    )
    .replace(/(?:<br\s*\/?>\s*)+$/i, "")
    .trim();
}

function stripSocialLinesFromParagraphNode(node) {
  if (!node || node.type !== "paragraph" || !Array.isArray(node.content)) {
    return node;
  }
  const plain = renderPlainBlock(node);
  if (!SOCIAL_FOOTER_BODY.test(plain) && !/follow us on (?:x|twitter)/i.test(plain)) {
    return node;
  }
  if (isSocialFooterText(plain)) return null;

  const nextContent = [];
  for (let index = 0; index < node.content.length; index += 1) {
    const child = node.content[index];
    if (child?.type === "hard_break") {
      // Drop breaks that only lead into social handle lines.
      const rest = node.content.slice(index + 1);
      const restText = renderPlainInline(rest).trim();
      if (
        /^(?:follow us on\s+)?instagram:\s*@designmeetup/i.test(restText) ||
        /^(?:follow us on\s+)?(?:x|twitter):\s*@designmeetup/i.test(restText)
      ) {
        break;
      }
      nextContent.push(child);
      continue;
    }
    if (child?.type === "text") {
      const text = String(child.text ?? "").trim();
      if (
        /^(?:follow us on\s+)?instagram:\s*@designmeetup/i.test(text) ||
        /^(?:follow us on\s+)?(?:x|twitter):\s*@designmeetup/i.test(text)
      ) {
        break;
      }
    }
    nextContent.push(child);
  }

  // Drop trailing hard breaks left behind.
  while (nextContent[nextContent.length - 1]?.type === "hard_break") {
    nextContent.pop();
  }
  if (nextContent.length === 0) return null;
  return { ...node, content: nextContent };
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
    isPartnerIntroText(text) ||
    isSocialFooterText(text)
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
  const text = renderPlainBlock(node);
  if (node.type === "heading" && isPromoPerkHeading(text)) return true;
  return isBoilerplateText(text);
}

function isLeadingTitleNode(node, eventTitle = "") {
  if (!node || typeof node !== "object") return false;
  if (node.type !== "heading" && node.type !== "paragraph") return false;
  const text = renderPlainBlock(node).trim();
  if (!isRedundantEventTitle(text, eventTitle)) return false;
  // Paragraph titles from Luma are usually fully bold; plain body intros are not.
  if (node.type === "paragraph") {
    const textNodes = (node.content ?? []).filter((child) => child?.type === "text");
    if (
      textNodes.length > 0 &&
      !textNodes.every((child) => hasBoldMark(child)) &&
      !/[✨☕]/.test(text)
    ) {
      return false;
    }
  }
  return true;
}

/** Drop heading-level bold — CSS already styles h2/h3/h4 as bold. */
function unwrapHeadingBold(node) {
  if (!node || node.type !== "heading") return node;
  return withoutBoldMarks(node);
}

/**
 * True when a prior sibling is non-bold text on the same line (mid-sentence
 * brand/venue emphasis like "at Clay's NYC office"). Leading bold — Featuring
 * names, schedule times, When:/Where: — must stay.
 */
function hasPrecedingPlainText(nodes, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const prev = nodes[i];
    if (!prev) continue;
    if (prev.type === "hard_break") return false;
    if (prev.type === "text") {
      if (!String(prev.text ?? "").trim()) continue;
      return !hasBoldMark(prev);
    }
    // Linked/inline nodes count as preceding content on the same line.
    return true;
  }
  return false;
}

/**
 * Unwrap mid-sentence brand/venue bold (e.g. "Clay's NYC office", "v0",
 * "Cursor") while keeping leading structural bold: speaker names in Featuring
 * lists ("Jennifer Jing, …"), times, and When:/Where: labels.
 */
function unwrapIncidentalParagraphBold(node) {
  if (!node || node.type !== "paragraph" || !Array.isArray(node.content)) {
    return node;
  }

  const textNodes = node.content.filter((child) => child?.type === "text");
  if (textNodes.length === 0) return node;
  // Fully-bold paragraphs are intentional section labels ("Featured Speakers").
  if (textNodes.every((child) => hasBoldMark(child))) return node;

  const nextContent = node.content.map((child, index) => {
    if (child?.type !== "text" || !hasBoldMark(child)) return child;
    const text = String(child.text ?? "").trim();
    if (!text) return withoutBoldMarks(child);

    // Keep "When:", "Instagram:", etc.
    if (/:$/.test(text)) return child;
    // Keep schedule times.
    if (TIME_LABEL.test(text)) return child;

    // Keep speaker/name lines: bold run immediately before a hard break.
    const next = node.content[index + 1];
    const prev = node.content[index - 1];
    if (
      next?.type === "hard_break" &&
      (!prev || prev.type === "hard_break")
    ) {
      return child;
    }

    // Only strip mid-sentence emphasis (plain text before the bold run).
    // Leading bold followed by a title (", Senior Designer…") must stay.
    if (hasPrecedingPlainText(node.content, index)) {
      return withoutBoldMarks(child);
    }
    return child;
  });

  return { ...node, content: nextContent };
}

function transformContentNodes(nodes = []) {
  return (nodes ?? [])
    .map((node) => {
      if (!node || typeof node !== "object") return node;
      if (node.type === "heading") return unwrapHeadingBold(node);
      if (node.type === "paragraph") {
        const withoutSocial = stripSocialLinesFromParagraphNode(node);
        if (!withoutSocial) return null;
        return unwrapIncidentalParagraphBold(withoutSocial);
      }
      if (Array.isArray(node.content)) {
        return { ...node, content: transformContentNodes(node.content) };
      }
      return node;
    })
    .filter(Boolean);
}

function dropHorizontalRules(nodes = []) {
  return nodes.filter((node) => node?.type !== "horizontal_rule");
}

/**
 * Drop host liability / policy boilerplate, sold-out notices, Figma Field Days
 * eligibility/RSVP footnotes, partner intros, social footers, redundant title
 * lines, and promo perk headings from a Luma TipTap description. Also unwraps
 * decorative bold inside headings and mid-sentence brand/venue emphasis, while
 * keeping leading speaker-name bold in Featuring lists.
 */
export function stripLiabilityContent(doc, options = {}) {
  if (!doc || typeof doc !== "object") return doc;
  const eventTitle =
    typeof options === "string" ? options : (options?.eventTitle ?? "");
  const content = Array.isArray(doc.content) ? doc.content : [];
  const withoutBoilerplate = content.filter((node) => !isBoilerplateNode(node));

  let start = 0;
  while (
    start < withoutBoilerplate.length &&
    isLeadingTitleNode(withoutBoilerplate[start], eventTitle)
  ) {
    start += 1;
  }
  const withoutTitles = withoutBoilerplate.slice(start);
  const transformed = transformContentNodes(withoutTitles);
  return { ...doc, content: dropHorizontalRules(transformed) };
}

/** Strip liability/policy paragraphs from already-rendered plain summaries. */
export function stripLiabilityFromPlainText(text, options = {}) {
  if (typeof text !== "string" || !text.trim()) return text ?? "";
  const eventTitle =
    typeof options === "string" ? options : (options?.eventTitle ?? "");
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  let start = 0;
  while (
    start < blocks.length &&
    isRedundantEventTitle(blocks[start], eventTitle)
  ) {
    start += 1;
  }

  return blocks
    .slice(start)
    .filter(
      (block) =>
        !isBoilerplateText(block) && !isPromoPerkHeading(firstMeaningfulLine(block)),
    )
    .map((block) => stripSocialLinesFromPlainText(block))
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unwrapIncidentalHtmlStrong(html) {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (full, inner) => {
    if (!/<strong\b/i.test(inner)) return full;

    const plainWithoutStrong = inner
      .replace(/<strong\b[^>]*>[\s\S]*?<\/strong>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "");
    // Fully-bold paragraphs stay (section labels).
    if (!plainWithoutStrong) return full;

    const parts = [];
    const token = /<strong\b[^>]*>([\s\S]*?)<\/strong>|<br\s*\/?>|[^<]+|<[^>]+>/gi;
    let match;
    const tokens = [];
    while ((match = token.exec(inner)) !== null) {
      tokens.push(match[0]);
    }

    for (let index = 0; index < tokens.length; index += 1) {
      const current = tokens[index];
      const strongMatch = current.match(/^<strong\b[^>]*>([\s\S]*?)<\/strong>$/i);
      if (!strongMatch) {
        parts.push(current);
        continue;
      }

      const strongText = strongMatch[1].replace(/<[^>]+>/g, "").trim();
      if (/:$/.test(strongText) || TIME_LABEL.test(strongText)) {
        parts.push(current);
        continue;
      }

      const prev = tokens[index - 1];
      const next = tokens[index + 1];
      const prevIsBreak = !prev || /^<br\s*\/?>$/i.test(prev);
      const nextIsBreak = next && /^<br\s*\/?>$/i.test(next);
      if (prevIsBreak && nextIsBreak) {
        parts.push(current);
        continue;
      }

      // Mid-sentence only: plain text before the strong run.
      // Leading names ("Jennifer Jing, …") keep their <strong>.
      let prevIsPlain = false;
      for (let i = index - 1; i >= 0; i -= 1) {
        const candidate = tokens[i];
        if (/^<br\s*\/?>$/i.test(candidate)) break;
        if (/^</.test(candidate)) {
          prevIsPlain = true;
          break;
        }
        if (candidate.replace(/\s+/g, "").length > 0) {
          prevIsPlain = true;
          break;
        }
      }
      if (prevIsPlain) {
        parts.push(strongMatch[1]);
        continue;
      }

      parts.push(current);
    }

    return `<p>${parts.join("")}</p>`;
  });
}

const SUMMARY_DIVIDER_HTML =
  '(?:<hr\\s*\\/?>|<div class="detail-summary-gap"[^>]*>\\s*<\\/div>)\\s*';

/**
 * Strip liability/policy blocks from already-rendered HTML summaries.
 * Handles both dedicated paragraphs and title+body packed into one <p>.
 */
export function stripLiabilityFromHtml(html, options = {}) {
  if (typeof html !== "string" || !html.trim()) return html ?? "";
  const eventTitle =
    typeof options === "string" ? options : (options?.eventTitle ?? "");

  let output = html
    // Title-only or title+body paragraphs (Figma Field Days style).
    .replace(
      new RegExp(
        `${SUMMARY_DIVIDER_HTML}?<p>(?:\\s|<br\\s*\\/?>)*<(?:strong|b)>\\s*(?:Photography(?:\\s+and\\s+Filming)?|Safety\\s+and\\s+Inclusivity|Code\\s+of\\s+Conduct)\\s*<\\/(?:strong|b)>[\\s\\S]*?<\\/p>`,
        "gi",
      ),
      "",
    )
    // Standalone consent paragraphs.
    .replace(
      /<p>(?:(?!<\/p>)[\s\S])*?\b(?:by attending,?\s+you (?:give your )?consent|please be aware that this event will be photographed|reserves the right to use these images|discrimination of any kind will not be tolerated)(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
      "",
    )
    // Sold-out / full-capacity calendar notices (+ trailing divider).
    .replace(
      new RegExp(
        `<p>(?:(?!<\\/p>)[\\s\\S])*?(?:we(?:&#39;|'|’)re at full capacity|we are at full capacity|this event is (?:at |sold out|full capacity)|sold out)(?:(?!<\\/p>)[\\s\\S])*?(?:subscribe to our calendars|for future gatherings)(?:(?!<\\/p>)[\\s\\S])*?<\\/p>\\s*(?:${SUMMARY_DIVIDER_HTML})?`,
        "gi",
      ),
      "",
    )
    // Figma Field Days eligibility footnotes (+ leading divider).
    .replace(
      new RegExp(
        `(?:${SUMMARY_DIVIDER_HTML})*<p>(?:(?!<\\/p>)[\\s\\S])*?(?:this event is open to (?:current |all )?interns and students|verified Figma for Education email is required|figma\\.com\\/education\\/apply)(?:(?!<\\/p>)[\\s\\S])*?<\\/p>`,
        "gi",
      ),
      "",
    )
    // Capacity + selective RSVP footnotes (+ leading divider).
    .replace(
      new RegExp(
        `(?:${SUMMARY_DIVIDER_HTML})*<p>(?:(?!<\\/p>)[\\s\\S])*?Capacity is limited to \\d+\\s+attendees(?:(?!<\\/p>)[\\s\\S])*?RSVPs? will be reviewed(?:(?!<\\/p>)[\\s\\S])*?<\\/p>`,
        "gi",
      ),
      "",
    )
    // Figma Edu / Design Meetup partner intro headings + following body.
    .replace(
      new RegExp(
        `(?:${SUMMARY_DIVIDER_HTML})*<(?:h[1-4]|p)>(?:(?!<\\/(?:h[1-4]|p)>)[\\s\\S])*?What is (?:Figma for Edu|Design Meetup)\\??(?:(?!<\\/(?:h[1-4]|p)>)[\\s\\S])*?<\\/(?:h[1-4]|p)>\\s*(?:<(?:h[1-4]|p)>(?:(?!<\\/(?:h[1-4]|p)>)[\\s\\S])*?(?:empowers educators and students|continuously upskill while making meaningful friendships|your role as a product, brand, and visual designer)(?:(?!<\\/(?:h[1-4]|p)>)[\\s\\S])*?<\\/(?:h[1-4]|p)>)?`,
        "gi",
      ),
      "",
    )
    // Standalone partner intro body paragraphs (if heading already removed).
    .replace(
      new RegExp(
        `(?:${SUMMARY_DIVIDER_HTML})*<p>(?:(?!<\\/p>)[\\s\\S])*?(?:empowers educators and students to make the most out of Figma|qualifying educators and students can access Figma.?s professional tools for free|continuously upskill while making meaningful friendships|we are your space to learn and define where design is heading)(?:(?!<\\/p>)[\\s\\S])*?<\\/p>`,
        "gi",
      ),
      "",
    )
    // Social follow footers — drop whole paragraphs or trailing handle lines.
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (full, inner) => {
      if (!/instagram:\s*|follow us on (?:instagram|x|twitter)/i.test(inner)) {
        return full;
      }
      const plain = inner.replace(/<[^>]+>/g, " ");
      if (isSocialFooterText(plain)) return "";
      const trimmed = stripSocialLinesFromHtmlParagraph(inner);
      if (!trimmed || !trimmed.replace(/<[^>]+>/g, "").trim()) return "";
      return `<p>${trimmed}</p>`;
    })
    // Promo perk headings (optionally bold-wrapped).
    .replace(
      /<(h[1-4])>(?:\s|<strong\b[^>]*>)*Special Perk(?:s)?(?:\s+for\s+Attendees)?(?:\s*<\/strong>)*\s*<\/\1>/gi,
      "",
    )
    // Unwrap decorative bold inside headings (CSS already bolds h2–h4).
    .replace(
      /<(h[1-4])>((?:(?!<\/\1>)[\s\S])*?)<\/\1>/gi,
      (match, tag, inner) =>
        `<${tag}>${inner.replace(/<\/?(?:strong|b)\b[^>]*>/gi, "")}</${tag}>`,
    );

  // Leading redundant title: heading or fully-bold paragraph.
  output = output.replace(
    /^(?:\s*<(h[1-4]|p)>([\s\S]*?)<\/\1>)+/i,
    (match) => {
      const parts = [...match.matchAll(/<(h[1-4]|p)>([\s\S]*?)<\/\1>/gi)];
      let kept = "";
      let dropping = true;
      for (const part of parts) {
        const innerText = part[2].replace(/<[^>]+>/g, "").trim();
        if (dropping && isRedundantEventTitle(innerText, eventTitle)) {
          continue;
        }
        dropping = false;
        kept += part[0];
      }
      return kept;
    },
  );

  output = unwrapIncidentalHtmlStrong(output);
  return stripHorizontalRules(output).trim();
}

/** Remove Luma <hr> dividers and any leftover blank-gap spacers. */
export function stripHorizontalRules(html) {
  if (typeof html !== "string" || !html.trim()) return html ?? "";
  return html
    .replace(/<hr\s*\/?>/gi, "")
    .replace(
      /<div class="detail-summary-gap"[^>]*>\s*<\/div>/gi,
      "",
    );
}

/** @deprecated Prefer stripHorizontalRules — gaps are no longer used. */
export function replaceHorizontalRulesWithGaps(html) {
  return stripHorizontalRules(html);
}

export function tipTapToHtml(doc, options = {}) {
  if (!doc || typeof doc !== "object") return "";
  const cleaned = stripLiabilityContent(doc, options);
  return (cleaned.content ?? [])
    .map(renderBlock)
    .filter(Boolean)
    .join("")
    .replace(/(<\/p>)\s*(<p>)/g, "$1$2")
    .trim();
}

export function tipTapToPlainText(doc, options = {}) {
  if (!doc || typeof doc !== "object") return "";
  const cleaned = stripLiabilityContent(doc, options);
  return (cleaned.content ?? [])
    .map(renderPlainBlock)
    .map((block) => block.replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** @deprecated Prefer tipTapToPlainText */
export function normalizeTipTapDescription(doc, options = {}) {
  return tipTapToPlainText(doc, options);
}
