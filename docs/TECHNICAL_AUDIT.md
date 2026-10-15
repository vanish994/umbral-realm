# Auditoria técnica do protótipo

**Data da revisão:** 2026-10-15
**Base analisada:** `9083e56` e assets versionados no repositório  
**Escopo:** estado real do protótipo local/PWA; o GDD continua sendo a fonte da direção de design.

## Estado comprovado

### Implementado

- Uma cena Phaser 3 local com mapa linear de 2500×900, câmera ampliada para exploração, movimento por teclado, toque no mapa e joystick virtual. Em telas horizontais, o zoom mostra cerca de 22% mais mundo enquanto os personagens recebem escala compensatória para manter o tamanho visual. Vida, XP e carregador ficam sobre o canto superior esquerdo, e um minimapa circular dinâmico ocupa o canto superior direito. Inimigos vivos podem ser selecionados diretamente por clique/toque; um marcador dourado identifica o alvo no mundo e no minimapa, e os ataques passam a respeitar essa seleção. O terreno combina tiles autorizados e formas simples para a estrada e colisões.
- Colisão manual do jogador com retângulos de cenário. A perseguição dos inimigos usa os mesmos obstáculos e limites do mundo.
- Animações direcionais de ataque do jogador: a faca usa `assets/characters/male/Attack/knife-attack.png` (12 quadros por direção, gerada de `docs/source-art/male-slash-source.jpeg` por `tools/build-slash-sheet.py`) e as armas de fogo usam `assets/characters/male/Shoot/pistol-shoot.png` (8 quadros por direção). As duas folhas seguem a ordem de linhas de `src/animation-rules.js` (down, left-down, left-up, up, right-up, right-down), a mesma do idle, walk e death. Cada golpe vira o personagem para o alvo, troca o sprite durante a janela da arma (a recarga, limitada a 260–620 ms) com `timeScale` calculado por arma e devolve o controle depois para walk/idle. O mesmo arquivo de regras corrigiu a leitura da linha `up` (linha 3) nas folhas de idle/walk/death, que antes usava a arte de `right-down`.
- Sprites direcionais do jogador e poses direcionais dos inimigos. As folhas foram conferidas: personagem combinado 384×384 (6 linhas de 8 quadros de 48×64); rato e lobo zumbi têm 8 direções de 32×32; zumbi lento tem 8 direções de 48×48; mercador tem 8 direções de 32×32. Os inimigos não possuem ciclo de caminhada nos assets atuais.
- Seis encontros persistentes antes da clareira: ratos níveis 1–2, lobos zumbis níveis 5–6 e zumbis lentos níveis 10 e 12. Cada definição configura vida, dano, velocidade, território, recarga, XP, ouro e respawn independentemente em `src/enemy-rules.js`.

| Inimigo | Nível | Vida | Dano | XP | Ouro | Respawn |
|---|---:|---:|---:|---:|---:|---:|
| Rato zumbi | 1 | 45 | 4 | 30 | 4 | 12 s |
| Rato zumbi | 2 | 58 | 5 | 40 | 5 | 13 s |
| Lobo zumbi | 5 | 92 | 8 | 80 | 9 | 18 s |
| Lobo zumbi | 6 | 108 | 9 | 95 | 11 | 20 s |
| Zumbi lento | 10 | 155 | 12 | 140 | 16 | 26 s |
| Zumbi lento | 12 | 190 | 14 | 175 | 20 | 30 s |

| Equipamento | Slot | Efeito-base |
|---|---|---|
| Faca | Lâminas | 11–15 de dano; recarga 500 ms |
| Katana | Lâminas | 17–23 de dano; recarga 650 ms |
| Revólver .38 | Armas de Fogo | 20–28 de dano; recarga 700 ms |
| Pistola | Armas de Fogo | 16–22 de dano; recarga 450 ms |
| Colete | Tronco | 15% de defesa |
| Capacete | Cabeça | 8% de defesa |
| Calça tática | Pernas | 7% de defesa |

