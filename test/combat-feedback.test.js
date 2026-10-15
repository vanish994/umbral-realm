const assert = require("node:assert/strict");
const test = require("node:test");
const { damageLabel, healthRatio } = require("../src/combat-feedback.js");

test("healthRatio clamps enemy health bars to a valid width", () => {
  assert.equal(healthRatio(70, 70), 1);
  assert.equal(healthRatio(35, 70), 0.5);
  assert.equal(healthRatio(-5, 70), 0);
  assert.equal(healthRatio(100, 70), 1);
  assert.equal(healthRatio(10, 0), 0);
});

test("damageLabel renders a compact negative combat number", () => {
  assert.equal(damageLabel(13), "-13");
  assert.equal(damageLabel(24.9), "-24");
  assert.equal(damageLabel("invalid"), "-0");
});
