import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("member ID socials stay in the masthead on every breakpoint", async () => {
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(tsx, /className=\{styles\.masthead\}/);
  assert.match(tsx, /className=\{styles\.socials\}/);
  assert.doesNotMatch(tsx, /styles\.socialsMobile/);
  assert.doesNotMatch(css, /socialsMobile/);
  assert.doesNotMatch(css, /\.socialsDesktop\s*\{\s*display:\s*none/);
});

test("member since date uses secondary text", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(
    css,
    /\.sinceValue\s*\{[^}]*color:\s*var\(--color-muted\)/s,
  );
  assert.match(css, /\.sinceValue\s*\{[^}]*font-weight:\s*400/s);
});

test("the empty-state profile link capitalizes Complete", async () => {
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  assert.match(tsx, /Complete your profile/);
  assert.doesNotMatch(tsx, />\s*complete your profile\s*</);
});

test("the card hides the profile link using profileDetailsComplete", async () => {
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  assert.match(tsx, /hasDetails = profileDetailsComplete\(/);
});

test("the background stamp is a light watermark", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(css, /\.watermark\s*\{[^}]*opacity:\s*0\.025/s);
});

test("the empty photo well is a darker gray than the white card", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  assert.match(
    css,
    /\.photoButton\s*\{[^}]*background:\s*var\(--color-gray-200\)/s,
  );
  assert.doesNotMatch(
    css,
    /\.photoButton\s*\{[^}]*background:\s*var\(--color-surface-muted\)/s,
  );
  assert.match(tsx, /photoOverlayVisible/);
});

test("the card is shaped like a standard ID-1 card", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(css, /\.face\s*\{[^}]*aspect-ratio:\s*85\.6 \/ 53\.98/s);
  assert.match(css, /\.face\s*\{[^}]*min-height:\s*min-content/s);
});

test("the cohort sits bottom right of member since in tracked caps", async () => {
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  const css = await read("src/components/portal/MemberIdCard.module.css");
  const page = await read("app/portal/page.tsx");
  assert.match(tsx, /className=\{styles\.cohort\}>COHORT \{cohort\}</);
  assert.ok(tsx.indexOf("styles.since}") < tsx.indexOf("styles.cohort}"));
  assert.match(css, /\.footer\s*\{[^}]*justify-content:\s*space-between/s);
  assert.match(css, /\.footer\s*\{[^}]*align-items:\s*last baseline/s);
  assert.match(css, /\.footer\s*\{[^}]*margin-top:\s*auto/s);
  assert.match(css, /\.cohort\s*\{[^}]*letter-spacing:\s*0\.16em/s);
  assert.match(page, /cohort=\{cohortForEmail\(/);
});

test("the card keeps its uppercase labels and lowercase upload copy", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  assert.match(css, /\.docType\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.sinceLabel\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(tsx, /"upload image"/);
});
