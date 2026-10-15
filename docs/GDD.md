# Umbral Realm — Game Design Document (GDD)

**Versão:** 0.2 — visão consolidada de design  
**Estado:** documento de direção. As regras descritas aqui são decisões de design ou propostas de balanceamento; ainda não significam que estejam implementadas.  
**Plataforma-alvo:** Android primeiro, via jogo web instalável (PWA).  
**Tecnologia do protótipo:** HTML, CSS, JavaScript e Phaser 3.  
**Orientação:** horizontal (landscape).  
**Orçamento:** zero; priorizar ferramentas gratuitas e assets próprios ou com licença compatível.

## 1. Visão do jogo

**Umbral Realm** é um RPG de ação 2D com ambição de se tornar um MMORPG, ambientado num apocalipse zumbi. O jogador é um sobrevivente num mundo de cidades arruinadas, áreas residenciais abandonadas, florestas, instalações esquecidas e masmorras tomadas pela infecção.

A identidade do jogo é sobrevivência, exploração, combate em tempo real, coleta de recursos e especialização. **Não há magia nem classes tradicionais de fantasia.** A variedade vem das armas, das habilidades desenvolvidas pelo personagem, dos equipamentos, dos tipos de zumbis e das escolhas do jogador.

O projeto será desenvolvido primeiro como experiência individual/offline. O multiplayer só entra depois que o núcleo local estiver divertido, estável e testado.

### Pilares de design

1. **Apocalipse zumbi:** cenário, criaturas, itens, arquitetura e narrativa devem refletir o colapso da sociedade.
2. **Skills acima do nível geral:** a habilidade com a arma é a principal fonte de eficiência e dano; o nível do personagem oferece vantagens gerais.
3. **Sobrevivência com escolhas:** munição, ouro, manutenção, saque e preparação importam sem transformar o jogo em punição constante.
4. **Combate legível e responsivo:** ação em tempo real, feedback visual claro e controles adequados ao toque.
5. **Progressão sem grind burro:** não exigir horas atacando repetidamente o mesmo inimigo. Vida dos mobs, respawn, experiência e recompensas devem funcionar em conjunto.
6. **MMO por etapas:** primeiro jogo local/offline; depois multiplayer com autoridade no servidor.
7. **Escopo sustentável:** desenvolver pelo Android, usando ferramentas gratuitas e sem assumir custos recorrentes.

## 2. Gênero, câmera e apresentação

- **Gênero:** RPG 2D de ação e sobrevivência pós-apocalíptica, com objetivo futuro de MMORPG.
- **Câmera:** visão superior (top-down), com áreas conectadas.
- **Arte:** pixel art sombria, silhuetas legíveis, ambientes decadentes e efeitos moderados.
- **Orientação móvel:** horizontal, com mapa ocupando a maior área e HUD/controles que não cubram o combate.
- **Ritmo:** explorar, combater, coletar, voltar ao comerciante ou a uma área segura e decidir onde investir recursos.
- **Movimento:** controle direto do personagem; não é um jogo idle.
- **Compatibilidade:** priorizar Android e celulares modestos, interface responsiva e PWA instalável pela tela inicial.

## 3. Mundo e ambientação

A sociedade entrou em colapso devido a uma infecção que transforma pessoas e animais em mortos-vivos. A história será revelada por locais, objetos, registros e encontros, sem despejar toda a explicação no início.

### Tipos de região planejados

- **Bairros e cidades arruinadas:** casas, lojas, ruas bloqueadas e edifícios abandonados.
- **Florestas e estradas:** rotas de exploração, áreas de risco e recursos.
- **Esgotos e instalações subterrâneas:** espaços apertados, ratos zumbis e pouca visibilidade.
- **Instalações abandonadas:** hospitais, depósitos, oficinas e antigos postos de segurança.
- **Masmorras e zonas de alto risco:** concentrações de zumbis mais perigosos, mutações e materiais raros.
- **Áreas seguras:** locais de descanso, interação e comércio com NPCs.

Nomes específicos de cidades, facções e regiões serão definidos mais tarde. A ambientação deve permanecer pós-apocalíptica, sem magia ou criaturas de fantasia tradicional.

