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

## Passe visual do mapa (2026-10-15)

Tudo abaixo foi gerado por `tools/build-environment-assets.py`, que lê o ZIP do pack e escreve em `assets/environment/`. O script mede antes de escolher: costura de cada célula (borda esquerda × direita e topo × base), fração de pixels "marcados" fora da paleta do piso e compatibilidade do anel externo de cada bloco com o piso base. Nenhuma célula foi escolhida por suposição.

### Pisos das áreas (substituem os tiles 16×16)

Cada área passou a usar uma lâmina de 512×512 px (16×16 tiles a 2×), o que reduz a repetição de 16 px para 512 px e coloca o terreno na mesma escala dos personagens e props:

| Área | Piso | Célula base (col, row) | Detalhes |
|---|---|---|---|
| Subúrbio infectado | `ground-bleak` | Bleak-Yellow (5, 0) | clareira de terra 3×2 e blobs de vegetação |
| Mata das ruínas | `ground-dark` | Dark-Green (5, 0) | clareira de terra 3×2 e blobs de vegetação |
| Zona urbana morta | `ground-urban` | Dark-Green (5, 9) concreto | piso de tijolo 3×2 e concreto com marcas 2×2 |
| Clareira do refúgio | `ground-refuge` | Dark-Green (1, 1) calçamento | piso de tijolo e marcas de concreto |

As clareiras usam o bloco (0, 1, 3, 2) do tileset, cujo anel externo é 85% compatível com a grama/terra — é o único bloco medido que se mistura ao piso em vez de formar um quadrado. Claras e detalhes ainda recebem borda em dither de 2 px para não cortar em linha reta.

### Estrada

A estrada deixou de ser um retângulo arredondado do `graphics`. O asfalto claro do tileset (`y=59..67`) foi descartado: a 2× ele virava uma grade de placas claras dominando a tela. A estrada é terra batida a partir da célula (15, 1) do Dark-Green — a melhor costura medida (2,9) e 0% de marcas — com bordas em dither, três trilhas de roda, sete pedras soltas e 64 px de altura a 1× (128 px no mundo).

### Paredes das ruínas

As ruínas eram retângulos cinza desenhados pelo `graphics`. Agora cada retângulo de colisão recebe um `tileSprite` de `wall-brick`, o tijolo do pack em `Tiles/Brick-Wall_TileSet.png` célula (0, 0) a 2× (o único tile da folha sem recorte, entalhe ou buraco), com profundidade `y + h` para cobrir o que está atrás. A arte continua sem criar colisão: quem colide são os retângulos de `World.ruins`.

### Mata das bordas

`assets/environment/border/` recebeu 19 objetos de `Objects/Nature/Dark-Green/` (nove árvores, tronco, dois arbustos, quatro capins, pedra com grama e dois tocos). Eles formam um cinturão em duas linhas por borda — linha externa baixa, linha interna alta — gerado de forma determinística em `src/world-config.js`, mais arbustos rasteiros na transição. As quatro faixas de colisão (`World.borderBands`) fecham o mapa: nenhum ponto alcançável fica a menos de 40 px da beirada, o que é verificado por busca em largura no teste `o jogador não alcança nenhuma beirada do mapa`.

### Cenário urbano

`assets/environment/street/` recebeu 28 objetos de `Objects/`: carros e van destruídos, caminhão, moto, postes, bancos, hidrante, lixeiras, sacos de lixo, cone, placa de pare, bueiro, chapas metálicas, viga, pallet, papelão, carrinho de compras, geladeira, máquina de lavar, máquina de vendas, tijolo solto, entulho, contêiner e cano de escapamento. Bueiro e chapas ficam na camada `flat` (profundidade 2, abaixo dos personagens).

### Ordem de camadas usada hoje

1. `ground`: lâminas 512×512 das áreas (depth 0).
2. detalhes de chão, transições de área e estrada (depth 1, na ordem de inserção).
3. paredes das ruínas (depth `y + h`) e props (depth `y`; props `flat` em depth 2).
4. personagens, inimigos, fogueira e mercador (depth `y`).
5. textos de área e HUD (depth 900+).

### Peças removidas

`small-oak.png`, `brick-wall-tile.png` e `brick-ruin-tile.png` saíram de `assets/environment/trail/`: as árvores do pack substituíram a árvore avulsa e as paredes de tijolo tornaram os dois retalhos redundantes. O service worker e a cena foram atualizados junto.

## Próximo passo técnico

Validar visualmente em Android: legibilidade dos props em escala 1,7–2,6, leitura da mata como barreira (o jogador precisa entender que não há passagem), passagem entre os destroços na estrada, retorno dos ratos ao território e espaço dos controles sobre a clareira. Depois disso, ampliar as ruínas com os tilesets de edifícios e cerca elétrica, que já foram medidos mas ainda não usados.
