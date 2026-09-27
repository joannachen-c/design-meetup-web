import assert from "node:assert/strict";
import test from "node:test";
import {
  formatGraduation,
  graduationYearLabel,
  hasGraduated,
  parseGraduation,
  persistGraduation,
} from "../src/lib/graduation.ts";

test("month and year persist as YYYY-MM in the existing year column", () => {
  assert.equal(formatGraduation("06", "2026"), "2026-06");
  assert.equal(formatGraduation("6", "2026"), "2026-06");
  assert.equal(persistGraduation("2026-6"), "2026-06");
  assert.deepEqual(parseGraduation("2026-06"), { month: "06", year: "2026" });
});

test("year-only values still round-trip so older profiles keep working", () => {
  assert.equal(formatGraduation("", "2024"), "2024");
  assert.equal(persistGraduation("2024"), "2024");
  assert.deepEqual(parseGraduation("2024"), { month: "", year: "2024" });
  assert.equal(graduationYearLabel("2024"), "24");
  assert.equal(graduationYearLabel("2026-06"), "26");
});

test("saving empty dropdowns does not invent a graduation date", () => {
  assert.equal(formatGraduation("", ""), null);
  assert.equal(persistGraduation(""), null);
  assert.equal(persistGraduation("not-a-date"), null);
});

test("hasGraduated is true only after the selected month ends", () => {
  const june2020 = new Date("2020-06-15T12:00:00Z");
  const july2020 = new Date("2020-07-15T12:00:00Z");
  const may2020 = new Date("2020-05-15T12:00:00Z");
  assert.equal(hasGraduated("2020-06", may2020), false);
  assert.equal(hasGraduated("2020-06", june2020), false);
  assert.equal(hasGraduated("2020-06", july2020), true);
  assert.equal(hasGraduated("2020", july2020), true);
  assert.equal(hasGraduated("2020", may2020), false);
  assert.equal(hasGraduated(null, july2020), false);
});
