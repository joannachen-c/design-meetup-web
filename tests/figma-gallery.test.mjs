import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  normalizeNodeId,
  parseFigmaReference,
  pickSlides,
  slideFileName,
} from "../scripts/lib/figma-gallery.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);

function node(id, name, x, y, width = 1080, height = 1440, type = "FRAME") {
  return { id, name, type, absoluteBoundingBox: { x, y, width, height } };
}

test("figma links resolve to a file key and colon node id", () => {
  assert.deepEqual(
    parseFigmaReference(
      "https://www.figma.com/design/XJeZUTHqjIcP9itCbWlith/Design-Meetup-Graphics?node-id=3479-276&t=1FMI5cCORWiK6eJZ-1",
    ),
    { fileKey: "XJeZUTHqjIcP9itCbWlith", nodeId: "3479:276" },
  );
  assert.deepEqual(
    parseFigmaReference(
      "https://www.figma.com/design/XJeZUTHqjIcP9itCbWlith/branch/BRANCHKEY1234567890abcd/Graphics",
    ),
    { fileKey: "BRANCHKEY1234567890abcd", nodeId: null },
  );
  assert.deepEqual(parseFigmaReference("XJeZUTHqjIcP9itCbWlith"), {
    fileKey: "XJeZUTHqjIcP9itCbWlith",
    nodeId: null,
  });
  assert.throws(() => parseFigmaReference("https://www.figma.com/board/abc"));
  assert.equal(normalizeNodeId("5622-163"), "5622:163");
});

test("slides come back row by row, left to right, despite ragged tops", () => {
  // The NYC Invisible Interfaces carousel as it sits in Figma: same row, but
  // the frames' tops drift by up to 24px.
  const children = [
    node("5622:177", "invisible interfaces sf recap", 5484, 4609),
    node("5603:281", "invisible interfaces sf recap", 780, 4617),
    node("5622:163", "invisible interfaces sf recap", 3100, 4633),
    node("5413:58", "invisible interfaces sf recap", 4744, 606),
    node("5622:22", "invisible interfaces sf recap", 1958, 4633),
    node("5622:169", "invisible interfaces sf recap", 4318, 4609),
  ];
  assert.deepEqual(
    pickSlides(children).map((slide) => slide.id),
    ["5413:58", "5603:281", "5622:22", "5622:163", "5622:169", "5622:177"],
  );
});

test("loose photos, vectors, and hidden frames are not slides", () => {
  const children = [
    node("5412:27", "DSC00654 1", 3597, 365, 364, 648, "RECTANGLE"),
    node("5412:34", "Vector 84", 1054, 2428, 630, 698, "VECTOR"),
    node("5412:47", "Frame 1132", 3236, 1215, 1333, 791),
    { ...node("1:2", "hidden draft", 0, 0), visible: false },
    node("1:3", "sticker", 0, 0, 200, 200),
  ];
  assert.deepEqual(
    pickSlides(children).map((slide) => slide.id),
    ["5412:47"],
  );
});

test("--match narrows a busy section to the named recap", () => {
  const children = [
    node("5223:214", "Instagram post - 51", 2030, 2414, 1080, 1350),
    node("5533:21", "AUTUMN ATELIER RECAP 2", 5383, 896, 1080, 1350),
    node("5510:114", "AUTUMN ATELIER RECAP 1", 4166, 896, 1080, 1350),
    node("5223:271", "Frame 1124", 2140, 624, 1080, 1080),
  ];
  assert.deepEqual(
    pickSlides(children, { match: "autumn atelier recap" }).map(
      (slide) => slide.id,
    ),
    ["5510:114", "5533:21"],
  );
});

test("exported files sort in gallery order for upload:gallery", () => {
  assert.equal(
    slideFileName(0, "AUTUMN ATELIER RECAP 1"),
    "01-autumn-atelier-recap-1.png",
  );
  assert.equal(slideFileName(11, "///"), "12-slide.png");
});

test("import:figma-gallery is wired up next to upload:gallery", () => {
  assert.equal(
    packageJson.scripts["import:figma-gallery"],
    "node scripts/import-figma-gallery.mjs",
  );
});
