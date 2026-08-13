/**
 * Rewrite Luma event blurbs into past tense once an event has ended.
 *
 * Keeps invitation/imperative phrasing ("join us", "stick around") and leaves
 * sponsor / About / org blurbs in present tense.
 */

const APOSTROPHE = String.raw`['’]`;

const IRREGULAR_PAST = {
  be: "was",
  become: "became",
  begin: "began",
  bring: "brought",
  build: "built",
  come: "came",
  dive: "dove",
  do: "did",
  find: "found",
  gather: "gathered",
  get: "got",
  give: "gave",
  go: "went",
  have: "had",
  hear: "heard",
  hold: "held",
  keep: "kept",
  kick: "kicked",
  know: "knew",
  lead: "led",
  leave: "left",
  make: "made",
  meet: "met",
  move: "moved",
  open: "opened",
  present: "presented",
  run: "ran",
  say: "said",
  see: "saw",
  share: "shared",
  show: "showed",
  spend: "spent",
  start: "started",
  take: "took",
  talk: "talked",
  tell: "told",
  think: "thought",
  walk: "walked",
  win: "won",
};

const PROGRESSIVE_PAST = {
  bringing: "brought",
  gathering: "gathered",
  highlighting: "highlighted",
  kicking: "kicked",
  opening: "opened",
  partnering: "partnered",
  taking: "took",
  starting: "started",
};

/** Invitation / imperative phrasing that should stay present. */
const PRESERVE_PHRASE_PATTERNS = [
  new RegExp(String.raw`\bcome join us\b`, "gi"),
  new RegExp(String.raw`\bjoin us\b`, "gi"),
  new RegExp(String.raw`\bcome meet\b`, "gi"),
  new RegExp(String.raw`\bstick around\b`, "gi"),
  new RegExp(String.raw`\bexpect\b`, "gi"), // "Expect a high-energy night"
];

/**
 * Headings that open a present-tense sponsor / org block.
 * Everything from here until the next narrative section stays untouched.
 */
const ABOUT_SECTION_START =
  /^(?:about\b|what is\b|.{0,40}\bis hiring!?$)/i;

/** Headings that end an About block and resume normal rewriting. */
const NARRATIVE_SECTION_START =
  /^(?:featuring|featured speakers|speakers|panelists|schedule|event schedule|agenda|who this is for|who should attend|what to expect|details|prizes|how it works|menu|when:|where:|hosted in collaboration|what we.?re looking for|design-?athon rules|format:)\b/i;

/** Org blurbs that stay present even without an About heading. */
const ORG_BLURB_START =
  /^(?:design meetup|notion ny|rivet|cursor|entrepreneurs first|phia|ramp|figma|nexus)\b.{0,80}\b(?:is|helps|turns|empowers|offers|hosts|believes)\b/i;

