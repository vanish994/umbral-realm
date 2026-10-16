((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralAnimationRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // As folhas direcionais do jogador (idle, walk, death, ataque com faca e tiro) usam a MESMA
  // ordem de linhas. Ela foi conferida comparando cada linha com os PNGs individuais do pack:
  // down, left-down, left-up, up, right-up, right-down.
  const DIRECTIONS = Object.freeze(["down", "left-down", "left-up", "up", "right-up", "right-down"]);
  // Novo personagem 64x64: 8 direções (sprites individuais por direção).
  const PLAYER_DIRECTIONS = Object.freeze(["front", "front-right", "right", "back-right", "back", "back-left", "left", "front-left"]);
  const DIRECTION_ROW = Object.freeze({
    down: 0,
    "left-down": 1,
    "left-up": 2,
    up: 3,
    "right-up": 4,
    "right-down": 5
  });
  // Metadados das duas folhas de ataque fornecidas para o personagem masculino.
  const BASE_FRAME_RATE = 12;
  const ATTACK_WINDOW_MS = Object.freeze({ min: 260, max: 620 });
  const ATTACK_SHEETS = Object.freeze({
    close: Object.freeze({
      action: "close",
      texture: "player-attack-close",
      file: "./assets/characters/male-64/ataque_faca_64x64/character_front_knife_attack.png",
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 6
    }),
    far: Object.freeze({
      action: "far",
      texture: "player-attack-far",
      file: "./assets/characters/male-64/tiro_pistola_64x64/character_front_shoot_pistol.png",
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 6
    })
  });

  function sheetFor(action) {
    return action === "far" ? ATTACK_SHEETS.far : ATTACK_SHEETS.close;
  }

  // Converte um vetor (movimento ou pontaria) na direção lógica do sprite. As poses laterais puras
  // não existem na arte: uma mira exatamente horizontal usa a pose inferior (left-down/right-down),
  // preservando o comportamento que a caminhada já tinha antes das animações de ataque.
  function directionFor(dx, dy) {
    const x = Number(dx) || 0;
    const y = Number(dy) || 0;
    if (x === 0 && y === 0) return "down";
    const degrees = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    if (degrees < 67.5) return "right-down";
    if (degrees < 112.5) return "down";
    if (degrees <= 180) return "left-down";
    if (degrees < 247.5) return "left-up";
    if (degrees < 292.5) return "up";
    return "right-up";
  }

  function playerDirectionFor(dx, dy) {
    const x = Number(dx) || 0;
    const y = Number(dy) || 0;
    if (x === 0 && y === 0) return "front";
    const degrees = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    if (degrees < 22.5 || degrees >= 337.5) return "right";
    if (degrees < 67.5) return "front-right";
    if (degrees < 112.5) return "front";
    if (degrees < 157.5) return "front-left";
    if (degrees < 202.5) return "left";
    if (degrees < 247.5) return "back-left";
    if (degrees < 292.5) return "back";
    return "back-right";
  }

  function isPlayerDirection(direction) {
    return PLAYER_DIRECTIONS.indexOf(direction) !== -1;
  }

  function isValidDirection(direction) {
    return Object.prototype.hasOwnProperty.call(DIRECTION_ROW, direction);
  }

  function rowFor(direction) {
    return isValidDirection(direction) ? DIRECTION_ROW[direction] : DIRECTION_ROW.down;
  }

  function directionOrDefault(direction) {
    return isValidDirection(direction) ? direction : "down";
  }

  function playerDirectionOrDefault(direction) {
    return isPlayerDirection(direction) ? direction : "front";
  }

  function attackKey(action, direction) {
    const slug = action === "far" ? "far" : "close";
    return `player-attack-${slug}-${playerDirectionOrDefault(direction)}`;
  }

  // A janela visível do ataque acompanha a recarga da arma: golpes curtos ficam rápidos e
  // disparos pesados não prendem o personagem por tempo demais na tela.
  function attackWindowMs(action, weapon) {
    const cooldown = Number(weapon?.cooldown);
    const safe = Number.isFinite(cooldown) && cooldown > 0 ? cooldown : ATTACK_WINDOW_MS.max;
    return Math.round(Math.min(ATTACK_WINDOW_MS.max, Math.max(ATTACK_WINDOW_MS.min, safe)));
  }

  function baseDurationMs(action) {
    return sheetFor(action).frameCount / BASE_FRAME_RATE * 1000;
  }

  function timeScaleFor(action, weapon) {
    return baseDurationMs(action) / attackWindowMs(action, weapon);
  }

  return Object.freeze({
    DIRECTIONS,
    PLAYER_DIRECTIONS,
    DIRECTION_ROW,
    ATTACK_SHEETS,
    ATTACK_WINDOW_MS,
    BASE_FRAME_RATE,
    sheetFor,
    rowFor,
    isValidDirection,
    directionOrDefault,
    playerDirectionOrDefault,
    directionFor,
    playerDirectionFor,
    isPlayerDirection,
    attackKey,
    attackWindowMs,
    baseDurationMs,
    timeScaleFor
  });
});
