((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralControlRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Regras puras dos controles touch (sem Phaser/DOM): precisão do analógico e
  // disponibilidade contextual da interação. Testável sem navegador.
  const ANALOG_DEADZONE = 0.12;
  const MERCHANT_RANGE = 85;
  const CAMPFIRE_RANGE = 75;

  // Converte a deflexão bruta do joystick (-1..1 por eixo) em vetor analógico preciso:
  // - zona morta central: tremores do dedo não movem o personagem;
  // - reescala o restante para 0..1, para a precisão começar logo após a zona morta;
  // - curva suave (expoente > 1) que dá mais resolução nas inclinações leves,
  //   onde o jogador faz ajustes finos de mira/posição;
  // - magnitude final nunca passa de 1 (a velocidade usa essa magnitude).
  function analogVector(rawX, rawY) {
    const x = Number(rawX) || 0;
    const y = Number(rawY) || 0;
    const magnitude = Math.hypot(x, y);
    if (magnitude <= ANALOG_DEADZONE || magnitude === 0) return { x: 0, y: 0, magnitude: 0 };
    const clamped = Math.min(1, magnitude);
    const rescaled = (clamped - ANALOG_DEADZONE) / (1 - ANALOG_DEADZONE);
    const curved = Math.pow(rescaled, 1.15);
    return { x: x / magnitude * curved, y: y / magnitude * curved, magnitude: curved };
  }

  function distance(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot((Number(b.x) || 0) - (Number(a.x) || 0), (Number(b.y) || 0) - (Number(a.y) || 0));
  }

  // Única fonte dos alcances de interação (os mesmos usados por `interact()`):
  // o botão FALAR só fica disponível quando esta função encontra um alvo.
  // O mercador tem prioridade onde as duas áreas se sobrepõem.
  function interactionFor(position, merchant, campfire) {
    if (!position) return null;
    if (distance(position, merchant) <= MERCHANT_RANGE) return { kind: "merchant", label: "FALAR", hint: "MERCADOR" };
    if (distance(position, campfire) <= CAMPFIRE_RANGE) return { kind: "campfire", label: "FOGUEIRA", hint: "CLAREIRA SEGURA" };
    return null;
  }

  return { ANALOG_DEADZONE, MERCHANT_RANGE, CAMPFIRE_RANGE, analogVector, interactionFor };
});
