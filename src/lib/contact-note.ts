export const MAX_NOTE_LENGTH = 1000;

export function normalizeNote(value: unknown) {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.length <= MAX_NOTE_LENGTH ? normalized : null;
}

export function emailNoteLine(note: string) {
  const single = note.replace(/\s+/g, " ").trim();
  return single ? [`Note: ${single}`] : [];
}
