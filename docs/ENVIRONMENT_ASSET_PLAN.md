# Seleção de assets de ambiente — Umbral Realm

Objetivo: trocar o cenário provisório desenhado com formas em `src/game.js` por um cenário 2D pós-apocalíptico, mantendo os personagens atuais e o estilo pixel art.

## Seleção inicial

Prioridade 1 — base do cenário
- `Tiles/Background_Dark-Green_TileSet.png`: base visual escura para áreas contaminadas/abandonadas.
- `Tiles/Background_Bleak-Yellow_TileSet.png`: alternativa para áreas secas, poeirentas e devastadas.
- `Tiles/Grass_On-Top_TileSet.png`: vegetação sobre o terreno e transições de borda, após conferir a grade do tileset.

Prioridade 2 — estruturas e limites
- `Tiles/Buildings/Buildings_gray_TileSet.png`: estruturas de concreto/cinza para ruínas.
- `Tiles/Brick-Wall_TileSet.png`: paredes e restos de construções.
- `Tiles/Iron-Fence_TileSet.png` e `Tiles/Wire-Fence/Wire-Fence_TileSet.png`: cercas para delimitar áreas.
- `Tiles/Roof_TileSet.png`: telhados/partes superiores, se compatíveis com as peças de edifícios.

Prioridade 3 — ambientação
- `Tiles/Garbage_TileSet.png`: lixo e entulho.
- Objetos das pastas `Objects/` relacionados a barris, contêineres, móveis abandonados, portas, ventilação e partes de construções.
- Elementos de vegetação/overgrowth do pack para áreas tomadas pela natureza.

## Ordem de camadas no Phaser

1. `ground`: terreno contínuo e manchas do chão.
2. `ground-details`: lixo pequeno, rachaduras e vegetação baixa.
3. `structures`: paredes, cercas e edifícios.
4. `props-depth`: objetos com ordenação por posição Y, para o personagem passar à frente/atrás.
5. Personagens e inimigos: manter os sprites atuais; não esticar as imagens.
6. `foreground`: peças que devem aparecer à frente do personagem, quando necessário.

## Regras de seleção

- Não importar o pack inteiro para o jogo.
- Não assumir que todos os tiles têm o mesmo tamanho: medir cada tileset e validar visualmente sua grade antes de configurar o mapa.
- Usar poucos arquivos bem escolhidos para o primeiro mapa jogável: chão, ruínas, cercas e entulho.
- Preservar o pixel art com `pixelArt: true` e `roundPixels: true`.
- Manter colisões separadas da arte; o desenho de uma parede não cria colisão automaticamente.
- Não substituir os sprites masculino/feminino já organizados em `assets/characters/`.

## Licença — atenção

O ZIP informa uso gratuito apenas em projetos não comerciais, exige pagamento de pelo menos US$ 2 para uso comercial e proíbe redistribuição do pack. Como o repositório é público, **não copiar os PNGs extraídos para o repositório público sem resolver a questão da licença**. O ZIP original já está em `docs/`; esta lista é apenas um inventário de trabalho, não redistribui imagens adicionais.

Fonte indicada no próprio pack: https://thelazystone.itch.io/post-apocalyptic-pixel-art-asset-pack

## Próximo passo técnico

Medir e inspecionar visualmente os tilesets selecionados; então definir a grade real, recortar os tiles quando necessário e montar uma pequena área de teste antes de substituir o cenário atual.
