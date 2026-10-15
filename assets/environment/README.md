# Ambiente do jogo

Este diretório é reservado à integração do cenário pós-apocalíptico do Umbral Realm.

A seleção inicial e o plano de camadas estão em [docs/ENVIRONMENT_ASSET_PLAN.md](../../docs/ENVIRONMENT_ASSET_PLAN.md).

O mantenedor, na condição declarada de autor ou titular dos assets, autorizou em 14 de outubro de 2026 o uso e a redistribuição do pack no repositório público do Umbral Realm. A autorização e a inspeção técnica estão registradas no plano. Extraia apenas os arquivos efetivamente usados e preserve a informação de autoria; não copie o pack inteiro sem necessidade.

## Integração atual

São três pastas, todas alimentadas por `tools/build-environment-assets.py` a partir de `docs/PostApocalypse_AssetPack_v1.1.2.zip`:

- `trail/` — pisos 512×512 das áreas, estrada de terra, transições de área, tijolo das paredes e os props da trilha (bush, entulho, lixeira, barril, paredes destruídas).
- `border/` — dezenove objetos de `Objects/Nature/Dark-Green/` que formam a mata que fecha as quatro bordas do mapa.
- `street/` — vinte e oito objetos urbanos de `Objects/` (destroços de veículos, postes, bancos, entulho) distribuídos ao longo da estrada.

Os nomes foram normalizados para uso no Phaser. O posicionamento autoral e as colisões ficam em `src/world-config.js`, separados da arte. Nada é copiado além dessas listas; o pack completo continua apenas dentro do ZIP em `docs/`.

Não foi encontrado um asset de fogueira no pack. A fogueira da clareira é desenhada com primitivas do Phaser e animada por tween, sem substituir ou atribuir incorretamente um sprite do pacote.
