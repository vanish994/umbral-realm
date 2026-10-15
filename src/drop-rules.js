((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralDropRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Núcleos derrubados viram entidades físicas no chão até o jogador passar por cima.
  // Este módulo é puro (sem Phaser/DOM) para a coleta, o teto de entidades e a
  // normalização do save serem testáveis sem navegador.
  const PICKUP_RADIUS = 36;
  const MAX_GROUND_DROPS = 40;

  function whole(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function coordinate(value, fallback, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.round(Math.min(max, Math.max(0, parsed)));
  }

  // Retorna null para entradas inválidas em vez de fabricar um drop jogável.
  function createDrop(level, x, y, bounds = { width: 4300, height: 1500 }) {
    const safeLevel = whole(level, 0, 0, Number.MAX_SAFE_INTEGER);
    if (safeLevel <= 0) return null;
    const width = whole(bounds?.width, 4300, 1, Number.MAX_SAFE_INTEGER);
    const height = whole(bounds?.height, 1500, 1, Number.MAX_SAFE_INTEGER);
    const safeX = coordinate(x, NaN, width);
    const safeY = coordinate(y, NaN, height);
    if (!Number.isFinite(safeX) || !Number.isFinite(safeY)) return null;
    return { level: safeLevel, x: safeX, y: safeY };
  }

  // Acrescenta sem mutar a lista atual; ao passar do teto, o drop mais antigo some
  // (FIFO) para o save e a cena nunca crescerem sem limite em sessões longas de farm.
  function addDrop(drops, drop) {
    const list = Array.isArray(drops) ? drops.filter(entry => entry && entry.level > 0) : [];
    if (!drop) return list.slice(-MAX_GROUND_DROPS);
    return [...list, drop].slice(-MAX_GROUND_DROPS);
  }

  function distanceTo(drop, x, y) {
    return Math.hypot(drop.x - (Number(x) || 0), drop.y - (Number(y) || 0));
  }

  function isInPickupRange(drop, x, y, radius = PICKUP_RADIUS) {
    if (!drop) return false;
    const safeRadius = Number.isFinite(Number(radius)) && Number(radius) > 0 ? Number(radius) : PICKUP_RADIUS;
    return distanceTo(drop, x, y) <= safeRadius;
  }

  // O candidato de coleta é o drop válido mais próximo dentro do raio, nunca um fora dele.
  function pickupCandidate(drops, x, y, radius = PICKUP_RADIUS) {
    if (!Array.isArray(drops)) return null;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const drop of drops) {
      if (!drop || !(drop.level > 0)) continue;
      const distance = distanceTo(drop, x, y);
      if (distance < nearestDistance) {
        nearest = drop;
        nearestDistance = distance;
      }
    }
    return nearest && isInPickupRange(nearest, x, y, radius) ? nearest : null;
  }

  function removeDrop(drops, target) {
    if (!Array.isArray(drops)) return [];
    const index = drops.indexOf(target);
    if (index === -1) return [...drops];
    return drops.filter((_, entryIndex) => entryIndex !== index);
  }

  // Normaliza o save: só níveis conhecidos, coordenadas dentro do mundo e teto de entidades.
  // Entradas corrompidas são descartadas (não reparadas para um drop falso).
  function normalizeDrops(raw, validLevels, bounds = { width: 4300, height: 1500 }) {
    if (!Array.isArray(raw)) return [];
    const levels = new Set((Array.isArray(validLevels) ? validLevels : []).map(level => whole(level, 0, 0, Number.MAX_SAFE_INTEGER)));
    const normalized = [];
    for (const entry of raw) {
      const drop = createDrop(entry?.level, entry?.x, entry?.y, bounds);
      if (!drop || !levels.has(drop.level)) continue;
      normalized.push(drop);
      if (normalized.length >= MAX_GROUND_DROPS) break;
    }
    return normalized;
  }

  return { PICKUP_RADIUS, MAX_GROUND_DROPS, createDrop, addDrop, distanceTo, isInPickupRange, pickupCandidate, removeDrop, normalizeDrops };
});
