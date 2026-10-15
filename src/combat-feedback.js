((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralCombatFeedback = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function healthRatio(current, maximum) {
    const hp = Number(current);
    const maxHp = Number(maximum);
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return 0;
    return Math.max(0, Math.min(1, hp / maxHp));
  }

  function damageLabel(amount) {
    const damage = Number(amount);
    if (!Number.isFinite(damage) || damage <= 0) return "-0";
    return `-${Math.floor(damage)}`;
  }

  function experienceLabel(amount) {
    const xp = Number(amount);
    if (!Number.isFinite(xp) || xp <= 0) return "+0 XP";
    return `+${Math.floor(xp)} XP`;
  }

  return { healthRatio, damageLabel, experienceLabel };
});