### Limites da área jogável

A área jogável termina em mata cerrada em toda a volta: a vegetação e a colisão impedem o jogador de alcançar as beiradas do mapa, e a estrada atravessa o maciço como se continuasse para fora da região. Ampliar o mapa significa abrir novas passagens entre maciços, nunca afrouxar essa barreira.

## 4. Personagem e progressão

### Sem classes fixas

O jogador não escolhe uma classe tradicional. A identidade do personagem surge das skills que desenvolve, das armas que usa e do equipamento que consegue obter. Cada categoria de habilidade progride separadamente.

### Nível do personagem

O nível geral importa, mas não substitui a especialização. Ele deve oferecer:
- aumento da vida máxima;
- aumento da velocidade de movimento;
- bônus de dano geral moderado, sem superar a importância da skill usada.

Os valores e fórmulas exatos serão definidos por testes de balanceamento.

### Skills — principal fonte de eficiência ofensiva

As skills são mais importantes para o dano do que o nível geral. Por exemplo, um personagem de nível menor com alta skill de Armas de Fogo pode causar mais dano com um revólver do que um personagem de nível maior com pouca prática nessa categoria.

Categorias confirmadas até agora:
- **Armas de Fogo:** evolui usando armas de fogo em combate.
- **Lâminas:** evolui usando facas e outras armas de lâmina.

Outras categorias podem ser acrescentadas quando houver armas que as justifiquem. Não haverá skill de estilingue nem armas artificiais de treino no design atual.

### Progressão de dificuldade crescente

O custo para avançar de nível de skill cresce de forma exponencial ou aproximadamente exponencial: os primeiros níveis são mais acessíveis, enquanto os níveis altos exigem investimento prolongado.

**Proposta técnica inicial, ainda não definitiva:** usar uma curva de custo proporcional a A multiplicado por r elevado a (L−1), com r maior que 1. O multiplicador e o custo inicial devem ser calibrados por testes; não são números finais.

Para evitar abuso:
- ações precisam ser válidas e atingir alvos apropriados;
- atacar o vazio não concede progresso;
- repetir ações contra inimigos muito fracos rende progressivamente menos;
- a progressão deve favorecer jogar, explorar e enfrentar desafios variados, não ficar parado repetindo o mesmo alvo.

## 5. Combate e equipamentos

O combate é em tempo real. O protótipo deve validar primeiro movimento, alcance, ataques, dano, estados dos inimigos, loot e feedback visual.

### Equipamento inicial do personagem

1. **Faca de cozinha de 10 polegadas (25,4 cm):** arma de lâmina inicial. Seu fio se desgasta com o uso.
2. **Revólver calibre .38 com tambor de sete câmaras:** começa com exatamente sete munições, sem munição reserva.

O jogador terá de procurar munição no mundo ou farmar ouro para comprar mais do comerciante. Não há pacote inicial de balas extras.

### Fio da faca

A faca não deixa de funcionar por desgaste, mas perde eficiência conforme o fio se deteriora:
- o dano diminui progressivamente;
- o efeito de sangramento enfraquece em estados intermediários;
- quando o fio chega a zero, a faca não causa sangramento e causa 30% menos dano do que em boas condições.

**Proposta de balanceamento para testes:** usar estágios claros de condição, com desempenho aproximado de 100%, 95%, 85% e 70% do dano de referência. O efeito de sangramento também terá estágios; as probabilidades e durações finais ainda serão calibradas. Afiar deve recuperar o fio, mas o método e o custo serão definidos durante o desenvolvimento.

### Sujeira e lubrificação do revólver

O revólver não tem durabilidade e não quebra por desgaste. Em vez disso, acumula sujeira e precisa de limpeza/lubrificação. Quanto mais sujo, menos confiável fica:
- limpo: chance de acerto normal;
- estados intermediários: penalidade gradual de precisão;
- muito sujo/estado crítico: penalidade de precisão relevante.

**Proposta inicial de balanceamento para testes:** multiplicadores de chance-base de 100%, 98%, 93% e 85% conforme o estado. Assim, por exemplo, uma chance-base de 80% multiplicada por 85% resulta em 68%. Esses multiplicadores são provisórios e serão revistos em testes.

