# Arquitetura — Umbral Realm

## Visão geral
PWA estática (HTML/CSS/JS + Phaser 3). Sem backend. Estado persistido em localStorage.

## Módulos
- `src/game-state.js`: normalização, XP, morte, progresso.
- `src/combat-rules.js`: dano, acerto, skills.
- `src/enemy-rules.js`: definições de inimigos.
- `src/item-rules.js`: itens/equipamentos.
- `src/drop-rules.js`: drops físicos.
- `src/world-config.js`: mundo, spawns, colisões.
- `src/targeting.js`, `control-rules.js`, `animation-rules.js`, `combat-feedback.js`, `floating-text.js`.
- `src/game.js`: cena Phaser (UI, input, efeitos) — grande, em refatoração gradual.

## Fluxo
index.html carrega scripts em ordem; módulos expõem globals `Umbral*`. `game.js` consome esses globals.