const SIGN_OFF_LINE =
  /^(?:\s*(?:✨\s*)?(?:see you(?:\s+(?:soon|there|at\b.+))?|we(?:\s+will|\s*['’]ll)?\s*can['’]?t wait to see you(?:\s+there)?|(?:✨\s*)?space is limited[^.!\n]*?(?:we can['’]t wait to see you(?:\s+there)?)?)[.!]?\s*(?:✨\s*)?)$/i;

function decodeBasicEntities(text) {
  return String(text ?? "")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtmlText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function eventHasEnded(event, now = new Date()) {
  const end = event?.ends_at || event?.starts_at;
  if (!end) return false;
  const endMs = new Date(end).getTime();
  return Number.isFinite(endMs) && endMs < now.getTime();
}

function toPastVerb(verb) {
  const lower = verb.toLowerCase();
  if (IRREGULAR_PAST[lower]) {
    return matchCase(verb, IRREGULAR_PAST[lower]);
  }
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) {
    return matchCase(verb, `${lower.slice(0, -1)}ied`);
  }
  if (lower.endsWith("e")) {
    return matchCase(verb, `${lower}d`);
  }
  // Only double the final consonant for short CVC stems (stop → stopped).
  if (
    lower.length <= 4 &&
    /[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxz]$/i.test(lower)
  ) {
    return matchCase(verb, `${lower}${lower.at(-1)}ed`);
  }
  return matchCase(verb, `${lower}ed`);
}

function matchCase(source, target) {
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target[0].toUpperCase() + target.slice(1);
  }
  return target;
}

function isLikelyPluralSubject(subject) {
  const trimmed = subject.trim().toLowerCase();
  if (
    /^(everyone|everybody|anyone|anybody|someone|somebody|each|nobody|one|this|that)$/.test(
      trimmed,
    )
  ) {
    return false;
  }
  if (
    /^(speakers?|artists?|designers?|attendees|finalists|participants|guests|they|we|you)$/.test(
      trimmed,
    )
  ) {
    return /s$/.test(trimmed) || /^(they|we|you|attendees|finalists|participants|guests)$/.test(trimmed);
  }
  // "Our speakers", "Each artist", "Selected participants"
  if (/\b(speakers|artists|designers|attendees|finalists|participants|guests)\b/i.test(trimmed)) {
    return true;
  }
  if (/\beach\b/i.test(trimmed)) return false;
  return /\w+s$/i.test(trimmed.split(/\s+/).at(-1) ?? "");
}

function protectMatches(text, patterns) {
  const protectedChunks = [];
  let output = text;
  for (const pattern of patterns) {
    output = output.replace(pattern, (match) => {
      const token = `\u0000P${protectedChunks.length}\u0000`;
      protectedChunks.push(match);
      return token;
    });
  }
  return {
    text: output,
    restore(value) {
      return value.replace(/\u0000P(\d+)\u0000/g, (_, index) => protectedChunks[Number(index)] ?? "");
    },
  };
}

function splitPlainParagraphs(text) {
  return String(text).split(/(\n{2,})/);
}

function isAboutHeading(paragraph) {
  const line = paragraph.replace(/<[^>]+>/g, "").trim();
  return ABOUT_SECTION_START.test(line);
}

function isNarrativeHeading(paragraph) {
  const line = paragraph.replace(/<[^>]+>/g, "").trim();
  return NARRATIVE_SECTION_START.test(line);
}

function isOrgBlurb(paragraph) {
  const line = paragraph.replace(/<[^>]+>/g, "").trim();
  return ORG_BLURB_START.test(line);
}

function isSignOff(paragraph) {
  const line = paragraph.replace(/<[^>]+>/g, "").trim();
  return SIGN_OFF_LINE.test(line);
}

/** Protect only the leading org sentence when a blurb continues into event narrative. */
function splitLeadingOrgSentence(paragraph) {
  if (!isOrgBlurb(paragraph)) return null;
  const match = paragraph.match(/^(\s*.+?[.!?])(\s+[\s\S]*)?$/);
  if (!match) return { protectedText: paragraph, rest: "" };
  const [, first, rest = ""] = match;
  // Pure org blurbs (or About-section body) stay fully protected.
  if (
    !rest.trim() ||
    !/\b(?:for this|tonight|this (?:evening|afternoon|morning|makeathon|event)|we(?:['’]re| are) (?:bringing|partnering|gathering|taking))\b/i.test(
      rest,
    )
  ) {
    return { protectedText: paragraph, rest: "" };
  }
  return { protectedText: first, rest };
}

/**
 * Mark plain-text paragraphs that belong to About / sponsor / org blocks.
 * Returns a boolean mask aligned to splitPlainParagraphs parts (including separators).
 */
function aboutMaskForParts(parts) {
  const mask = parts.map(() => false);
  let inAbout = false;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (/^\n+$/.test(part)) continue;
    if (isAboutHeading(part)) {
      inAbout = true;
      mask[i] = true;
      continue;
    }
    if (inAbout && isNarrativeHeading(part)) {
      inAbout = false;
      continue;
    }
    if (inAbout) {
      mask[i] = true;
      continue;
    }
    // Standalone org blurbs without an About heading: protect the paragraph
    // (or only its first sentence when event narrative continues).
    if (isOrgBlurb(part)) {
      mask[i] = true;
    }
  }
  return mask;
}

function pastCoordinateFollowOns(text) {
  // "Speakers shared X and give Y" → "... and gave Y"
  return text.replace(
    /\b(shared|walked|dove|dived|built|started|moved|opened|invited|kicked|showed|talked|left|brought|gathered|highlighted|took|had|paired)\b([^.]{0,160}?)\band\s+(give|share|present|bounce|ask|unpack|meet|win|bridge)\b/gi,
    (match, first, mid, second) => {
      if (/\b(?:they|we|you|he|she|it|speakers|artists|designers|everyone)\b/i.test(mid)) {
        return match;
      }
      return `${first}${mid}and ${toPastVerb(second)}`;
    },
  );
}

function rewriteFutureClauses(text) {
  let output = text;

  // We're / They're + progressive event verb → simple past
  output = output.replace(
    new RegExp(
      String.raw`\b(we|they)(${APOSTROPHE}re| are) (${Object.keys(PROGRESSIVE_PAST).join("|")})\b`,
      "gi",
    ),
    (match, subject, _aux, gerund) => {
      const past = PROGRESSIVE_PAST[gerund.toLowerCase()];
      if (!past) return match;
      const subjectOut = matchCase(
        subject,
        subject.toLowerCase() === "we" ? "we" : "they",
      );
      return `${subjectOut} ${matchCase(gerund, past)}`;
    },
  );

  // We'll / We will + verb
  output = output.replace(
    new RegExp(
      String.raw`\b(we|you|they)(${APOSTROPHE}ll| will) ([a-z]+)\b`,
      "gi",
    ),
    (match, subject, _aux, verb) =>
      `${matchCase(subject, subject)} ${toPastVerb(verb)}`,
  );

  // Subject will be + past-participle / adjective
  output = output.replace(
    /\b([A-Z][\w'’]*(?:\s+[A-Z][\w'’]*){0,3}|[Oo]ur\s+\w+|[Ee]ach\s+\w+|[Ss]elected\s+\w+|[Ee]veryone|[Ss]peakers?|[Aa]rtists?|[Ff]inalists|[Pp]articipants)\s+will be\s+([a-z]+(?:ed|en|d)?)\b/g,
    (match, subject, complement) => {
      const be = isLikelyPluralSubject(subject) ? "were" : "was";
      return `${subject} ${be} ${complement}`;
    },
  );

  // Subject will + verb (speakers will share, each artist will share, …)
  output = output.replace(
    /\b([A-Z][\w'’]*(?:\s+[A-Z][\w'’]*){0,3}|[Oo]ur\s+\w+|[Ee]ach\s+\w+|[Ss]elected\s+\w+|[Ee]veryone|[Ss]peakers?|[Aa]rtists?|[Ff]inalists|[Pp]articipants|[Dd]esigners?)\s+will\s+([a-z]+)\b/g,
    (match, subject, verb) => `${subject} ${toPastVerb(verb)}`,
  );

  // Lowercase mid-sentence "we will" / "who will" leftovers
  output = output.replace(
    new RegExp(String.raw`\b(we|you|they|who) will ([a-z]+)\b`, "gi"),
    (match, subject, verb) => `${subject} ${toPastVerb(verb)}`,
  );

  // "as we bring together" / "we bring together" / "brings together"
  output = output.replace(
    /\b(as\s+)?we bring together\b/gi,
    (match, asPrefix) => `${asPrefix ?? ""}we brought together`,
  );
  output = output.replace(/\bbrings together\b/gi, "brought together");
  output = output.replace(/\bbring together\b/gi, "brought together");

  // Simple-present event framing (not future "will …").
  output = output.replace(
    /\b(this|the)\s+(panel|night|evening|afternoon|morning|meetup|event)\s+is\s+(built|designed)\b/gi,
    (_, det, noun, verb) => `${det} ${noun} was ${verb.toLowerCase()}`,
  );

  output = output.replace(/\bWe invite you\b/g, "We invited you");
  output = output.replace(/\bwe invite you\b/g, "we invited you");
  output = output.replace(/\bWe are excited to\b/g, "We were excited to");
  output = output.replace(/\bwe are excited to\b/g, "we were excited to");
  output = output.replace(/\bAttendance is limited\b/g, "Attendance was limited");
  output = output.replace(/\bCapacity is limited\b/g, "Capacity was limited");

  // "we are bridging" (event narrative after an org sentence)
  output = output.replace(
    /\bwe are bridging\b/gi,
    "we bridged",
  );

  output = pastCoordinateFollowOns(pastCoordinateFollowOns(output));

  // Soften remaining forward-looking RSVP lines inside narrative
  output = output.replace(/\bRSVP now!?(?=\s|$)/gi, "Thanks for coming.");
  output = output.replace(
    /\bSpots are limited\.\s*Apply soon to secure your spot\./gi,
    "Spots were limited.",
  );
  output = output.replace(
    /\bApply soon to secure your spot\./gi,
    "Spots were limited.",
  );
  output = output.replace(
    /\b(?:✨\s*)?Space is limited\.\s*We can['’]t wait to see you(?:\s+there)?[.!]?\s*(?:✨\s*)?/gi,
    "",
  );
  output = output.replace(
    /\bWe can['’]t wait to see you(?:\s+there)?[.!]*/gi,
    "",
  );
  output = output.replace(/^\s*✨\s*$/gm, "");
  output = output.replace(/\s+✨\s*$/g, "");

  return output.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trimEnd();
}

function rewritePlainNarrative(text) {
  const { text: protectedText, restore } = protectMatches(
    text,
    PRESERVE_PHRASE_PATTERNS,
  );
  return restore(rewriteFutureClauses(protectedText));
}

function rewriteMaybeMixedOrgParagraph(part) {
  const split = splitLeadingOrgSentence(part);
  if (!split) return rewritePlainNarrative(part);
  if (!split.rest) return split.protectedText;
  return `${split.protectedText}${rewritePlainNarrative(split.rest)}`;
}

export function rewritePastEventSummary(text) {
  if (!text) return text;

  const parts = splitPlainParagraphs(text);
  const aboutMask = aboutMaskForParts(parts);

  return parts
    .map((part, index) => {
      if (/^\n+$/.test(part)) return part;
      if (isSignOff(part)) return "";
      if (aboutMask[index]) {
        // About-headed sections stay fully present; bare org blurbs may be mixed.
        if (isAboutHeading(part) || !isOrgBlurb(part)) return part;
        return rewriteMaybeMixedOrgParagraph(part);
      }
      return rewritePlainNarrative(part);
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "")
    .trim();
}

/**
 * Rewrite HTML summaries while preserving tags.
 * About / sponsor sections are detected from visible text in block tags.
 */
export function rewritePastEventSummaryHtml(html) {
  if (!html) return html;

  // Work on a lightly normalized string: split into block-ish chunks by closing block tags.
  const blocks = html.split(/(?=<p\b|<h2\b|<ul\b|<ol\b|<blockquote\b)/i).filter(Boolean);
  const texts = blocks.map((block) =>
    decodeBasicEntities(block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
  );

  const aboutMask = texts.map(() => false);
  let inAbout = false;
  for (let i = 0; i < texts.length; i += 1) {
    const text = texts[i];
    if (!text) continue;
    if (isAboutHeading(text)) {
      inAbout = true;
      aboutMask[i] = true;
      continue;
    }
    if (inAbout && isNarrativeHeading(text)) {
      inAbout = false;
      continue;
    }
    if (inAbout) {
      aboutMask[i] = true;
      continue;
    }
    if (isOrgBlurb(text)) aboutMask[i] = true;
  }

  const rewritten = blocks
    .map((block, index) => {
      const plain = texts[index];
      if (!plain) return block;
      if (isSignOff(plain)) return "";

      if (aboutMask[index]) {
        if (isAboutHeading(plain) || !isOrgBlurb(plain)) return block;
        const split = splitLeadingOrgSentence(plain);
        if (!split?.rest) return block;
        return rewriteHtmlTextNodes(block, split.protectedText.trim());
      }

      return rewriteHtmlTextNodes(block);
    })
    .join("")
    .replace(/(?:<p>\s*<\/p>)+/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />");

  return rewritten;
}

function rewriteHtmlTextNodes(block, protectSentence = "") {
  return block.replace(/(^|>)([^<>]+)(?=<|$)/g, (match, prefix, text) => {
    const decoded = decodeBasicEntities(text);
    let rewrittenText;
    if (protectSentence && decoded.includes(protectSentence)) {
      const escaped = protectSentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const { text: protectedText, restore } = protectMatches(decoded, [
        new RegExp(escaped, "i"),
      ]);
      rewrittenText = restore(rewritePlainNarrative(protectedText));
    } else if (
      protectSentence &&
      protectSentence.startsWith(decoded.trim()) &&
      decoded.trim().length > 0
    ) {
      // Leading fragment of the protected sentence (split across tags).
      rewrittenText = decoded;
    } else {
      rewrittenText = rewritePlainNarrative(decoded);
    }

    const leading = text.match(/^\s*/)?.[0] ?? "";
    const trailing = text.match(/\s*$/)?.[0] ?? "";
    const core = rewrittenText.trim();
    if (!core && !text.trim()) return match;
    const needsEscape = /[&<>"']/.test(text) || text.includes("&#");
    const body = needsEscape ? escapeHtmlText(core) : core;
    const withApostrophes = needsEscape
      ? body
      : body.replace(/'/g, text.includes("’") ? "’" : "'");
    return `${prefix}${leading}${withApostrophes}${trailing}`;
  });
}

export function applyPastTenseToEvent(event, now = new Date()) {
  if (!eventHasEnded(event, now)) return event;
  const summary = rewritePastEventSummary(event.summary ?? "");
  const summary_html = rewritePastEventSummaryHtml(event.summary_html ?? "");
  return {
    ...event,
    summary,
    summary_html,
  };
}