A manutenção deve ser gradual e previsível, sem obrigar o jogador a limpar a arma a cada poucos minutos nem tornar o combate impossível quando estiver sem dinheiro.

### Outras regras de combate

- Armas de fogo não têm durabilidade convencional.
- Armas de lâmina podem perder o fio.
- A munição é um recurso importante, especialmente no começo.
- Armas e equipamentos devem ter funções distintas e não tornar uma opção universalmente superior em todos os cenários.
- Não adicionar magia ou armas de treino de dano 1 ao escopo atual.

## 6. Inimigos: espécies zumbis

Todos os mobs de combate pertencem à temática zumbi. A diversidade vem de espécies infectadas, mutações, comportamento e habilidades, não de monstros de fantasia tradicional.

### Progressão inicial proposta

- **Ratos zumbis:** inimigos pequenos e relativamente frágeis, adequados às primeiras áreas e a esgotos/becos.
- **Cães zumbis:** mais rápidos e agressivos, capazes de pressionar o jogador e perseguir por distâncias maiores.
- **Zumbis humanos comuns:** inimigos básicos de áreas urbanas, com comportamento e resistência próprios.
- **Espécies mutantes e especiais:** inimigos de nível mais alto com melhorias e habilidades diferentes, como investidas, resistência específica, ataques em área ou chamar outros zumbis.
- **Variantes de elite e chefes:** encontros raros com padrões reconhecíveis e habilidades próprias; não devem ser apenas inimigos comuns com mais vida.

As habilidades especiais precisam de sinais visuais ou animações legíveis para permitir reação do jogador. A lista final de espécies será criada depois; estas são diretrizes, não um catálogo implementado.

### Catálogo implementado no protótipo

Além das faixas zumbis em `src/enemy-rules.js`, o protótipo tem duas espécies de elite que guardam a
aproximação do refúgio. Os números abaixo são provisórios e configuráveis, ajustados por teste e ainda
sem playtest longo.

| Espécie | Nível | Vida | Dano | Velocidade | Alcance de perseguição | Recarga | XP | Ouro | Respawn |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Saqueador (humano hostil) | 18 | 300 | 22 | 54 | 170 | 950 ms | 380 | 52 | 70 s |
| Saqueador (humano hostil) | 20 | 340 | 25 | 56 | 175 | 900 ms | 430 | 60 | 78 s |
| Mutante | 30 | 680 | 36 | 16 | 150 | 1350 ms | 900 | 110 | 120 s |

- **Saqueador:** humano hostil que não é zumbi. Aproveita o sprite direcional de 32×32 enviado em
  `docs/Saqueador-32x32.zip` e é o inimigo mais rápido do mapa; pressiona por pouco tempo e volta ao
  acampamento quando o jogador se afasta. Ainda não tem rotina de patrulha, saque ou tiro à distância.
- **Mutante:** infectado evoluído de nível 30, o mais lento e resistente do protótipo. Usa o sprite de
  `docs/Mutante-32x32.zip`. Ainda é um perseguidor corpo a corpo; investidas, garras ou ataques em área
  continuam planejados, não implementados.

Os dois sprites têm somente poses paradas por direção (sem ciclo de caminhada, ataque ou morte), então o
protótipo usa a rotação conforme o ângulo de movimento, como já acontecia com rato, lobo e zumbi lento.

**Vila inicial (após a área dos ratos):** clareira cercada por árvores ao fim da estrada de terra, com
fogueira grande, barracas e o comerciante — o primeiro ponto seguro e de comércio do jogo, antes das
áreas de lobo e da zona urbana. O refúgio do leste permanece como clareira de descanso avançada.

**Corredores subterrâneos (abaixo da zona urbana):** área de nível 20 acessada por um poço na borda sul
da cidade, com três galerias em zigue-zague habitadas por **Zumbis do Esgoto** de níveis 20–22 (brutos
lentos de corredor, 320–410 de vida). Eles reutilizam a arte do zumbi lento com escala e matiz próprios
enquanto não há sprite dedicado licenciado; a progressão superfície → refúgio permanece intacta e o
subterrâneo é conteúdo lateral de risco maior, não um atalho.

