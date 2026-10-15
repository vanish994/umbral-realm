const assert = require("node:assert/strict");
const test = require("node:test");
const { ANALOG_DEADZONE, analogVector, interactionFor } = require("../src/control-rules.js");

test("analogVector ignores tremor inside the deadzone", () => {
  assert.deepEqual(analogVector(0, 0), { x: 0, y: 0, magnitude: 0 });
  assert.deepEqual(analogVector(ANALOG_DEADZONE, 0), { x: 0, y: 0, magnitude: 0 });
  assert.deepEqual(analogVector(0.05, -0.05), { x: 0, y: 0, magnitude: 0 });
  assert.deepEqual(analogVector("lixo", null), { x: 0, y: 0, magnitude: 0 });
});

test("analogVector gives fine control at light tilt and full speed at full tilt", () => {
  const light = analogVector(0.3, 0);
  assert.ok(light.magnitude > 0 && light.magnitude < 0.3, "inclinação leve deve andar mais devagar que o bruto");
  assert.equal(light.y, 0);
  const full = analogVector(1, 0);
  assert.ok(Math.abs(full.magnitude - 1) < 1e-9);
  const diagonal = analogVector(1, 1);
  assert.ok(diagonal.magnitude <= 1, "magnitude nunca passa de 1 mesmo na diagonal");
  assert.ok(Math.abs(diagonal.x - diagonal.y) < 1e-9, "direção diagonal é preservada");
  const beyond = analogVector(3, 0);
  assert.ok(beyond.magnitude <= 1);
});

test("interactionFor only enables talking inside the merchant or campfire ranges", () => {
  const merchant = { x: 2310, y: 430 };
  const campfire = { x: 2260, y: 485 };
  assert.equal(interactionFor({ x: 190, y: 450 }, merchant, campfire), null, "no spawn não há nada para falar");
  assert.deepEqual(interactionFor({ x: 2300, y: 430 }, merchant, campfire), { kind: "merchant", label: "FALAR", hint: "MERCADOR" });
  assert.deepEqual(interactionFor({ x: 2260, y: 470 }, merchant, campfire)?.kind, "merchant", "onde as áreas se sobrepõem, o mercador vence");
  assert.equal(interactionFor({ x: 2200, y: 485 }, merchant, campfire)?.kind, "campfire");
  assert.equal(interactionFor({ x: 2260, y: 485 + 76 }, merchant, campfire), null, "fora dos dois alcances some de novo");
  assert.equal(interactionFor(null, merchant, campfire), null);
});
