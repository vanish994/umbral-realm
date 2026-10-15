((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralAnimationRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // As folhas direcionais do jogador (idle, walk, death, ataque com faca e tiro) usam a MESMA
  // ordem de linhas. Ela foi conferida comparando cada linha com os PNGs individuais do pack:
  // down, left-down, left-up, up, right-up, right-down.
  const DIRECTIONS = Object.freeze(["down", "left-down", "left-up", "up", "right-up", "right-down"]);
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
      file: "./assets/characters/male/Attack/knife-attack.png",
      frameWidth: 48,
      frameHeight: 64,
      frameCount: 12
    }),
    far: Object.freeze({
      action: "far",
      texture: "player-attack-far",
      file: "./assets/characters/male/Shoot/pistol-shoot.png",
      frameWidth: 48,
      frameHeight: 64,
      frameCount: 8
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

  function isValidDirection(direction) {
    return Object.prototype.hasOwnProperty.call(DIRECTION_ROW, direction);
  }

  function rowFor(direction) {
    return isValidDirection(direction) ? DIRECTION_ROW[direction] : DIRECTION_ROW.down;
  }

  function directionOrDefault(direction) {
    return isValidDirection(direction) ? direction : "down";
  }

  function attackKey(action, direction) {
    const sheet = sheetFor(action);
    return `${sheet.texture}-${directionOrDefault(direction)}`;
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
    DIRECTION_ROW,
    ATTACK_SHEETS,
    ATTACK_WINDOW_MS,
    BASE_FRAME_RATE,
    sheetFor,
    rowFor,
    isValidDirection,
    directionOrDefault,
    directionFor,
    attackKey,
    attackWindowMs,
    baseDurationMs,
    timeScaleFor
  });
});
