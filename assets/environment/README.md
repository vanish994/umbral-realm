# Ambiente do jogo

Este diretório é reservado à integração do cenário pós-apocalíptico do Umbral Realm.

A seleção inicial e o plano de camadas estão em [docs/ENVIRONMENT_ASSET_PLAN.md](../../docs/ENVIRONMENT_ASSET_PLAN.md).

O mantenedor, na condição declarada de autor ou titular dos assets, autorizou em 14 de outubro de 2026 o uso e a redistribuição do pack no repositório público do Umbral Realm. A autorização e a inspeção técnica estão registradas no plano. Extraia apenas os arquivos efetivamente usados e preserve a informação de autoria; não copie o pack inteiro sem necessidade.

## Integração atual

`trail/` contém somente os onze PNGs usados pela Trilha dos Infectados: dois recortes de terreno e nove props. Eles vieram de `docs/PostApocalypse_AssetPack_v1.1.2.zip`; os nomes foram normalizados para uso no Phaser. O posicionamento autoral e as colisões ficam em `src/world-config.js`, separados da arte.

Não foi encontrado um asset de fogueira no pack. A fogueira da clareira é desenhada com primitivas do Phaser e animada por tween, sem substituir ou atribuir incorretamente um sprite do pacote.
