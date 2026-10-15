# Auditoria técnica do protótipo

**Data da revisão:** 2026-10-15
**Base analisada:** `9083e56` e assets versionados no repositório  
**Escopo:** estado real do protótipo local/PWA; o GDD continua sendo a fonte da direção de design.

## Estado comprovado

### Implementado

- Uma cena Phaser 3 local com mapa de 1280×720 desenhado por `Graphics`, câmera, movimento por teclado, toque no mapa e joystick virtual.
- Colisão manual do jogador com retângulos de cenário. A perseguição dos inimigos usa os mesmos obstáculos e limites do mundo.
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

- Sete itens equipáveis e persistentes: faca, katana, revólver `.38`, pistola, colete, capacete e calça tática. Faca/katana usam Lâminas; revólver/pistola usam Armas de Fogo. A aproximação automática funciona com a arma branca equipada. O revólver e a pistola mantêm munição infinita pela flag temporária `DEVELOPMENT_INFINITE_AMMO`. Colete, capacete e calça somam até 30% de redução de dano; nenhum equipamento é desenhado sobre o personagem no mundo.
- HUD de vida, XP, nível, moedas, munição e inimigo; controles de arma, ataque e interação acessíveis sobre a cena na orientação horizontal. O botão MENU abre uma composição autoral de mesa em CSS com a moldura de smartphone do Smart UI ampliada ao centro e pausa a cena, aproximando-se da referência promocional fornecida. O dispositivo usa uma proporção visual mais larga que o PNG-base para dar legibilidade aos dados e alvos de toque no Android horizontal. A página Status usa retrato, vida, defesa, equipamentos atuais e detalhes de combate; Skills mostra as faixas da arma equipada. A página Itens mantém os sete equipamentos em uma grade fixa de quatro linhas, sem rolagem do conteúdo do smartphone, e permite equipar ou remover itens. Mapa e Missões permanecem explicitamente em desenvolvimento. Cada inimigo exibe nome, nível e barra de vida individual no mundo. Dano comum aparece em vermelho e crítico em dourado com texto, flash e tremor; XP geral ganho aparece em branco sobre o jogador e ouro atualiza silenciosamente. Avisos visuais e toast foram removidos, mantendo somente uma região invisível para leitores de tela. A apresentação ativa usa painéis, botões, barras e ícones selecionados do `Humble Gift - Smart UI.zip`; a moldura de smartphone está preservada para futuros menus.
- Mercador visível e diálogo simples, mas sem loja.
- Salvamento local do estado numérico, agora normalizado contra campos ausentes/corrompidos e acionado também após alterações relevantes e ao ocultar/sair da página.
- Manifesto, orientação horizontal e service worker. Phaser, shell e sprites usados pela cena são locais e pré-carregados para uso após a primeira visita.
- Um único workflow de deploy Pages. O segundo workflow apenas reorganiza assets e faz commit; ele não publica o site.
- Testes Node para estado, referências estáticas, shell offline e requisitos básicos do manifesto.

### Parcial ou provisório

- A Trilha dos Infectados é um mapa inicial autoral de 1280×720: saída a oeste, seis territórios ordenados por nível, ruínas e uma clareira segura a leste com fogueira e mercador. Terreno e props selecionados do pack autorizado foram integrados; algumas estruturas continuam desenhadas com formas enquanto seus tiles não forem montados e validados.
- Combate respeita alcance e recarga e reproduz efeitos distintos quando faca ou revólver acertam. A música `Wasteland`, de We Are All Astronauts, começa em volume baixo após a primeira interação e repete em loop. Ainda não há controles de volume, animações de ataque, projétil, chance de acerto, sangramento, fio da faca ou sujeira do revólver.
- A “morte” recupera metade da vida e reposiciona o jogador; perda/recuperação ainda é uma decisão aberta no GDD.
- XP geral e skills independentes de Lâminas e Armas de Fogo existem e são salvas. Cada acerto válido concede 4 XP à skill usada; o requisito parte de 20 e cresce por fator aproximado de 1,45 por nível. Cada nível adiciona 4% à faixa de dano-base da categoria; cada nível geral adiciona 1,5%, mantendo a skill como influência principal. A vida máxima do jogador parte de 100 e cresce 12 por nível. Esses números receberam testes de coerência, mas ainda não foram validados por playtest prolongado.
- A recompensa é creditada diretamente e todos os sete equipamentos estão liberados no inventário de desenvolvimento; ainda não existem entidades coletáveis, aquisição de itens nem tabelas de drop.
- O save preserva progresso e combate, mas não posição do jogador nem tempo restante de respawn.
- Em telas horizontais baixas, o painel detalhado é ocultado para liberar o mapa; os comandos essenciais permanecem sobre a cena.

### Ausente em relação ao MVP do GDD

- Estados e animações dedicadas de ataque/morte para as três espécies de inimigo.
- Drops coletáveis, aquisição de equipamentos e tabelas por espécie.
- Compra e venda no mercador.
- Medicamentos, munição encontrada/comprada e recarga.
- Zona segura e área de exploração conectadas como regiões distintas.
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
3. **Conectar drops ao inventário existente:** recompensa física configurável, coleta explícita, aquisição persistente e pré-requisito para vender materiais.
4. **Implementar comerciante mínimo:** compra de munição e venda dos materiais existentes, com transações atômicas e testes contra saldo/estoque inválidos.
5. **Adicionar segundo inimigo:** somente depois que o modelo de inimigo e drops for reutilizável; deve ter comportamento realmente distinto.
6. **Refinar vida/morte e feedback de combate:** depende da decisão de consequência de morte ainda aberta e dos assets de animação disponíveis.
7. **Manutenção e balanceamento das skills:** implementar fio e sujeira após inventário estável; validar em playtest a curva e os bônus já configuráveis.

## Decisões pequenas adotadas

- As ações genéricas “próxima” e “distante” representam os slots de Lâminas e Armas de Fogo. Faca e revólver `.38` continuam como equipamento inicial; katana e pistola podem substituí-los pelo smartphone. As armas de fogo mantêm capacidade-base de sete disparos, atualmente sem consumo pela flag de desenvolvimento. Os números não foram promovidos a balanceamento definitivo.
- O save inválido com vida zero é recuperado para um estado jogável porque o protótipo atual não possui estado persistente de morte.
- O balanço do rato é visual e removido antes de calcular movimento/colisão, evitando que a oscilação altere sua posição lógica.
