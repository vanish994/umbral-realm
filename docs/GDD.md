# Umbral Realm — Game Design Document (GDD)

**Versão:** 0.1 — visão inicial  
**Estado:** documento de direção; várias funcionalidades ainda são propostas, não implementadas.  
**Plataforma-alvo:** Android primeiro, via jogo web instalável (PWA).  
**Tecnologia atual do protótipo:** HTML, CSS, JavaScript e Phaser 3.  
**Orçamento:** zero; priorizar ferramentas gratuitas e assets próprios ou com licença compatível.

## 1. Visão do jogo

**Umbral Realm** é um MMORPG 2D de fantasia sombria em um mundo pós-apocalíptico devastado por uma praga de mortos-vivos e forças sobrenaturais. Civilizações ruíram, estradas foram tomadas por hordas e os sobreviventes se agarram a assentamentos fortificados entre regiões contaminadas.

A fantasia central não é ser um herói clássico que salva um reino intacto. É **sobreviver, adaptar-se e conquistar espaço em um mundo que já acabou**. O personagem começa vulnerável e torna-se conhecido por suas escolhas, equipamentos, cicatrizes, conhecimentos e especializações.

### Pilares de design

1. **Apocalipse em cada detalhe:** cenário, criaturas, itens, arquitetura, sons e missões devem refletir o colapso.
2. **Sobrevivência com escolhas:** recursos, risco, preparação e exploração importam; não transformar tudo em punição ou grind.
3. **Identidade não convencional:** sem depender do pacote tradicional de guerreiro, mago, paladino e arqueiro.
4. **Exploração contínua:** regiões conectadas por caminhos, assentamentos, florestas mortas, ruínas e masmorras.
5. **Combate legível e responsivo:** ação em tempo real, feedback visual claro e controles adequados ao toque.
6. **MMO por etapas:** primeiro construir um jogo local divertido e confiável; depois introduzir multiplayer com autoridade no servidor.
7. **Escopo sustentável:** desenvolver pelo Android, usando serviços gratuitos sempre que possível, sem assumir custos recorrentes.

## 2. Gênero, câmera e apresentação

- **Gênero:** MMORPG 2D de ação, fantasia sombria e sobrevivência pós-apocalíptica.
- **Câmera:** visão superior (top-down), com mapas exploráveis e leitura clara do entorno.
- **Arte:** pixel art sombria, silhuetas fortes, paleta de cores contida, iluminação localizada e ambientes decadentes.
- **Orientação móvel:** horizontal (landscape), com mapa ocupando a maior área e HUD/controles nas laterais.
- **Ritmo:** exploração, encontros de combate, coleta, interação, retorno a áreas seguras e progressão.
- **Movimento:** controle direto do personagem; não é um idle game.
- **Escopo visual inicial:** arte procedural e placeholders podem ser usados no protótipo, mas devem ser substituídos ou refinados antes de considerar o visual final.

## 3. Mundo e ambientação

O mundo foi atingido por uma calamidade conhecida provisoriamente como **A Queda do Véu**. Uma praga reanimou os mortos e deformou a vida; ao mesmo tempo, fendas sobrenaturais começaram a alterar lugares e pessoas. A origem exata deve ser revelada por exploração e narrativa, não explicada toda no início.

### Regiões propostas

- **Bosque das Cinzas:** zona inicial, trilhas abandonadas, árvores retorcidas e sinais de contaminação.
- **Vila do Último Sino:** assentamento fortificado, comércio limitado, sobreviventes desconfiados e rumores.
- **Distrito Afogado:** ruas em ruínas, edifícios parcialmente submersos e infectados escondidos.
- **Campos de Carniça:** terreno aberto tomado por hordas e restos de caravanas.
- **Hospital de Santa Véspera:** masmorra de horror, experimentos interrompidos e registros sobre a praga.
- **Fenda do Véu:** região sobrenatural de alto risco, com regras ambientais e criaturas anômalas.

Esses nomes e lugares são propostas de design, não conteúdo já construído. O mundo deve ser dividido em áreas conectadas, evitando um mapa único tão grande que fique vazio ou caro de manter.

### Facções possíveis

- **Vigias do Sino:** protegem assentamentos, mas cobram caro por segurança.
- **Coletores de Cinza:** recuperam tecnologia, ferramentas e materiais das ruínas.
- **A Irmandade da Última Luz:** grupo religioso dividido entre proteger os vivos e explorar o sobrenatural.
- **Os Despertos:** sobreviventes alterados pela contaminação; nem todos são hostis.
- **Culto da Boca Negra:** facção antagonista que vê a praga como uma nova etapa da existência.

