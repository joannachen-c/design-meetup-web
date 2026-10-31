import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  EMPTY_FILTERS,
  filterDirectory,
  normalizeDisciplines,
  regionsForLocation,
  sortDirectory,
} from "../src/lib/directory.ts";
import {
  pendingMembers,
  roleLine,
  toMemberCard,
  toTeamRow,
} from "../src/lib/directory-people.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function profile(overrides = {}) {
  return {
    id: "u1",
    email: "member@example.com",
    displayName: "Ada Lovelace",
    avatarUrl: null,
    school: null,
    year: null,
    company: null,
    position: null,
    location: null,
    website: null,
    instagram: null,
    x: null,
    linkedin: null,
    youtube: null,
    github: null,
    disciplines: [],
    stripeCustomerId: "cus_123",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

const row = (overrides, tier = "professional") => ({
  profile: profile(overrides),
  membership: { tier, status: "active" },
});

test("free-text locations map to regions", () => {
  assert.deepEqual(regionsForLocation("NYC"), ["nyc"]);
  assert.deepEqual(regionsForLocation("New York, NY"), ["nyc"]);
  assert.deepEqual(regionsForLocation("sf"), ["sf"]);
  assert.deepEqual(regionsForLocation("Berkeley"), ["sf"]);
  assert.deepEqual(regionsForLocation("Los Angeles, CA"), ["la"]);
  assert.deepEqual(regionsForLocation("Bay + LA"), ["sf", "la"]);
  assert.deepEqual(regionsForLocation("Dallas"), ["elsewhere"]);
  assert.deepEqual(regionsForLocation(""), []);
});

test("disciplines keep known values only, in catalog order", () => {
  assert.deepEqual(normalizeDisciplines(["motion", "product", "motion", "hacking"]), [
    "product",
    "motion",
  ]);
  assert.deepEqual(normalizeDisciplines(null), []);
});

test("role line prefers job, then school with a short grad year", () => {
  assert.equal(roleLine({ position: "Designer", company: "Figma" }), "Designer at Figma");
  assert.equal(roleLine({ position: "", company: "Figma" }), "Figma");
  assert.equal(roleLine({ school: "UCLA", year: "2027-06" }), "UCLA '27");
  assert.equal(roleLine({}), null);
});

test("member cards never carry email, billing, or membership status", () => {
  const card = toMemberCard(
    row({ email: "angela@achudesign.com", website: "achu.design", instagram: "@achu" }),
  );
  const json = JSON.stringify(card);
  assert.doesNotMatch(json, /@achudesign\.com|cus_123|active/);
  assert.equal(card.advisor, true);
  assert.equal(card.links.website, "https://achu.design");
  assert.equal(card.links.instagram, "https://instagram.com/achu");
});

test("team rows add email, cohort, and member since", () => {
  const team = toTeamRow(row({ email: "Studio@LiuMichelle.com" }), null);
  assert.equal(team.email, "studio@liumichelle.com");
  assert.equal(team.cohort, 0);
  assert.equal(team.memberSince, "Mar 2026");
  assert.equal(team.profileComplete, false);
});

test("filters combine search, kind, region, and discipline", () => {
  const cards = [
    toMemberCard(row({ id: "a", displayName: "Ada", location: "NYC", disciplines: ["motion"] })),
    toMemberCard(row({ id: "b", displayName: "Bo", school: "UCLA", location: "LA" }, "student")),
    toMemberCard(row({ id: "c", displayName: "Cy", email: "sophia@framer.com", company: "Framer" })),
  ];
  const ids = (filters) => filterDirectory(cards, { ...EMPTY_FILTERS, ...filters }).map((c) => c.id);
  assert.deepEqual(ids({}), ["a", "b", "c"]);
  assert.deepEqual(ids({ kind: "student" }), ["b"]);
  assert.deepEqual(ids({ kind: "advisor" }), ["c"]);
  assert.deepEqual(ids({ region: "nyc" }), ["a"]);
  assert.deepEqual(ids({ discipline: "motion" }), ["a"]);
  assert.deepEqual(ids({ query: "ucla" }), ["b"]);
  assert.deepEqual(ids({ query: "framer cy" }), ["c"]);
});

test("fuller profiles sort first", () => {
  const sparse = toMemberCard(row({ id: "a", displayName: "Aaron" }));
  const full = toMemberCard(
    row({ id: "z", displayName: "Zoe", avatarUrl: "/a.jpg", position: "Designer", website: "z.com" }),
  );
  assert.deepEqual(sortDirectory([sparse, full]).map((c) => c.id), ["z", "a"]);
});

test("pending members skip anyone with an account", () => {
  const pending = pendingMembers(["angela@achudesign.com"]);
  const emails = pending.map((p) => p.email);
  assert.ok(!emails.includes("angela@achudesign.com"));
  assert.ok(!emails.includes("demo@designmeetup.info"));
  const advisor = pending.find((p) => p.email === "sophia@framer.com");
  assert.deepEqual(advisor?.sources, ["Advisor"]);
});

test("the directory page is members-only and team data stays server-gated", async () => {
  const page = await read("app/portal/directory/page.tsx");
  assert.match(page, /await requirePaidMembership\("\/portal\/directory"\)/);
  assert.match(page, /directoryProps\(await isOrganizerSession\(user\)\)/);
  assert.match(page, /if \(organizer\) \{[\s\S]*toTeamRow[\s\S]*\}\s*return \{[^}]*members: sortDirectory\(rows\.map\(toMemberCard\)\)/);
  const client = await read("src/components/portal/MemberDirectory.tsx");
  assert.doesNotMatch(client, /directory-people|board-of-advisors|signup-allowlist/);
});

test("search finds members by school even when they list a job", () => {
  const card = toMemberCard(row({ school: "UCLA", position: "Designer", company: "Figma" }));
  assert.equal(card.role, "Designer at Figma");
  assert.equal(filterDirectory([card], { ...EMPTY_FILTERS, query: "ucla" }).length, 1);
});

test("directory avatars request thumbnails the avatar route can resize", async () => {
  const route = await read("app/api/portal/avatar/[userId]/route.ts");
  assert.match(route, /THUMBNAIL_WIDTHS = \[64, 128, 256\]/);
  assert.match(route, /\.resize\(width, width, \{ fit: "cover" \}\)/);
  const client = await read("src/components/portal/MemberDirectory.tsx");
  assert.match(client, /thumbnailUrl\(card\.avatarUrl, size === "lg" \? 128 : 64\)/);
});

test("portal-approved signups count as cohort 1 and as pending until they sign up", () => {
  const team = toTeamRow(row({ email: "new.person@example.com" }), null, true);
  assert.equal(team.cohort, 1);
  const pending = pendingMembers([], ["late.add@example.com"]);
  assert.deepEqual(pending.find((p) => p.email === "late.add@example.com")?.sources, [
    "Approved signup",
  ]);
});