### Vida e respawn

- Inimigos iniciais terão vida relativamente baixa.
- O respawn será moderado/lento, evitando ciclos instantâneos de farm.
- Vida, tempo de respawn, risco, experiência e drops serão balanceados em conjunto.
- O objetivo é incentivar exploração de outras áreas e combate variado, em vez de atacar repetidamente o mesmo inimigo por horas.

## 7. Drops, ouro e economia

O farm é parte central da progressão. Cada espécie terá sua própria tabela de recompensas, com quantidades de ouro e probabilidades de obter partes ou materiais.

### Regras de drops

- Inimigos podem soltar uma quantidade aleatória de ouro.
- Cada espécie terá chances próprias de soltar partes e materiais coerentes com ela.
- Ouro e materiais terão sorteios independentes: receber ouro não garante um drop raro.
- Espécies mais perigosas poderão ter recompensas esperadas maiores e materiais exclusivos.
- Drops raros não serão obrigatórios para progredir na experiência básica.
- Quantidades e probabilidades devem ser configuráveis para facilitar o balanceamento.

Exemplos conceituais: ratos zumbis podem soltar materiais pequenos; cães zumbis, dentes ou outros materiais; zumbis humanos, objetos e materiais recuperáveis; mutantes, componentes mais raros. A lista e os valores definitivos ainda serão desenvolvidos.

### Comerciante NPC

No início, haverá um comerciante NPC que atende à experiência individual e funciona como principal ponto de compra e venda. Ele:
- vende munição, incluindo balas para o revólver;
- vende armas, equipamentos, medicamentos, ferramentas e os demais itens disponíveis no jogo;
- compra partes e materiais recolhidos dos inimigos;
- permite converter drops em ouro para financiar novas expedições.

O jogador também poderá encontrar munição e outros recursos durante a exploração. O comércio entre jogadores fica para uma fase posterior, quando o multiplayer existir.

### Controle da inflação e do farm

- O ouro obtido diretamente dos inimigos será controlado por tabelas de recompensa.
- Os preços de venda dos materiais ao NPC devem ser calibrados em relação às recompensas e ao custo dos itens comprados.
- Vender um material e comprar o mesmo item não deve criar um ciclo de lucro infinito.
- Munição, manutenção, medicamentos e outros suprimentos podem funcionar como saídas de ouro.
- Recompensas devem compensar o risco e o custo de combate, mas não tornar o dinheiro irrelevante.
- O equilíbrio será avaliado por testes de sessões de farm e acompanhamento da renda/despesa média.

## 8. Campo de treinamento de skills

Haverá um campo de treinamento pago em ouro. O jogador escolhe a skill e a quantidade de horas de treinamento, paga e deixa o treino avançar com o tempo, inclusive enquanto estiver offline.

### Regras planejadas

- O treinamento custa ouro.
- O jogador escolhe qual skill treinar e por quanto tempo.
- Existe um limite diário de horas que o personagem pode deixar em treinamento.
- O limite é compartilhado entre as skills, para que o jogador precise escolher onde investir o tempo de treino.
- Skills mais altas custam mais tempo e/ou ouro para avançar.
- Treinar Armas de Fogo não aumenta Lâminas, e vice-versa.
- O campo complementa a progressão jogando, não deve substituir totalmente o combate e a exploração.

**Proposta inicial para testar:** limite de oito horas de treinamento por dia, compartilhado entre todas as skills. Esse número não está fechado e poderá mudar após testes. O treinamento offline deverá usar tempo transcorrido validado; quando houver multiplayer, o servidor será a autoridade para evitar abuso do relógio local.

## 9. Sobrevivência, recursos e manutenção

O jogo deve fazer os recursos importarem sem virar uma lista excessiva de barras ou tarefas repetitivas.

Sistemas já previstos na direção de design:
- vida e progressão;
- munição;
- ouro e saque;
- fio da faca;
- sujeira/lubrificação do revólver;
- manutenção de equipamentos que tenham desgaste específico.

