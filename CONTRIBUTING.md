# Contribuindo com o Umbral Realm

## Como executar
- `npm test` — testes unitários (Node).
- `npm run check` — syntax checks + testes.
- Servir estaticamente (ex.: `python3 -m http.server 8000`) e abrir no navegador.

## Convenções
- Lógica de jogo em `src/*-rules.js` e `src/game-state.js` (testável).
- Balanceamento em constantes/config (ver `src/combat-rules.js`, `src/world-config.js`).
- Não substituir assets sem autorização.
- PRs pequenos e verificáveis.

## Testes
- Adicione testes em `test/` para lógica crítica.
- Use RNG injetável para resultados determinísticos.
