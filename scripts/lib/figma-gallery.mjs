/**
 * Helpers for pulling event recap slides out of the Design Meetup Graphics
 * Figma file. Recap carousels live as 1080px-wide frames inside one section
 * per event, laid out left to right in posting order, with drafts and loose
 * photos scattered around them. These helpers stay pure so the frame picking
 * rules can be tested without a Figma token.
 */

const FIGMA_API = "https://api.figma.com/v1";
const SLIDE_TYPES = new Set(["FRAME", "GROUP", "COMPONENT", "INSTANCE"]);
// Instagram slides are 1080px wide. Anything much narrower is a loose photo,
// sticker, or annotation sitting next to the carousel.
const MIN_SLIDE_WIDTH = 900;

export function normalizeNodeId(value) {
  return String(value).trim().replace("-", ":");
}

/**
 * Accepts a figma.com/design URL (including branch URLs) or a bare file key
 * and returns { fileKey, nodeId }. nodeId is null when the URL has none.
 */
export function parseFigmaReference(reference) {
  const input = String(reference ?? "").trim();
  if (/^[0-9a-zA-Z]{22,128}$/.test(input)) {
    return { fileKey: input, nodeId: null };
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`"${input}" is neither a Figma URL nor a file key.`);
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const kindIndex = parts.findIndex((part) => part === "design" || part === "file");
  if (kindIndex === -1 || !parts[kindIndex + 1]) {
    throw new Error(`"${input}" is not a figma.com/design URL.`);
  }

  const branchIndex = parts.indexOf("branch");
  const fileKey =
    branchIndex !== -1 && parts[branchIndex + 1]
      ? parts[branchIndex + 1]
      : parts[kindIndex + 1];
  const nodeParam = url.searchParams.get("node-id");
  return { fileKey, nodeId: nodeParam ? normalizeNodeId(nodeParam) : null };
}

function box(node) {
  return node.absoluteBoundingBox ?? { x: 0, y: 0, width: 0, height: 0 };
}

/**
 * Pick the slide frames out of a section's direct children and return them in
 * reading order: top row first, left to right. Frames whose tops sit within
 * half a slide of each other count as one row, since carousels are rarely
 * pixel-aligned on the canvas.
 */
export function pickSlides(children, { match } = {}) {
  const needle = match?.trim().toLowerCase();
  const slides = children.filter(
    (node) =>
      SLIDE_TYPES.has(node.type) &&
      node.visible !== false &&
      box(node).width >= MIN_SLIDE_WIDTH &&
      (!needle || node.name.toLowerCase().includes(needle)),
  );

  const byTop = [...slides].sort((a, b) => box(a).y - box(b).y);
  const rows = [];
  for (const node of byTop) {
    const row = rows.at(-1);
    if (row && box(node).y < row.top + row.height / 2) {
      row.nodes.push(node);
    } else {
      rows.push({ top: box(node).y, height: box(node).height, nodes: [node] });
    }
  }

  return rows.flatMap((row) =>
    row.nodes.sort((a, b) => box(a).x - box(b).x),
  );
}

export function slideFileName(index, name) {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${String(index + 1).padStart(2, "0")}-${slug || "slide"}.png`;
}

async function figmaGet(path, token) {
  const response = await fetch(`${FIGMA_API}${path}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Figma ${path} failed (${response.status}): ${body.slice(0, 300)}`);
  }
  return response.json();
}

export async function fetchSectionChildren(fileKey, sectionId, token) {
  const data = await figmaGet(
    `/files/${fileKey}/nodes?ids=${encodeURIComponent(sectionId)}&depth=1`,
    token,
  );
  const document = data.nodes?.[sectionId]?.document;
  if (!document) throw new Error(`Node ${sectionId} was not found in ${fileKey}.`);
  return { name: document.name, children: document.children ?? [] };
}

export async function fetchNodes(fileKey, nodeIds, token) {
  const data = await figmaGet(
    `/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeIds.join(","))}&depth=1`,
    token,
  );
  return nodeIds.map((id) => {
    const document = data.nodes?.[id]?.document;
    if (!document) throw new Error(`Node ${id} was not found in ${fileKey}.`);
    return document;
  });
}

export async function renderPngs(fileKey, nodeIds, token, scale = 2) {
  const data = await figmaGet(
    `/images/${fileKey}?ids=${encodeURIComponent(nodeIds.join(","))}&format=png&scale=${scale}`,
    token,
  );
  if (data.err) throw new Error(`Figma render failed: ${data.err}`);
  return nodeIds.map((id) => {
    const url = data.images?.[id];
    if (!url) throw new Error(`Figma did not render node ${id}.`);
    return url;
  });
}
