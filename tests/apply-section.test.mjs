import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const APPLY_FORM_EMBED =
  "https://docs.google.com/forms/d/e/1FAIpQLSfBFkDYfOIqNxHxoJKFVA_izf3MRaHCKeJOe6RSGxHzN1FDqw/viewform?embedded=true";

test("apply section sits between the founders note and the footer", () => {
  assert.match(
    app,
    /<FoundersNote \/>\s*<section[\s\S]*className="[^"]*\bapply-cta\b[^"]*"[\s\S]*id="apply"[\s\S]*>\s*[\s\S]*>\s*Applications are open\s*<\/h2>[\s\S]*<\/section>\s*<PhotoMarquee events=\{events\} \/>\s*<SiteFooter \/>/,
  );
});

test("apply section embeds the membership Google Form and keeps social links", () => {
  assert.match(
    app,
    /Applications are open for the next Design Meetup member cohort\. If you&apos;re a student or early career designer, we&apos;d love to meet you—apply below\./,
  );
  assert.match(
    app,
    /<p className="m-0 text-pretty">\s*Follow us on Instagram and Substack to stay updated!\s*<\/p>/,
  );
  assert.doesNotMatch(app, /ApplyNotifyForm/);
  assert.match(app, /const APPLY_FORM_EMBED_SRC =\s*"https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLSfBFkDYfOIqNxHxoJKFVA_izf3MRaHCKeJOe6RSGxHzN1FDqw\/viewform\?embedded=true"/);
  assert.match(app, new RegExp(APPLY_FORM_EMBED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(
    app,
    /<iframe[\s\S]*className="[^"]*\bapply-form-frame\b[^"]*"[\s\S]*src=\{APPLY_FORM_EMBED_SRC\}[\s\S]*title="Design Meetup membership application"/,
  );
  assert.match(
    app,
    /<Primary[\s\S]*variant="secondary"[\s\S]*href="https:\/\/www\.instagram\.com\/designmeetup\/"[\s\S]*Instagram[\s\S]*<\/Primary>/,
  );
  assert.match(
    app,
    /<Primary[\s\S]*variant="secondary"[\s\S]*href="https:\/\/designmeetup\.substack\.com\/"[\s\S]*Substack[\s\S]*<\/Primary>/,
  );
  assert.match(app, /<InstagramIcon className="size-5/);
  assert.match(app, /<InstagramIcon\s+branded/);
  assert.match(app, /<SubstackIcon className="size-5/);
  assert.match(app, /group-hover:text-\[#FF6719\]/);
  assert.match(
    app,
    /className="group gap-2"[\s\S]*Instagram[\s\S]*className="group gap-2"[\s\S]*Substack/,
  );
});

test("apply section uses the shared responsive twelve-column layout with form embed", () => {
  assert.match(
    css,
    /\.apply-cta\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(css, /\.apply-copy\s*\{[^}]*grid-column:\s*1\s*\/\s*span 4;/s);
  assert.match(css, /\.apply-form\s*\{[^}]*grid-column:\s*6\s*\/\s*span 7;/s);
  assert.match(css, /\.apply-form-frame\s*\{[^}]*min-height:\s*720px;/s);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.apply-cta\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.apply-copy,\s*\.apply-form\s*\{[^}]*grid-column:\s*1;/s,
  );
});
