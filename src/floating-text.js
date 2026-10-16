((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralFloatingText = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Helper compartilhado para texto flutuante com fade. Centraliza o tween
  // repetido em game.js (dano, erro, XP, coleta de núcleo) para manter
  // duração/easing consistentes e garantir destroy() ao fim.
  function floatAndFade(scene, target, options = {}) {
    if (!scene || !target) return target;
    const tweenOptions = Object.assign({
      y: target.y - 20,
      alpha: 0,
      duration: 600,
      ease: "Cubic.easeOut"
    }, options || {});
    scene.tweens.add(Object.assign({}, tweenOptions, {
      targets: target,
      onComplete: () => {
        if (target && typeof target.destroy === "function") target.destroy();
        if (typeof tweenOptions.onComplete === "function") tweenOptions.onComplete();
      }
    }));
    return target;
  }

  return { floatAndFade };
});
