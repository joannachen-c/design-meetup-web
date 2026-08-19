function decodeBytes(body, encoding) {
  const enc = encoding.trim().toLowerCase();
  if (enc === "base64") {
    return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
  }
  if (enc === "quoted-printable") {
    return body
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
  }
  return body;
}

function headerValue(headers, name) {
  const lines = headers.split(/\r?\n/);
  const prefix = `${name.toLowerCase()}:`;
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].toLowerCase().startsWith(prefix)) continue;
    let value = lines[index].slice(lines[index].indexOf(":") + 1).trim();
    while (index + 1 < lines.length && /^\s/.test(lines[index + 1])) {
      index += 1;
      value += ` ${lines[index].trim()}`;
    }
    return value;
  }
  return "";
}

function splitPart(raw) {
  const normalized = raw.replace(/^\r?\n/, "");
  const match = /\r?\n\r?\n/.exec(normalized);
  if (!match) return { headers: normalized, body: "" };
  return {
    headers: normalized.slice(0, match.index),
    body: normalized.slice(match.index + match[0].length),
  };
}

function textPartsFromRfc822(raw, collected = []) {
  const { headers, body } = splitPart(raw);
  const contentType = headerValue(headers, "Content-Type") || "text/plain";
  const encoding = headerValue(headers, "Content-Transfer-Encoding") || "7bit";
  const boundary = /boundary="?([^";\r\n]+)"?/i.exec(contentType)?.[1];

  if (/multipart\//i.test(contentType) && boundary) {
    for (const part of body.split(`--${boundary}`)) {
      if (!part.trim() || part.trim() === "--") continue;
      textPartsFromRfc822(part, collected);
    }
    return collected;
  }

  if (/text\/plain/i.test(contentType) || /text\/html/i.test(contentType)) {
    collected.push(decodeBytes(body, encoding));
  }

  return collected;
}

export function inquiryTextFromRfc822(source) {
  const raw = Buffer.isBuffer(source) ? source.toString("utf8") : String(source);
  const parts = textPartsFromRfc822(raw);
  const joined = parts.length > 0 ? parts.join("\n") : raw;
  const start = joined.search(/^New partner inquiry\b/im);
  return start === -1 ? null : joined.slice(start);
}