Fome, sede, fabricação avançada, infecção como sistema de personagem e outros medidores não estão definidos para o MVP. Não adicionar esses sistemas automaticamente sem validar que melhoram o ciclo principal.

## 10. Missões e narrativa

A narrativa será contada por ambientes, objetos, registros, diálogos e encontros com sobreviventes. A história deve reforçar o colapso e a luta por recursos, sem recorrer a magia.

Tipos de missão possíveis:
- recuperar suprimentos;
- localizar sobreviventes ou objetos;
- explorar ruínas;
- eliminar uma ameaça específica;
- encontrar uma rota segura;
- recuperar materiais para um NPC.

Missões não devem ser apenas “mate X inimigos”: quando possível, precisam de contexto, exploração ou consequência.

## 11. Interface e controles

A interface horizontal deve reservar a maior parte do espaço ao mapa, sem cobrir o combate.

- **HUD:** vida, nível, experiência, ouro e estado resumido do equipamento.
- **Área principal:** mundo, personagem, inimigos, itens coletáveis e sinais de interação.
- **Controles touch:** joystick/direcional e botões de ataque e interação.
- **Menus planejados:** inventário, equipamento, skills, mapa, missões e configurações.
- **Feedback:** indicar dano, sangramento, condição da faca, sujeira do revólver e coleta de drops de forma clara, sem poluir a tela.

Testar em diferentes proporções de tela e em celulares Android modestos.

## 12. Direção de arte e áudio

### Direção visual
- Pixel art de apocalipse zumbi.
- Paleta de carvão, cinza frio, verde doentio, ferrugem e pequenos acentos quentes.
- Ruas abandonadas, barricadas, edifícios deteriorados e vegetação invadindo construções.
- Silhuetas distintas para ratos, cães, zumbis humanos e mutantes.
- Animações curtas e legíveis para movimento, ataque, dano, morte, coleta e interação.
- Evitar fantasia medieval tradicional, magia, armaduras brilhantes e aparência de RPG genérico.

### Áudio futuro
- Ambiência de vento, estruturas rangendo e ruídos distantes.
- Sons de ameaça que ofereçam pistas, sem depender exclusivamente do áudio.
- Impactos diferenciados por arma e criatura.
- Opções de volume e respeito às preferências do dispositivo.

Usar apenas arte e áudio próprios ou com licença documentada para uso e redistribuição.

## 13. Mundo compartilhado e multiplayer

O jogo será primeiro individual/offline. O multiplayer só será iniciado após validar movimento, combate, drops, economia e salvamento local.

### Arquitetura-alvo
- **Cliente:** PWA com Phaser, responsável por renderizar e enviar comandos.
- **Servidor autoritativo:** quando houver online, valida movimento, combate, dano, inventário, drops, treinamento e estado compartilhado.
- **Persistência:** salvamento local para o protótipo; persistência remota para personagens online em fase posterior.
- **Comunicação:** WebSocket ou tecnologia equivalente quando o multiplayer for implementado.

### Fases do online
1. Protótipo individual jogável.
2. Áreas e transições estáveis.
3. Backend e identidade de jogador.
4. Teste com dois clientes na mesma área.
5. Sincronização de movimento e presença.
6. Combate, drops, economia e treinamento validados pelo servidor.
7. Persistência, reconexão, chat e moderação.
8. Testes de carga antes de ampliar a quantidade de jogadores.

Não prometer muitos jogadores antes de medir a capacidade real da hospedagem gratuita.

## 14. Escopo do MVP

O objetivo do primeiro MVP é provar que explorar, lutar, coletar, interagir e progredir é divertido no Android em modo horizontal.

### Prioridades para o MVP
- PWA instalável e carregamento confiável.
- Mapa top-down com identidade pós-apocalíptica.
- Movimento por toque e teclado para teste.
- Uma zona segura simples e uma área de exploração conectada.
- Um NPC comerciante com compra/venda simples.
- Pelo menos um inimigo zumbi básico e um segundo tipo com comportamento distinto.
- Ataque, vida, drops, ouro e salvamento local.
- Uma arma inicial de lâmina e o revólver .38, quando o combate e o inventário suportarem.
- Layout horizontal responsivo e feedback claro de combate.

