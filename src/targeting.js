((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralTargeting = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function distanceBetween(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function findNearest(origin, targets, maxRange = Infinity) {
    let nearest = null;
    let nearestDistance = maxRange;
    for (const target of targets) {
      if (target.available === false) continue;
      const distance = distanceBetween(origin, target);
      if (distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function approachVector(origin, target, stopRange) {
    const offsetX = target.x - origin.x;
    const offsetY = target.y - origin.y;
    const distance = Math.hypot(offsetX, offsetY);
    if (distance <= stopRange || distance === 0) {
      return { reached: true, x: 0, y: 0, distance };
    }
    return { reached: false, x: offsetX / distance, y: offsetY / distance, distance };
  }

  return { distanceBetween, findNearest, approachVector };
});
