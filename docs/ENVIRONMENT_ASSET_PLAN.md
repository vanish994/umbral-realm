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

## Licença e autorização do projeto

O `LICENSE.txt` incluído no ZIP apresenta termos gerais de uso não comercial, pagamento para uso comercial e proibição de redistribuição. Em 14 de outubro de 2026, o mantenedor declarou ser o autor ou titular desses assets e autorizou expressamente seu uso e sua redistribuição no repositório público do Umbral Realm. Esta é uma autorização específica para o projeto; os termos e a autoria originais devem continuar preservados e não se estendem automaticamente a terceiros ou a outros projetos.

Fonte indicada no próprio pack: https://thelazystone.itch.io/post-apocalyptic-pixel-art-asset-pack

## Inspeção técnica realizada

O arquivo contém 1.113 PNGs. Os nove tilesets inicialmente selecionados foram extraídos apenas em diretório temporário, medidos e inspecionados visualmente:

- fundos Dark-Green e Bleak-Yellow: 384×272;
- edifícios cinza: 208×208;
- grama superior: 128×96;
- lixo: 128×64;
- parede de tijolos: 96×48;
- cerca de ferro: 48×64;
- cerca de arame: 80×48;
- telhado: 256×80.

Todos esses tamanhos são compatíveis com uma grade de 16×16, mas cada índice ainda precisa ser escolhido visualmente; transparência ou dimensão divisível por 16, isoladamente, não comprova que um tile forme uma transição correta.

## Integração inicial concluída

A Trilha dos Infectados agora utiliza uma seleção mínima do pack em `assets/environment/trail/`: terreno escuro, árvores, arbustos, pneus, entulho, lixeira, barril e paredes destruídas. O mapa deixou de distribuir vegetação proceduralmente e passou a ter percurso, marcos, props e colisões definidos em `src/world-config.js`.

A fogueira solicitada não existe no pack inspecionado; por isso ela é desenhada e animada diretamente no Phaser. Não foi usado um sprite de disparo ou outro asset incompatível como substituto.

## Próximo passo técnico

Validar visualmente o percurso em Android, principalmente legibilidade dos props em escala 1,5–2,2, passagem entre obstáculos, retorno dos ratos ao território e espaço dos controles sobre a clareira. Só então ampliar ruínas ou trocar mais formas por tiles estruturais.
