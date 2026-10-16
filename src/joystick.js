((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralJoystick = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Extrai a lógica do analógico virtual para um módulo testável e reutilizável.
  // `touch` é um objeto mutável compartilhado com o loop de movimento da cena.
  function setup({ joystick, joystickKnob, controlRules, touch }) {
    let pointerId = null;
    function reset() {
      if (touch) { touch.x = 0; touch.y = 0; }
      pointerId = null;
      if (joystickKnob) joystickKnob.style.transform = "translate(0px, 0px)";
      if (joystick) joystick.classList.remove("is-active");
    }
    function move(event) {
      if (pointerId !== event.pointerId) return;
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = Math.min(rect.width, rect.height) * 0.30;
      let x = event.clientX - cx;
      let y = event.clientY - cy;
      const length = Math.hypot(x, y);
      if (length > max) { x = x / length * max; y = y / length * max; }
      const rules = controlRules || {};
      const analog = (typeof rules.analogVector === "function")
        ? rules.analogVector(x / max, y / max)
        : { x: x / max, y: y / max, magnitude: Math.hypot(x / max, y / max) };
      if (touch) { touch.x = analog.x; touch.y = analog.y; }
      if (joystickKnob) joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
      if (joystick) joystick.classList.toggle("is-active", (analog.magnitude || 0) > 0);
    }
    if (joystick) {
      joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        pointerId = event.pointerId;
        if (typeof joystick.setPointerCapture === "function") joystick.setPointerCapture(event.pointerId);
        move(event);
      });
      joystick.addEventListener("pointermove", move);
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => {
        joystick.addEventListener(name, event => { if (pointerId === event.pointerId) reset(); });
      });
    }
    return { reset, move, getPointerId: () => pointerId };
  }
  return { setup };
});
