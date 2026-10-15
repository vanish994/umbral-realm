const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("touch weapons are a professional cluster with icons, labels and live details", () => {
  const html = read("index.html");
  for (const id of ["touch-action-close", "touch-action-far", "touch-reload", "touch-interact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing ${id}`);
  }
  assert.match(html, /class="touch-weapon selected"/);
  assert.match(html, /class="touch-weapon-icon" src="\.\/assets\/items\/knife\.png"/);
  assert.match(html, /data-control-label/);
  assert.match(html, /data-weapon-detail/);
  const game = read("src/game.js");
  assert.match(game, /setButtonLabel\(el\("touch-action-far"\)/);
  assert.match(game, /touch-weapon-icon/, "o ícone acompanha a arma equipada (faca/katana, revólver/pistola)");
});

test("talk button starts hidden and is only enabled by the shared interaction rule", () => {
  const html = read("index.html");
  assert.match(html, /id="touch-interact"[^>]*hidden disabled/);
  assert.match(html, /id="interact"[^>]*hidden disabled/);
  const game = read("src/game.js");
  assert.match(game, /ControlRules\.interactionFor\(player, World\.merchant, World\.campfire\)/);
  assert.match(game, /updateInteractControls/);
  assert.match(game, /button\.hidden = !target/);
  const css = read("src/style.css");
  assert.match(css, /\.interact-command\.is-available\{[^}]*animation:interact-in/);
  assert.match(css, /\[hidden\]\{display:none!important\}/);
});

test("joystick is bigger, inset from the corner, and precise with proportional speed", () => {
  const css = read("src/style.css");
  assert.match(css, /@media \(orientation:landscape\) and \(max-height:600px\)\{\.joystick\{left:20px;bottom:18px;width:116px/);
  assert.match(css, /\.joystick\{left:24px;bottom:22px;width:132px/);
  const game = read("src/game.js");
  assert.match(game, /ControlRules\.analogVector/);
  assert.match(game, /145 \* speedScale/, "inclinar pouco anda devagar; inclinar tudo, rápido");
});