Facções devem ter objetivos conflitantes e consequências no mundo. Nenhuma precisa ser inteiramente boa ou má.

## 4. Personagem e progressão

Não haverá classes medievais convencionais como estrutura obrigatória. O personagem começa como um sobrevivente e desenvolve uma identidade por meio de **arquétipos, habilidades, equipamentos e escolhas**.

### Arquétipos iniciais propostos

| Arquétipo | Identidade de jogo |
|---|---|
| **Catador das Ruínas** | Recuperação de recursos, improvisação, armadilhas e ferramentas. |
| **Pestilento** | Toxinas, doenças e manipulação arriscada da contaminação. |
| **Marcado pelo Véu** | Poderes sobrenaturais com custos ou efeitos colaterais. |
| **Estripador** | Combate brutal de curta distância e pressão sobre inimigos próximos. |
| **Rastreador de Mortos** | Rastreamento, preparação de emboscadas e conhecimento de criaturas. |

Os arquétipos são referências para estilos de jogo, não classes fechadas já implementadas. O objetivo é permitir combinações e especializações sem criar combinações ilimitadas difíceis de balancear.

### Progressão planejada

- Ganhar experiência por combate, exploração, missões e descobertas relevantes.
- Desbloquear habilidades e especializações em marcos claros.
- Melhorar equipamento por reparo, fabricação, saque e descoberta.
- Obter títulos, cicatrizes, reputação e registros de feitos.
- Fazer escolhas que abram ou fechem relações com facções.
- Evitar que o poder dependa apenas de horas repetindo a mesma atividade.

**Princípio de balanceamento:** equipamentos e habilidades devem criar opções, não tornar o personagem invulnerável. O conteúdo de grupo deve recompensar cooperação sem tornar a experiência solo inviável.

## 5. Combate

O combate é em tempo real, com resposta imediata aos comandos. O protótipo deve validar primeiro um conjunto pequeno de ações.

### Loop básico

1. Identificar ameaça e distância.
2. Aproximar-se, reposicionar-se ou usar o ambiente.
3. Atacar, esquivar ou ativar uma habilidade.
4. Ler o feedback do golpe e a reação do inimigo.
5. Recolher recompensas e decidir se continua ou recua.

### Categorias de armas e ferramentas

- Armas improvisadas e ferramentas pesadas.
- Lâminas curtas, facões e armas de impacto.
- Armas de alcance limitado, como bestas improvisadas.
- Artefatos contaminados e instrumentos ritualísticos.
- Armadilhas, iscas e itens de distração.

Armas de fogo, se forem incluídas futuramente, devem ser raras, barulhentas e balanceadas por munição e risco — não a solução universal.

### Tipos de ameaça

- **Errantes:** lentos, perigosos em grupo.
- **Corredores:** rápidos, frágeis e capazes de punir distrações.
- **Brutos:** resistentes, com ataques previsíveis e pesados.
- **Esporos:** contaminam áreas e controlam espaço.
- **Mímicos:** usam som, silhueta ou comportamento para atrair sobreviventes.
- **Aberrações do Véu:** inimigos sobrenaturais com padrões únicos.
- **Chefes:** encontros com fases ou mudanças de comportamento, não apenas muita vida.

No primeiro protótipo, implementar somente um personagem, um inimigo comum e uma criatura especial. O catálogo completo vem depois.

## 6. Sobrevivência, recursos e fabricação

A sobrevivência deve apoiar a exploração, não virar uma lista exaustiva de barras. O primeiro ciclo deve focar em vida, experiência, moedas e saque. Fome, sede, infecção, durabilidade e fabricação avançada ficam para fases posteriores.

### Recursos propostos

- Sucata, tecido, madeira, metal e componentes.
- Ervas, reagentes, antissépticos e antídotos.
- Munição e materiais de reparo, caso essas mecânicas sejam introduzidas.
- Relíquias, fragmentos e amostras contaminadas.

### Fabricação futura

Receitas devem exigir descoberta, estação de trabalho ou conhecimento. A fabricação não deve criar recursos do nada: a economia depende de saque, coleta, comércio e risco de expedição.

## 7. Missões e narrativa

A narrativa é ambiental e emergente, com histórias locais, personagens ambíguos e consequências. O jogador deve descobrir o que ocorreu por meio de registros, locais, diálogos e mudanças nas regiões.

