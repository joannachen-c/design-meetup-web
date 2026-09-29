import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("avatars are stored in Supabase Storage, not the serverless disk", async () => {
  const service = await read("src/lib/membership-service.ts");
  const migration = await read(
    "supabase/migrations/20260929150000_create_member_avatars_bucket.sql",
  );
  assert.match(service, /AVATAR_BUCKET = "member-avatars"/);
  assert.match(service, /storage\.upload\(userId, bytes, \{\s*contentType,\s*upsert: true/);
  assert.match(service, /storage\.download\(userId\)/);
  assert.match(service, /createBucket\(AVATAR_BUCKET, \{ public: false \}\)/);
  assert.match(migration, /values \('member-avatars', 'member-avatars', false\)/);
});

test("a missing avatar falls back to the empty photo instead of a broken image", async () => {
  const card = await read("src/components/portal/MemberIdCard.tsx");
  const header = await read("src/components/portal/PortalHeader.tsx");
  const form = await read("src/components/portal/ProfileForm.tsx");
  assert.match(card, /onError=\{\(\) => setPhoto\(null\)\}/);
  assert.match(header, /onError=\{\(\) => setFailed\(url\)\}/);
  assert.match(form, /onError=\{\(\) => setPreviewUrl\(null\)\}/);
});
