import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isOrganizerEmail } from "../src/lib/organizers.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("only the four organizers' portal emails count as organizers", () => {
  for (const email of [
    "studio@liumichelle.com",
    " Studio@LiuMichelle.com ",
    "iy53@cornell.edu",
    "bl628@cornell.edu",
    "jc2887@cornell.edu",
  ]) {
    assert.equal(isOrganizerEmail(email), true, email);
  }
  for (const email of ["demo@designmeetup.info", "emilyshenucla@gmail.com", "", null, undefined]) {
    assert.equal(isOrganizerEmail(email), false, String(email));
  }
});

test("the Planning tab is the third tab and only for organizers", async () => {
  const header = await read("src/components/portal/PortalHeader.tsx");
  const layout = await read("app/portal/layout.tsx");
  assert.match(
    header,
    /\.\.\.memberNav,\s*\{ href: "\/portal\/planning", label: "Planning" \}/,
  );
  assert.match(header, /const nav = organizer \? organizerNav : memberNav;/);
  assert.match(layout, /organizer=\{organizer\}/);
});

test("the planning route is gated server-side", async () => {
  const page = await read("app/portal/planning/page.tsx");
  assert.match(page, /await requireOrganizer\("\/portal\/planning"\)/);
  const access = await read("src/lib/portal-access.ts");
  assert.match(access, /if \(!\(await isOrganizerSession\(user\)\)\) notFound\(\);/);
});