### Tipos de missão

- **Sobrevivência:** recuperar suprimentos, escoltar ou resgatar alguém.
- **Caçada:** rastrear uma criatura e descobrir seu padrão.
- **Exploração:** mapear ruínas, localizar entradas ou recuperar registros.
- **Facção:** entregar recursos, negociar ou escolher um lado.
- **Mistério:** reconstruir acontecimentos a partir de evidências.
- **Eventos de mundo:** hordas, rotas bloqueadas ou áreas temporariamente contaminadas.

Missões não devem ser apenas “mate X inimigos”. Sempre que possível, oferecer contexto, decisão ou uma consequência visível.

## 8. Mundo compartilhado e multiplayer

O jogo será primeiro offline/local. O multiplayer vem somente após validar movimento, combate, salvamento e estrutura de áreas.

### Arquitetura-alvo

- **Cliente:** PWA com Phaser, responsável por renderizar e enviar comandos.
- **Servidor autoritativo:** valida posição, combate, dano, inventário, recompensas e estado compartilhado.
- **Persistência remota:** contas/personagens e progresso online quando houver backend viável.
- **Salvamento local:** útil para prototipagem; não será autoridade em partidas online.
- **Comunicação:** WebSocket ou tecnologia equivalente quando o servidor multiplayer for implementado.

O cliente nunca deve decidir sozinho resultados importantes em multiplayer. O servidor valida ações para reduzir trapaças e divergência de estado.

### Fases do online

1. Protótipo local jogável.
2. Áreas e transições estáveis.
3. Backend mínimo e identidade de jogador.
4. Teste com dois clientes na mesma área.
5. Sincronização de movimento e presença.
6. Combate e loot validados pelo servidor.
7. Persistência, reconexão, chat e ferramentas de moderação.
8. Testes de carga antes de ampliar o número de jogadores.

Não prometer “muitos jogadores” antes de medir a capacidade real do servidor gratuito. Serviços gratuitos podem ter limites, suspensão por inatividade e quotas.

## 9. Interface e controles

A interface horizontal deve reservar a maior parte do espaço ao mapa. HUD e controles precisam permanecer legíveis em telas pequenas.

- **Topo:** nome do jogo, nível, moedas e status resumido.
- **Área principal:** mundo explorável, personagens, criaturas, sinais de interação e indicadores de local.
- **Painel lateral:** vida, experiência, missão atual e ações.
- **Controles touch:** direcional virtual ou joystick e botões contextuais de ataque/interação.
- **Menus futuros:** inventário, equipamentos, habilidades, mapa, missões, social e configurações.

Todos os botões devem ter estados pressionado/desabilitado claros. Textos de missão não podem cobrir a área de jogo. A interface precisa ser testada com diferentes proporções de tela e recortes do Android.

## 10. Direção de arte e áudio

### Direção visual

- Paleta: carvão, cinza frio, verde doentio, ferrugem e dourado envelhecido em pequenos acentos.
- Silhuetas distintas para leitura rápida de inimigos.
- Animações curtas e legíveis: andar, atacar, receber golpe, morrer e interagir.
- Cenários com sinais de abandono, barricadas, marcas de luta e luzes isoladas.
- Evitar fantasia medieval limpa, armaduras brilhantes e aparência colorida de RPG genérico.

### Áudio futuro

- Ambiência de vento, madeira, estruturas rangendo e ruídos distantes.
- Sons de ameaça que deem pistas, sem depender exclusivamente de áudio.
- Impactos diferenciados por material e criatura.
- Música discreta em exploração e mais intensa em perigo.
- Opção de volume e respeito às preferências do dispositivo.

Usar apenas áudio e arte próprios ou com licença documentada para uso e redistribuição.

## 11. Economia e jogo justo

A economia deve nascer de recursos escassos, saque, fabricação e comércio entre jogadores. O comércio entre jogadores só será implementado depois de existir validação de inventário no servidor.

- Sem venda de poder como requisito de progressão.
- Sem mecânicas pagas, pois o orçamento inicial é zero.
- Evitar itens duplicáveis e transações não validadas no servidor.
- A raridade deve comunicar utilidade e contexto, não apenas cor.
- Recompensas devem refletir risco, tempo e contribuição.

## 12. Escopo do MVP

O objetivo do primeiro MVP é provar que andar, explorar, lutar, interagir e progredir é divertido no Android em modo horizontal.

### Incluído no MVP