- Sete itens equipáveis e persistentes: o personagem começa somente com faca e revólver `.38`; katana, pistola, colete, capacete e calça tática são comprados do mercador e ficam permanentemente disponíveis. Faca/katana usam Lâminas; revólver/pistola usam Armas de Fogo. A aproximação automática funciona com a arma branca equipada. Armas de fogo usam carregadores persistentes (6 no revólver e 12 na pistola), recarga manual/automática e reserva infinita temporária pela flag `DEVELOPMENT_INFINITE_RESERVE`; a precisão cai durante o movimento. Colete, capacete e calça somam até 30% de redução de dano; nenhum equipamento é desenhado sobre o personagem no mundo.
- HUD de vida, XP, nível, moedas e munição; controles de arma, ataque e interação acessíveis sobre a cena na orientação horizontal. O botão MENU pausa a cena e abre o terminal de campo horizontal aprovado: mesa de madeira com papéis, lápis, USB, cartão médico e disco, aparelho central largo e quatro páginas fixas sem rolagem — Personagem, Status, Habilidades e Equipamentos. Todos os dados exibidos vêm do estado real, e a página Equipamentos preserva compra, posse, troca e remoção dos sete itens. Cada inimigo exibe nome, nível e barra de vida individual no mundo. Dano comum aparece em vermelho e crítico em dourado com texto, flash e tremor; XP geral ganho aparece em branco sobre o jogador e ouro atualiza silenciosamente. Avisos visuais e toast foram removidos, mantendo somente uma região invisível para leitores de tela.
- Mercador funcional: vende cinco equipamentos, compra automaticamente os núcleos carregados e persiste saldo e propriedade.
- Salvamento local do estado numérico, agora normalizado contra campos ausentes/corrompidos e acionado também após alterações relevantes e ao ocultar/sair da página.
- Manifesto, orientação horizontal e service worker. Phaser, shell e sprites usados pela cena são locais e pré-carregados para uso após a primeira visita.
- Um único workflow de deploy Pages. O segundo workflow apenas reorganiza assets e faz commit; ele não publica o site.
- Testes Node para estado, referências estáticas, shell offline e requisitos básicos do manifesto.

### Parcial ou provisório

- O mapa autoral de 2500×900 segue uma progressão linear: subúrbio com quatro ratos, mata/ruínas com quatro lobos, zona urbana com quatro zumbis lentos e refúgio a leste com fogueira e mercador. Inimigos podem derrubar núcleos do próprio nível; a chance e o valor de venda aumentam com o nível. Ao interagir, o mercador compra todos os núcleos carregados e abre sua lista de equipamentos. A morte usa as seis direções do spritesheet original, retorna o jogador ao início com metade da vida e remove 10 XP geral e 10% do requisito atual de cada skill, permitindo regressão de nível. Terrenos e props selecionados do pack autorizado foram integrados; a estrada e as colisões estruturais ainda usam formas simples.
- Combate respeita alcance, cadência, carregador e recarga e reproduz efeitos distintos por categoria. Armas de fogo têm 94% de precisão parado e 76% em movimento. A música `Wasteland`, de We Are All Astronauts, começa em volume baixo após a primeira interação e repete em loop. Ainda não há controles de volume, projétil visível, sangramento, fio da faca ou sujeira do revólver; o impacto continua sendo aplicado no início do golpe, não no quadro de clarão da animação.
- A morte anima o spritesheet direcional real, recupera metade da vida, reposiciona o jogador e aplica perda regressiva de XP geral e de skills.
- XP geral e skills independentes de Lâminas e Armas de Fogo existem e são salvas. Cada acerto válido concede 4 XP à skill usada; o requisito parte de 20 e cresce por fator aproximado de 1,45 por nível. Cada nível adiciona 4% à faixa de dano-base da categoria; cada nível geral adiciona 1,5%, mantendo a skill como influência principal. A vida máxima do jogador parte de 100 e cresce 12 por nível. Esses números receberam testes de coerência, mas ainda não foram validados por playtest prolongado.
- Ouro e XP são creditados diretamente. Núcleos por nível têm chance de drop configurável e inventário persistente, mas ainda não aparecem como entidades físicas coletáveis no chão.
- O save preserva progresso e combate, mas não posição do jogador nem tempo restante de respawn.
- Em telas horizontais baixas, o painel detalhado é ocultado para liberar o mapa; os comandos essenciais permanecem sobre a cena.

### Ausente em relação ao MVP do GDD

- Estados e animações dedicadas de ataque/morte para as três espécies de inimigo (o jogador já tem as suas).
- Projétil visível e sincronização do dano com o quadro de clarão do disparo.
- Drops representados fisicamente no mundo e tabelas distintas por espécie.
- Medicamentos e munição encontrada/comprada; a recarga com reserva de desenvolvimento já existe.
- Fio da faca, sujeira e manutenção das armas.
- Testes automatizados de navegador e validação em aparelho Android real.

