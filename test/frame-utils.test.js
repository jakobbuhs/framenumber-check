import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeFrameNumber, lookupFrame } from "../frame-utils.js";

test("normalizeFrameNumber strips spaces and symbols and upper-cases", () => {
  assert.equal(normalizeFrameNumber("  011 abc-123 "), "011ABC123");
  assert.equal(normalizeFrameNumber("aVaNt/40"), "AVANT40");
});

test("normalizeFrameNumber handles empty / non-usable input", () => {
  assert.equal(normalizeFrameNumber(""), "");
  assert.equal(normalizeFrameNumber(null), "");
  assert.equal(normalizeFrameNumber(undefined), "");
  assert.equal(normalizeFrameNumber("   "), "");
  assert.equal(normalizeFrameNumber("---"), "");
});

test("lookupFrame returns 'empty' when nothing usable was typed", () => {
  const set = new Set(["11807"]);
  assert.deepEqual(lookupFrame("", set), { state: "empty" });
  assert.deepEqual(lookupFrame("  ", set), { state: "empty" });
});

test("lookupFrame finds an exact (normalized) match", () => {
  const set = new Set(["1180614159"]);
  const r = lookupFrame(" 1180614159 ", set);
  assert.equal(r.state, "hit");
  assert.equal(r.sn, "1180614159");
  assert.notEqual(r.viaLeadingZeroStrip, true);
});

test("lookupFrame falls back to leading-zero stripping for digit input", () => {
  const set = new Set(["11807"]);
  const r = lookupFrame("0011807", set);
  assert.equal(r.state, "hit");
  assert.equal(r.sn, "11807");
  assert.equal(r.viaLeadingZeroStrip, true);
});

test("lookupFrame reports a miss for unknown numbers", () => {
  const set = new Set(["11807"]);
  const r = lookupFrame("99999", set);
  assert.equal(r.state, "miss");
  assert.equal(r.sn, "99999");
});

test("lookupFrame does not strip zeros for alphanumeric input", () => {
  const set = new Set(["1180"]);
  // "011ABC" is not all-digits, so no leading-zero fallback -> miss
  assert.equal(lookupFrame("011ABC", set).state, "miss");
});