### Fora do primeiro MVP
- MMORPG online com muitos jogadores.
- Chat global, guildas, grupos e comércio entre jogadores.
- Mundo persistente compartilhado.
- Catálogo completo de espécies, mutações e habilidades.
- PvP, temporadas, rankings e eventos massivos.
- Sistemas extensos de fome, sede, fabricação e infecção antes de validar o núcleo.

## 15. Plano de desenvolvimento

**Fase 0 — Fundação**
- Consolidar o GDD e manter explícito o que é decisão, proposta ou implementação.
- Organizar o código em módulos e documentar como testar pelo Android.
- Garantir deploy automático sem workflows duplicados.

**Fase 1 — Protótipo jogável**
- Movimento, colisões e mapa.
- Combate funcional, dano recebido e estados de inimigo.
- Primeiro loop de loot, ouro e salvamento.
- NPC e interação básica.

**Fase 2 — Ciclo de sobrevivência**
- Inventário básico, comerciante e preços configuráveis.
- Primeiras armas e munição.
- Drops por espécie.
- Testes de farm, respawn e economia.

**Fase 3 — Progressão**
- Nível geral e skills independentes.
- Curva crescente de experiência de skill.
- Condição do fio da faca e sujeira do revólver.
- Campo de treinamento pago, com limite diário.
- Testes de balanceamento repetíveis.

**Fase 4 — Conteúdo**
- Novas espécies de zumbis e mutações.
- Regiões conectadas, missões, equipamentos e recursos.
- Melhorias de pixel art e animações essenciais.

**Fase 5 — Preparação online**
- Escolher hospedagem com base em limites reais.
- Implementar servidor autoritativo e persistência.
- Testar com dois clientes antes de expandir.

**Fase 6 — Alfa multiplayer**
- Sincronização, reconexão, segurança básica e moderação.
- Testes de latência, carga e recuperação de falhas.

## 16. Critérios de aceitação do MVP

- O jogo carrega no Android sem erro fatal.
- A orientação horizontal é utilizável.
- O personagem move-se de forma consistente e respeita obstáculos.
- Ataques respeitam alcance e tempo de ação.
- Inimigos podem ser derrotados de forma consistente.
- Vida, ouro, drops e progresso atualizam corretamente.
- Comprar e vender com o NPC atualiza inventário e saldo corretamente.
- O salvamento preserva o progresso esperado.
- A interface continua utilizável em diferentes telas.
- A versão publicada corresponde ao commit esperado e não há workflows concorrentes de deploy.

## 17. Decisões e balanceamento ainda em aberto

Os seguintes detalhes precisam de protótipos e testes antes de se tornarem valores definitivos:
- fórmulas de dano, vida e velocidade por nível;
- fórmula e multiplicador exato da progressão de skills;
- duração, chance e força do sangramento da faca;
- ritmo de desgaste do fio;
- ritmo de acúmulo de sujeira e custo/frequência da limpeza do revólver;
- vida e tempo de respawn de cada espécie;
- quantidade e probabilidades de ouro e materiais por inimigo;
- preços do NPC e renda média por sessão;
- limite diário e preço por hora do campo de treinamento;
- quais materiais cada espécie pode deixar;
- detalhes de morte, perda e recuperação de itens.

Os números sugeridos neste documento são pontos de partida para testes, não compromissos finais. O balanceamento deve ser medido no jogo e ajustado em conjunto: combate, munição, drops, respawn, economia e treinamento afetam uns aos outros.

## 18. Regra de ouro do projeto

**Não construir um MMORPG enorme e vazio. Construir primeiro uma pequena região sombria que seja divertida de explorar, perigosa de atravessar e interessante de revisitar.** Cada sistema novo deve melhorar o ciclo de exploração, combate, loot e progressão ou preparar uma necessidade real do multiplayer.

---

### Estado atual do projeto

O repositório contém um protótipo inicial PWA com Phaser, HUD, controles, interação simples, combate básico e salvamento local. Isso ainda não constitui um MMORPG completo. Este GDD descreve a direção de design e o plano; a inclusão de uma regra neste documento não significa que ela já esteja programada.
