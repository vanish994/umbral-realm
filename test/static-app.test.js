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

test("player death sprites are animated and available offline", () => {
  const game = read("src/game.js");
  const shell = shellEntries().map(localPath);
  assert.match(game, /player-death/);
  assert.match(game, /handlePlayerDeath/);
  assert.match(game, /State\.applyDeathPenalty/);
  assert.ok(shell.includes("assets/characters/male/Death/death_normal.png"));
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

test("background music streams after interaction, loops quietly, and is cached", () => {
  const game = read("src/game.js");
  const music = "./docs/wasteland-we-are-all-astronauts-main-version-37037-02-20.mp3";
  assert.match(game, /new Audio\("\.\/docs\/wasteland-we-are-all-astronauts-main-version-37037-02-20\.mp3"\)/);
  assert.match(game, /backgroundMusic\.loop = true/);
  assert.match(game, /backgroundMusic\.volume = 0\.16/);
  assert.ok(exists(music));
  assert.ok(shellEntries().includes(music));
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

test("operational notices remain accessible without visual toast overlays", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /id="toast"|id="status"/);
  assert.match(html, /id="announcer"[^>]*class="sr-only"/);
  assert.doesNotMatch(read("src/style.css"), /#toast/);
});

test("development HUD exposes finite magazines with an infinite reserve", () => {
  const html = read("index.html");
  const game = read("src/game.js");
  assert.match(html, /Revólver \.38: 6 \/ 6 • reserva ∞/);
  assert.match(html, /id="reload"/);
  assert.match(html, /id="touch-reload"/);
  assert.match(game, /DEVELOPMENT_INFINITE_RESERVE/);
  assert.match(game, /state\.ammo/);
});

test("field terminal menu matches the approved desk composition and exposes four functional pages", () => {
  const html = read("index.html");
  const css = read("src/style.css");
  assert.match(html, /id="smartphone-menu"[^>]*role="dialog"/);
  for (const prop of ["desk-paper", "desk-pencil", "desk-drive", "desk-disc", "desk-card"]) assert.match(html, new RegExp(prop));
  assert.match(html, /class="smartphone-device field-phone"/);
  assert.match(css, /\.smartphone-device\.field-phone\{[^}]*width:min\(92vw,960px\)[^}]*height:min\(84vh,500px\)/);
  assert.match(css, /repeating-linear-gradient\(90deg/);
  for (const page of ["character", "status", "skills", "inventory"]) {
    assert.match(html, new RegExp(`data-menu-page="${page}"`));
    assert.match(html, new RegExp(`data-menu-tab="${page}"`));
  }
  for (const removed of ["map", "quests"]) assert.doesNotMatch(html, new RegExp(`data-menu-(?:page|tab)="${removed}"`));
  for (const id of ["blades-level", "blades-xp", "firearms-level", "firearms-xp", "critical-chance", "critical-multiplier"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("smartphone inventory exposes all seven equippable items", () => {
  const html = read("index.html");
  const itemIds = [...html.matchAll(/data-equip-item="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(itemIds, ["knife", "katana", "revolver", "pistol", "vest", "helmet", "pants"]);
  assert.match(html, /id="status-defense"/);
  const css = read("src/style.css");
  assert.match(css, /\.smartphone-content\{[^}]*overflow:hidden/);
  assert.match(css, /\.field-item-grid\{[^}]*grid-template-columns:repeat\(4,1fr\)[^}]*grid-template-rows:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.field-equipped-grid\{[^}]*grid-template-columns:repeat\(5,1fr\)/);
});

test("landscape scene exposes essential touch commands and immediate multi-touch attack", () => {
  const html = read("index.html");
  const game = read("src/game.js");
  for (const id of ["joystick", "touch-action-close", "touch-action-far", "touch-reload", "touch-interact", "attack"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing touch control ${id}`);
  }
  assert.match(game, /el\("attack"\)\.addEventListener\("pointerdown"/);
  assert.match(read("src/style.css"), /\.game-attack\{[^}]*touch-action:none/);
});

test("merchant trade exposes core inventory and equipment prices", () => {
  const html = read("index.html");
  const game = read("src/game.js");
  assert.match(html, /id="core-summary"/);
  assert.match(game, /sellAllCores/);
  assert.match(game, /merchantMode/);
});

test("exploration HUD overlays health, XP, ammunition, and a circular minimap", () => {
  const html = read("index.html");
  const css = read("src/style.css");
  const game = read("src/game.js");
  assert.match(html, /class="hud world-hud"/);
  assert.match(html, /id="world-ammo"/);
  assert.match(html, /id="minimap-canvas"/);
  assert.doesNotMatch(html, /class="enemy-panel"|id="enemy-(?:label|hp)/);
  assert.match(css, /\.minimap\{[^}]*border-radius:50%/);
  assert.match(game, /drawMinimap\(\)/);
  assert.match(game, /wideViewport \? 1\.02/);
});

test("living enemies can be clicked to become the explicit combat target", () => {
  const game = read("src/game.js");
  assert.match(game, /enemy\.setInteractive/);
  assert.match(game, /selectedEnemyIndex = enemy\.enemyIndex/);
  assert.match(game, /function combatTarget/);
  assert.match(game, /updateTargetMarker/);
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

test("attack sheets declared in the animation rules exist, are pre-cached and are loaded by the scene", () => {
  const rules = require("../src/animation-rules.js");
  const shell = shellEntries().map(localPath);
  const game = read("src/game.js");
  for (const action of ["close", "far"]) {
    const sheet = rules.sheetFor(action);
    assert.ok(exists(sheet.file), `missing attack sheet ${sheet.file}`);
    assert.ok(shell.includes(localPath(sheet.file)), `${sheet.file} is not pre-cached`);
    assert.match(game, new RegExp(`load\\.spritesheet\\("${sheet.texture}", AnimationRules\\.sheetFor\\("${action}"\\)\\.file`));
  }
  assert.match(game, /playAttackAnimation\(action\)/);
  assert.match(game, /attackAnimationActive\(\)/);
  assert.match(game, /AnimationRules\.attackKey\(action, direction\)/);
  assert.match(game, /AnimationRules\.timeScaleFor\(action, weapon\)/);
  // O timeScale do ataque não pode ficar preso ao sprite depois do golpe.
  assert.match(game, /function playPlayerAnimation/);
  assert.match(game, /player\.anims\.timeScale = 1/);
  assert.doesNotMatch(game, /player\.play\(`player-death-/, "death must go through playPlayerAnimation");
});

test("directional player sheets share one row order and the correct up row", () => {
  const game = read("src/game.js");
  const rules = require("../src/animation-rules.js");
  assert.match(game, /AnimationRules\.DIRECTIONS\.forEach/);
  assert.match(game, /AnimationRules\.rowFor\(direction\)/);
  assert.doesNotMatch(game, /const directions = \[/, "the duplicated direction list must not come back");
  const serialized = JSON.stringify(rules.DIRECTION_ROW);
  assert.equal(rules.DIRECTION_ROW.up, 3);
  assert.match(serialized, /"up":3/);
});

test("attack animation files record their drawing metadata next to the sheets", () => {
  const knife = JSON.parse(read("assets/characters/male/Attack/knife-attack.json"));
  assert.equal(knife.meta.frameWidth, 48);
  assert.equal(knife.meta.frameHeight, 64);
  assert.equal(knife.meta.columns, 12);
  assert.equal(knife.meta.rows, 6);
  assert.deepEqual(knife.meta.directionOrder, ["down", "left-down", "left-up", "up", "right-up", "right-down"]);
  const shoot = JSON.parse(read("assets/characters/male/Shoot/pistol-shoot.json"));
  assert.equal(shoot.meta.frameWidth, 48);
  assert.equal(shoot.meta.image, "pistol-shoot.png");
  assert.equal(shoot.meta.frameHeight, 64);
  assert.equal(shoot.meta.columns, 8);
  assert.equal(shoot.meta.rows, 6);
  assert.equal(shoot.fireFrameIndexInAnimation, 4);
});

test("the knife source art and its converter stay in the repository", () => {
  assert.ok(exists("docs/source-art/male-slash-source.jpeg"));
  assert.ok(exists("tools/build-slash-sheet.py"));
  const converter = read("tools/build-slash-sheet.py");
  assert.match(converter, /def white_key/);
  assert.match(converter, /HOLD_SEQUENCE/);
  assert.match(converter, /DIRECTIONS = \["down", "left-down", "left-up", "up", "right-up", "right-down"\]/);
});

test("attack sheet PNGs keep the grid declared by the animation rules", () => {
  const rules = require("../src/animation-rules.js");
  const header = reference => {
    const bytes = fs.readFileSync(path.join(root, localPath(reference)));
    assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", `${reference} must be a PNG`);
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  };
  for (const action of ["close", "far"]) {
    const sheet = rules.sheetFor(action);
    const size = header(sheet.file);
    assert.equal(size.width, sheet.frameWidth * sheet.frameCount, `${sheet.file} width must fit ${sheet.frameCount} frames`);
    assert.equal(size.height, sheet.frameHeight * rules.DIRECTIONS.length, `${sheet.file} height must fit 6 directions`);
  }
});

test("every enemy species declared in the rules has art, a visual profile and an offline copy", () => {
  const rules = require("../src/enemy-rules.js");
  const game = read("src/game.js");
  const shell = shellEntries().map(localPath);
  const species = [...new Set(rules.ENEMIES.map(enemy => enemy.species))];
  assert.ok(species.length >= 5);
  for (const name of species) {
    const key = name.includes("-") ? `"${name}"` : name;
    assert.match(game, new RegExp(`${key.replace("-", "\\-")}: Object\\.freeze\\(\\{ key: "`), `espécie ${name} sem perfil visual em game.js`);
  }
  for (const name of ["scavenger", "mutant"]) {
    assert.ok(species.includes(name), `${name} deve existir nas regras`);
    const asset = `assets/enemies/${name}/idle.png`;
    assert.ok(exists(asset), `faltando ${asset}`);
    assert.ok(shell.includes(asset), `${asset} não está no cache offline`);
    assert.ok(exists(`assets/enemies/${name}/idle.json`), `faltando metadados de ${name}`);
    assert.match(game, new RegExp(`load\\.spritesheet\\("${name}-idle", "\\./${asset}"`), `${name} não é carregado pela cena`);
  }
});

test("enemy sheets follow the rotation frame order confirmed with the maintainer art", () => {
  const fs2 = fs;
  const cellOf = (file, size) => {
    const bytes = fs2.readFileSync(path.join(root, file));
    assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), size };
  };
  for (const [file, size, columns, rows] of [
    ["assets/enemies/zombie-rat/Um_rato_zombie-Idle.png", 32, 8, 1],
    ["assets/enemies/zombie-wolf/idle.png", 32, 8, 1],
    ["assets/enemies/slow-zombie/idle.png", 48, 8, 1],
    ["assets/enemies/scavenger/idle.png", 32, 8, 1],
    ["assets/enemies/mutant/idle.png", 32, 8, 1]
  ]) {
    const png = cellOf(file, size);
    assert.equal(png.width, size * columns, `${file} deve ter ${columns} colunas de ${size}px`);
    assert.equal(png.height, size * rows, `${file} deve ter ${rows} linha(s) de ${size}px`);
  }
  for (const name of ["scavenger", "mutant"]) {
    const meta = JSON.parse(read(`assets/enemies/${name}/idle.json`));
    assert.equal(meta.spritesheet.columns, 8);
    assert.equal(meta.spritesheet.cell_size.width, 32);
    assert.deepEqual(meta.meta.directionOrder, ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]);
    assert.match(meta.meta.animationNote, /poses paradas/);
  }
  const game = read("src/game.js");
  assert.match(game, /enemy\.setFrame\(\[2, 1, 0, 7, 6, 5, 4, 3\]\[angleSector\]\)/);
});

test("no enemy can reach the refuge line from its spawn", () => {
  const rules = require("../src/enemy-rules.js");
  const world = require("../src/world-config.js");
  const game = read("src/game.js");
  const contactBySpecies = {};
  const profilePattern = /(?:"([a-z-]+)"|([a-z-]+)): Object\.freeze\(\{ key: "[a-z-]+", scale: [\d.]+, offset: \d+, contact: (\d+)/g;
  for (const match of game.matchAll(profilePattern)) {
    contactBySpecies[match[1] || match[2]] = Number(match[3]);
  }
  assert.ok(Object.keys(contactBySpecies).length >= 5, "não foi possível ler ENEMY_VISUALS de game.js");
  for (const spawn of world.enemySpawns) {
    const definition = rules.definition(spawn.id);
    const contact = contactBySpecies[definition.species];
    assert.ok(Number.isFinite(contact), `espécie ${definition.species} sem área de contato`);
    assert.ok(spawn.x + contact <= world.safeZoneX, `${spawn.id} alcança a clareira segura`);
  }
});