- PWA instalável e carregamento confiável.
- Mapa inicial top-down com identidade de apocalipse zumbi.
- Movimento por toque e teclado para teste.
- Uma zona segura simples e uma área de exploração conectada.
- Um NPC com diálogo e uma missão curta.
- Um inimigo comum e um inimigo especial.
- Ataque básico, vida, experiência e recompensa.
- Interação, feedback de combate e salvamento local.
- Layout horizontal responsivo.

### Fora do MVP

- MMORPG online com muitos jogadores.
- Chat global, guildas, grupos e comércio entre jogadores.
- Mundo persistente compartilhado.
- Grande catálogo de criaturas e habilidades.
- PvP, temporadas, ranking e eventos massivos.
- Sistema completo de fome, sede, infecção e durabilidade.
- Arte final para todas as regiões e animações.

## 13. Plano de desenvolvimento

**Fase 0 — Fundação**
- Consolidar este GDD e manter o escopo do MVP explícito.
- Organizar o código em módulos e documentar como testar pelo Android.
- Garantir deploy automático sem workflows duplicados.

**Fase 1 — Protótipo jogável**
- Movimento e colisões.
- Mapa inicial com limites e objetos sólidos.
- Combate funcional, dano recebido e estados de inimigo.
- NPC, missão e feedback visual.
- Salvamento e recuperação de progresso.

**Fase 2 — Vertical slice**
- Uma pequena região com começo, objetivo e conclusão.
- Melhorias de pixel art e animações essenciais.
- Inventário básico, saque e equipamento simples.
- Testes em diferentes celulares e tamanhos de tela.

**Fase 3 — Estrutura de RPG**
- Progressão, habilidades, itens e missões orientadas por dados.
- Mais inimigos, locais e encontros.
- Balanceamento com testes repetíveis.

**Fase 4 — Preparação online**
- Escolher hospedagem gratuita com base em limites reais.
- Implementar identidade, servidor autoritativo e persistência.
- Testar com dois clientes antes de expandir.

**Fase 5 — Alfa multiplayer**
- Sincronização, reconexão, segurança básica e moderação.
- Testes de latência, carga e recuperação de falhas.
- Expandir o mundo apenas quando o núcleo estiver estável.

## 14. Critérios de aceitação do MVP

O MVP não será considerado pronto apenas porque o site abre. Deve cumprir:

- O jogo carrega em Android sem erro fatal.
- A orientação horizontal tem layout utilizável.
- O personagem move-se de forma consistente e não atravessa obstáculos.
- Ataques só atingem alvos dentro do alcance e respeitam o tempo de ação.
- Inimigos têm estados e podem ser derrotados de maneira consistente.
- Vida, experiência e recompensas atualizam corretamente.
- A missão pode ser iniciada e concluída.
- Salvar e recarregar preserva o progresso esperado.
- A interface continua utilizável em telas baixas e largas.
- A versão publicada corresponde ao commit esperado e não há workflows concorrentes de deploy.

## 15. Riscos e decisões em aberto

- **Arte:** criar sprites próprios ou selecionar packs gratuitos com licença compatível.
- **Multiplayer gratuito:** disponibilidade, quotas e latência precisam ser avaliadas antes de escolher hospedagem.
- **Escopo:** não adicionar sistemas grandes antes de o ciclo principal estar divertido.
- **Performance:** limitar efeitos, texturas e processamento para celulares modestos.
- **Persistência:** definir quando o salvamento local será migrado para o servidor.
- **Contaminação:** decidir se é recurso, risco ambiental, sistema de transformação ou combinação dos três.
- **Morte e perda:** definir penalidades que criem tensão sem apagar arbitrariamente o progresso.
- **Progressão:** testar arquétipos híbridos antes de fixar árvores de habilidades.
- **Mundo persistente:** definir quais mudanças são individuais, por grupo ou globais quando o multiplayer estiver próximo.

## 16. Regra de ouro do projeto

**Não construir um MMORPG enorme e vazio. Construir primeiro uma pequena região sombria que seja divertida de explorar, perigosa de atravessar e interessante de revisitar.** Cada sistema novo deve melhorar esse ciclo ou preparar uma necessidade real do multiplayer.

---

### Estado atual do projeto

O repositório contém um protótipo inicial PWA com Phaser, interface de HUD, controles, interação simples, combate básico contra uma criatura, progressão simples e salvamento local. Isso ainda não constitui um MMORPG completo. O documento descreve a visão e o plano, separando explicitamente o que existe do que ainda será desenvolvido.
