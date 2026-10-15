# Auditoria técnica do protótipo

**Data da revisão:** 2026-10-14
**Base analisada:** `9083e56` e assets versionados no repositório  
**Escopo:** estado real do protótipo local/PWA; o GDD continua sendo a fonte da direção de design.

## Estado comprovado

### Implementado

- Uma cena Phaser 3 local com mapa de 960×640 desenhado por `Graphics`, câmera, movimento por teclado, toque no mapa e joystick virtual.
- Colisão manual do jogador com retângulos de cenário. A perseguição do rato agora usa os mesmos obstáculos e limites do mundo.
- Sprites direcionais do jogador e poses direcionais do rato. As folhas foram conferidas: personagem combinado 384×384 (6 linhas de 8 quadros de 48×64); rato e mercador 256×32 (8 direções de 32×32). O rato não possui ciclo de caminhada no asset atual.
- Quatro ratos zumbis distribuídos antes da clareira, cada um com vida e persistência independentes, perseguição com território, dano por contato, recompensa direta e respawn de doze segundos.
- Faca e revólver `.38` representados pelas duas ações de combate preexistentes. O revólver começa com sete munições e sem reserva; os valores de dano continuam provisórios.
- HUD de vida, XP, nível, moedas, munição e inimigo; controles de arma, ataque e interação acessíveis sobre a cena na orientação horizontal. Molduras, barras, botões e ícones selecionados do `UI Package.zip` foram integrados sem substituir a estrutura HTML acessível.
- Mercador visível e diálogo simples, mas sem loja.
- Salvamento local do estado numérico, agora normalizado contra campos ausentes/corrompidos e acionado também após alterações relevantes e ao ocultar/sair da página.
- Manifesto, orientação horizontal e service worker. Phaser, shell e sprites usados pela cena são locais e pré-carregados para uso após a primeira visita.
- Um único workflow de deploy Pages. O segundo workflow apenas reorganiza assets e faz commit; ele não publica o site.
- Testes Node para estado, referências estáticas, shell offline e requisitos básicos do manifesto.

### Parcial ou provisório

- A Trilha dos Infectados é um mapa inicial autoral de 1280×720: saída a oeste, quatro territórios de ratos, ruínas e uma clareira segura a leste com fogueira e mercador. Terreno e props selecionados do pack autorizado foram integrados; algumas estruturas continuam desenhadas com formas enquanto seus tiles não forem montados e validados.
- Combate respeita alcance e recarga, mas não tem animações de ataque, projétil, chance de acerto, sangramento, fio da faca ou sujeira do revólver.
- A “morte” recupera metade da vida e reposiciona o jogador; perda/recuperação ainda é uma decisão aberta no GDD.
- XP e nível existem, mas skills independentes ainda não. Os números atuais não foram validados por balanceamento.
- A recompensa é creditada diretamente; não existem entidades coletáveis, inventário nem tabelas de drop.
- O save preserva progresso e combate, mas não posição do jogador nem tempo restante de respawn.
- Em telas horizontais baixas, o painel detalhado é ocultado para liberar o mapa; os comandos essenciais permanecem sobre a cena.

### Ausente em relação ao MVP do GDD

- Segunda espécie de inimigo com comportamento distinto.
- Inventário, drops coletáveis e tabelas por espécie.
- Compra e venda no mercador.
- Medicamentos, munição encontrada/comprada e recarga.
- Zona segura e área de exploração conectadas como regiões distintas.
- Skills de Lâminas e Armas de Fogo, equipamento e manutenção.
- Testes automatizados de navegador e validação em aparelho Android real.

## Problemas e riscos encontrados

1. **PWA dependia do CDN:** uma nova instalação não conseguia carregar o motor sem acesso ao jsDelivr, e o shell não pré-armazenava os sprites. Corrigido ao versionar Phaser 3.80.1 e ampliar o cache.
2. **Controles essenciais ocultos no alvo principal:** o CSS escondia o painel com seleção de ação e interação no modo horizontal. Corrigido com comandos touch sobre a cena.
3. **Save não confiável:** números inválidos podiam produzir `NaN`, vida zero carregada podia bloquear ações, e alterações só eram persistidas pelo botão oculto no modo horizontal. Corrigido com normalização testável e autosave dos eventos atuais.
4. **Inimigo atravessava cenário:** a perseguição alterava coordenadas sem consultar obstáculos ou limites. Corrigido usando colisão por eixo e limites do mundo; falta teste visual em navegador/dispositivo.
5. **Arquitetura concentrada:** cena, IA, combate, DOM, entrada e persistência permanecem em `src/game.js`. `src/game-state.js` é o primeiro recorte testável; novas extrações devem ocorrer apenas junto de funcionalidades concretas.
6. **Proveniência incompleta:** Phaser tem licença versionada, e a autorização específica do titular para o ambiente está documentada. A origem/autorização dos sprites de personagem, rato, mercador e pacotes de armas ainda precisa ser consolidada antes de distribuição ampla.
7. **Workflow de assets escreve em `main`:** o job extrai e tenta commitar em todo push para `main`. A proteção contra loop existe, mas conceder `contents: write` e manter arquivos compactados duplicados aumenta risco e tamanho; revisar somente após confirmar o fluxo desejado pelo mantenedor.

## Backlog ordenado por dependência

1. **Validar e estabilizar o loop atual em navegador/Android:** carga, landscape, joystick, todos os botões, colisões do jogador e rato, morte, respawn, reload e modo offline. Corrigir qualquer regressão antes de ampliar sistemas.
2. **Modelar inimigo e combate em dados testáveis:** separar configuração do rato, dano, alcance, cooldown, recompensa e respawn; adicionar testes de regras sem Phaser.
3. **Implementar drops coletáveis e inventário mínimo:** recompensa física configurável, coleta explícita e persistência. Isso é pré-requisito para vender materiais.
4. **Implementar comerciante mínimo:** compra de munição e venda dos materiais existentes, com transações atômicas e testes contra saldo/estoque inválidos.
5. **Adicionar segundo inimigo:** somente depois que o modelo de inimigo e drops for reutilizável; deve ter comportamento realmente distinto.
6. **Refinar vida/morte e feedback de combate:** depende da decisão de consequência de morte ainda aberta e dos assets de animação disponíveis.
7. **Progressão de skills e manutenção:** depende do combate e inventário estáveis; números permanecem propostas de balanceamento.

## Decisões pequenas adotadas

- As ações genéricas “próxima” e “distante” foram nomeadas como a faca inicial e o revólver `.38`, pois ambos são equipamento inicial confirmado no GDD. O comportamento existente foi preservado: 13 de dano corpo a corpo, 24 à distância e sete disparos. Esses números não foram promovidos a balanceamento definitivo.
- O save inválido com vida zero é recuperado para um estado jogável porque o protótipo atual não possui estado persistente de morte.
- O balanço do rato é visual e removido antes de calcular movimento/colisão, evitando que a oscilação altere sua posição lógica.
