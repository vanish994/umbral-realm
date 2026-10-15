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

test("manifest exposes installable PNG icon sizes and landscape mode", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.orientation, "landscape");
  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find(candidate => candidate.sizes === size && candidate.type === "image/png");
    assert.ok(icon, `missing ${size} PNG icon`);
    assert.ok(exists(icon.src), `missing icon file ${icon.src}`);
  }
});