## Problemas e riscos encontrados

1. **PWA dependia do CDN:** uma nova instalação não conseguia carregar o motor sem acesso ao jsDelivr, e o shell não pré-armazenava os sprites. Corrigido ao versionar Phaser 3.80.1 e ampliar o cache.
2. **Controles essenciais ocultos no alvo principal:** o CSS escondia o painel com seleção de ação e interação no modo horizontal. Corrigido com comandos touch sobre a cena.
3. **Save não confiável:** números inválidos podiam produzir `NaN`, vida zero carregada podia bloquear ações, e alterações só eram persistidas pelo botão oculto no modo horizontal. Corrigido com normalização testável e autosave dos eventos atuais.
4. **Inimigo atravessava cenário:** a perseguição alterava coordenadas sem consultar obstáculos ou limites. Corrigido usando colisão por eixo e limites do mundo; falta teste visual em navegador/dispositivo.
5. **Arquitetura concentrada:** cena, IA, combate, DOM, entrada e persistência permanecem em `src/game.js`. `src/game-state.js` é o primeiro recorte testável; novas extrações devem ocorrer apenas junto de funcionalidades concretas.
6. **Proveniência incompleta:** Phaser tem licença versionada, e a autorização específica do titular para o ambiente está documentada. A origem/autorização dos sprites de personagem, rato, lobo zumbi, zumbi lento, mercador e pacotes de armas ainda precisa ser consolidada antes de distribuição ampla.
7. **Workflow de assets escreve em `main`:** o job extrai e tenta commitar em todo push para `main`. A proteção contra loop existe, mas conceder `contents: write` e manter arquivos compactados duplicados aumenta risco e tamanho; revisar somente após confirmar o fluxo desejado pelo mantenedor.

## Backlog ordenado por dependência

1. **Validar e estabilizar o loop atual em navegador/Android:** carga, landscape, joystick, todos os botões, colisões do jogador e rato, morte, respawn, reload e modo offline. Corrigir qualquer regressão antes de ampliar sistemas.
2. **Validar balanceamento dos inimigos em playtest:** as definições e testes puros existem; medir tempo para matar, dano recebido, progressão e espaço de perseguição no Android.
3. **Materializar drops no mundo:** transformar a rolagem persistente de núcleos em coleta explícita sem quebrar a venda já funcional.
4. **Ampliar o comerciante:** adicionar compra de munição/medicamentos, estoque e testes de transações inválidas.
5. **Diferenciar IA e animações dos inimigos:** ratos, lobos e zumbis já têm faixas próprias, mas ainda precisam de estados visuais de ataque/morte e comportamentos mais distintos.
6. **Refinar feedback de combate:** as animações direcionais de ataque existem; falta projétil visível e alinhar impacto/clarão sem comprometer cadência, seleção e multitoque.
7. **Manutenção e balanceamento das skills:** implementar fio e sujeira após inventário estável; validar em playtest a curva e os bônus já configuráveis.

## Decisões pequenas adotadas

- As ações de curta e longa distância representam os slots de Lâminas e Armas de Fogo. Faca e revólver `.38` são o equipamento inicial; os demais itens precisam ser comprados. Revólver usa 6 tiros e pistola 12, ambos com carregador consumível e reserva infinita temporária. Os números ainda não foram promovidos a balanceamento definitivo.
- As animações de ataque não bloqueiam o movimento: durante a janela de ataque o sprite mantém a pose de golpe/disparo e a caminhada volta quando a janela termina. A duração é a recarga da arma limitada a 260–620 ms (`ATTACK_WINDOW_MS`), para golpes curtos não ficarem lentos nem disparos pesados prenderem o personagem.
- A folha de faca também representa o ataque de katana e a folha de pistola também representa o disparo do revólver; são as duas únicas artes de ataque disponíveis para o personagem masculino.
- A ordem de linhas das folhas direcionais foi confirmada comparando cada linha com os PNGs individuais do pack (`idle_down.png`, `idle_left_down.png`, ...). Antes, a linha `up` lia a arte de `right-down`; `src/animation-rules.js` passou a ser a única fonte da tabela e `test/animation-rules.test.js` protege essa ordem.
- O save inválido com vida zero é recuperado para um estado jogável; mortes válidas são resolvidas em runtime após a animação e então persistidas com a penalidade aplicada.
- O balanço do rato é visual e removido antes de calcular movimento/colisão, evitando que a oscilação altere sua posição lógica.
