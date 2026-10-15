const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const localPath = reference => reference.split(/[?#]/, 1)[0].replace(/^\.\//, "");
const exists = reference => fs.existsSync(path.join(root, localPath(reference)));

function shellEntries() {
  const source = read("service-worker.js");
  const match = source.match(/const SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, "service-worker.js must declare SHELL");
  return [...match[1].matchAll(/"([^"]+)"/g)].map(item => item[1]);
}

test("all local HTML resources exist", () => {
  const html = read("index.html");
  const references = [...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(item => item[1]);
  assert.ok(references.length > 0);
  for (const reference of references) assert.ok(exists(reference), `missing ${reference}`);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net|https?:\/\/[^"']+\.js/);
});

test("offline shell contains every startup resource and Phaser", () => {
  const shell = shellEntries();
  for (const reference of shell) {
    if (reference === "./") continue;
    assert.ok(exists(reference), `missing offline resource ${reference}`);
  }

  const html = read("index.html");
  const startupReferences = [...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)]
    .map(item => item[1])
    .filter(reference => !reference.includes("service-worker.js"));
  for (const reference of startupReferences) {
    assert.ok(shell.some(cached => localPath(cached) === localPath(reference)), `${reference} is not pre-cached`);
  }
  assert.ok(shell.includes("./vendor/phaser/phaser-3.80.1.min.js"));
});

test("all Phaser preload assets are available offline", () => {
  const game = read("src/game.js");
  const loadedAssets = [...game.matchAll(/this\.load\.spritesheet\([^,]+,\s*"([^"]+)"/g)].map(item => item[1]);
  const shell = shellEntries().map(localPath);
  assert.ok(loadedAssets.length > 0);
  for (const asset of loadedAssets) {
    assert.ok(exists(asset), `missing loaded asset ${asset}`);
    assert.ok(shell.includes(localPath(asset)), `${asset} is not pre-cached`);
  }
});

test("every integrated environment and UI asset is available offline", () => {
  const shell = shellEntries().map(localPath);
  for (const directory of ["assets/environment/trail", "assets/ui", "assets/ui-smart"]) {
    const assets = fs.readdirSync(path.join(root, directory)).filter(file => file.endsWith(".png"));
    assert.ok(assets.length > 0);
    for (const asset of assets) {
      const reference = `${directory}/${asset}`;
      assert.ok(shell.includes(reference), `${reference} is not pre-cached`);
    }
  }
});

test("combat audio files loaded by Phaser exist and are available offline", () => {
  const game = read("src/game.js");
  const loadedAudio = [...game.matchAll(/this\.load\.audio\([^,]+,\s*"([^"]+)"/g)].map(match => match[1]);
  const shell = shellEntries().map(localPath);
  assert.equal(loadedAudio.length, 2);
  for (const audio of loadedAudio) {
    assert.ok(exists(audio), `missing audio ${audio}`);
    assert.ok(shell.includes(localPath(audio)), `${audio} is not pre-cached`);
  }
});

test("all local CSS image references exist", () => {
  const css = read("src/style.css");
  const references = [...css.matchAll(/url\(["']?(\.\.\/[^"')]+)["']?\)/g)].map(match => match[1]);
  assert.ok(references.length > 0);
  for (const reference of references) {
    const fromRoot = reference.replace(/^\.\.\//, "");
    assert.ok(exists(fromRoot), `missing CSS asset ${reference}`);
  }
});

test("landscape scene exposes essential touch commands", () => {
  const html = read("index.html");
  for (const id of ["joystick", "touch-action-close", "touch-action-far", "touch-interact", "attack"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing touch control ${id}`);
  }
});

test("manifest exposes installable PNG icon sizes and landscape mode", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.orientation, "landscape");
  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find(candidate => candidate.sizes === size && candidate.type === "image/png");
    assert.ok(icon, `missing ${size} PNG icon`);
    assert.ok(exists(icon.src), `missing icon file ${icon.src}`);
  }
});
