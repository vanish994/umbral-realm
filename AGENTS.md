# AGENTS.md — Regras obrigatórias para agentes de IA

Leia este arquivo inteiro antes de inspecionar ou modificar o projeto. Ele existe para que um agente novo trabalhe corretamente sem depender de conversas anteriores.

## 1. Missão do projeto

**Umbral Realm** é um RPG de ação e sobrevivência 2D top-down em um apocalipse zumbi. O primeiro objetivo é entregar um pequeno jogo local/offline que seja divertido, responsivo e confiável em Android. O objetivo de longo prazo é multiplayer/MMORPG, mas isso NÃO autoriza implementar multiplayer antes de validar o núcleo local.

- Plataforma prioritária: Android.
- Distribuição: PWA instalável pela tela inicial.
- Tecnologia existente: HTML, CSS, JavaScript e Phaser 3.
- Orientação: horizontal (landscape), inclusive em celular.
- Orçamento: zero; preferir soluções gratuitas e dependências já existentes.
- Arte: pixel art sombria, boa legibilidade em telas pequenas.
- Câmera: top-down; movimento direto controlado pelo jogador.
- Tema: apocalipse zumbi. Não transformar o projeto em fantasia medieval, não adicionar magia nem classes tradicionais.

## 2. Leia as fontes certas

Antes de planejar ou programar, examine:
1. `AGENTS.md` (este arquivo).
2. `docs/GDD.md` — fonte principal das decisões de design.
3. `README.md` — instruções atuais para executar o projeto.
4. Código, assets, testes e workflows realmente existentes.

**O código mostra o que existe; o GDD descreve o que se deseja.** Nunca conclua que algo está implementado só porque está no GDD. Nunca declare que algo funciona sem evidência.

Se houver conflito entre documentos, código e uma solicitação:
- Não apague nem substitua silenciosamente uma decisão já confirmada.
- Registre o conflito e explique o impacto.
- Para decisões de design, use o GDD como referência principal; para comportamento implementado, verifique o código e teste.
- Se a solicitação atual mudar uma decisão anterior, siga a solicitação explícita e atualize a documentação afetada.
- Se uma ambiguidade mudar arquitetura, escopo, custo ou comportamento central, pare e peça esclarecimento. Para detalhes pequenos e reversíveis, escolha a opção mais simples, documente a suposição e continue.

## 3. Regras que não podem ser quebradas

- **Não reescrever o projeto do zero** nem trocar Phaser, linguagem, arquitetura ou sistema de build sem necessidade comprovada e autorização explícita.
- Não migrar para Godot, Unity, outro framework ou backend pago.
- Não adicionar serviços com custo, chaves secretas no cliente, assinaturas ou dependências pesadas sem aprovação.
- Não introduzir multiplayer, contas, servidores ou sincronização online no MVP local. Prepare o código para evolução futura apenas quando isso não complicar o protótipo.
- Não criar sistemas duplicados. Procure primeiro a implementação existente e amplie-a.
- Não substituir assets existentes por placeholders ou artes aleatórias sem autorização.
- Não remover conteúdo, funcionalidades, arquivos, assets ou workflows para “simplificar” sem justificar e obter autorização quando houver perda funcional.
- Não editar arquivos gerados, bundles ou arquivos de dependências se a fonte correta estiver disponível.
- Não adicionar armas de fantasia, magia, classes tradicionais, estilingue ou armas artificiais de treino; consulte o GDD antes de inventar mecânicas.
- Não afirmar que o jogo, uma animação, uma correção, um deploy ou um teste foi validado se não tiver sido realmente verificado.
- Nunca incluir tokens, senhas, chaves de API ou dados privados no código, commits ou logs.

## 4. Ordem de desenvolvimento

Trabalhe em passos pequenos, com dependências claras. A ordem padrão é:

1. **Auditoria do estado real:** identificar entrada do jogo, módulos, estado atual, assets, controles, persistência, testes e deploy. Separar comprovadamente funcional, parcial, quebrado e ausente.
2. **Confiabilidade da base:** corrigir falhas que impedem carregar, instalar ou jogar; preservar controles Android e orientação horizontal.
3. **Núcleo jogável local:** movimento e colisão → inimigos e perseguição → combate e feedback → vida/dano/morte → drops/loot → ouro e comerciante → salvamento/carregamento.
4. **Experiência e conteúdo:** HUD, animações, efeitos, áreas conectadas, progressão, itens e conteúdo definidos no GDD.
5. **Validação do MVP:** testar em viewport móvel/Android, persistência, recarga, interações, desempenho e critérios de aceitação.
6. **Preparação online:** somente após o loop local estar divertido, estável e validado; desenhar a autoridade do servidor antes de implementar multiplayer.

Esta ordem é um guia, não uma afirmação de que as etapas anteriores estão concluídas. Verifique o repositório antes de escolher a próxima tarefa. Não execute uma fase inteira de uma vez: divida-a em mudanças pequenas e verificáveis.

## 5. Protocolo obrigatório para cada tarefa

### Antes de editar
1. Leia o pedido e identifique o resultado observável esperado.
2. Inspecione os arquivos relacionados e as chamadas/dependências existentes.
3. Determine a causa raiz, não apenas o sintoma visual.
4. Defina os arquivos que provavelmente precisam mudar e os riscos de regressão.
5. Escreva critérios de aceite verificáveis. Se o pedido for amplo, primeiro entregue uma auditoria/plano priorizado em vez de uma reescrita grande.

### Durante a implementação
1. Faça a menor mudança coerente que resolva o problema.
2. Preserve APIs, formatos de salvamento, controles e comportamento existentes, salvo quando a tarefa exigir mudança.
3. Mantenha lógica de jogo, apresentação e dados separados quando isso simplificar testes e manutenção.
4. Use dados configuráveis para balanceamento quando o GDD pedir ajustes frequentes.
5. Garanta que controles por toque funcionem sem teclado; evite botões minúsculos e elementos do HUD cobrindo a área de jogo.
6. Trate telas estreitas, recarga da página, estado ausente/corrompido e falhas de carregamento de forma defensiva.
7. Atualize documentação quando uma decisão, comportamento, comando ou limitação mudar.

### Antes de concluir
1. Execute os testes e verificações disponíveis no repositório; procure também workflows de CI.
2. Verifique o diff para detectar alterações não relacionadas, remoções acidentais, erros de sintaxe e arquivos inesperados.
3. Se não puder executar um teste (por exemplo, teste real no Android), diga isso claramente. Não substitua teste ausente por suposição.
4. Se houver deploy ou preview, abra-o e teste o comportamento afetado quando possível. Um commit publicado não prova, sozinho, que a correção funciona.
5. Não esconda testes falhos. Corrija-os ou relate-os como bloqueio.

## 6. Definição de “concluído”

Uma tarefa só pode ser marcada como concluída quando:
- O resultado pedido está implementado no código real.
- Os critérios de aceite foram verificados, ou cada verificação não executada foi explicitamente identificada.
- Testes relevantes foram executados e os resultados foram registrados.
- O diff não contém mudanças acidentais conhecidas.
- A documentação foi atualizada quando necessário.
- A resposta final informa: o que mudou, arquivos afetados, testes executados e resultados, limitações restantes e links diretos para commit/PR/workflow/preview quando existirem.

Use os estados **Implementado e testado**, **Implementado, mas não testado**, **Parcial**, **Bloqueado** ou **Não implementado**. Não use “resolvido” como sinônimo de “parece certo”.

## 7. Como tratar assets e animações

- Inspecione os arquivos reais, dimensões, número de frames, ordem das direções e convenções de nomes antes de programar um sprite.
- Não presuma que um GIF, spritesheet ou sequência tenha orientação, pivô, velocidade ou ordem de frames corretos.
- Para animações direcionais, confirme como o personagem é desenhado de frente, costas e diagonais; diferencie a direção lógica do movimento da direção visual do sprite.
- Evite corrigir orientação apenas invertendo valores sem confirmar a origem do defeito.
- Confira escala, ponto de ancoragem, colisão e alinhamento com o chão.
- Se um asset necessário estiver ausente ou inacessível, relate o caminho exato e peça-o; não invente que o examinou.
- Respeite as licenças dos assets e registre a origem/licença antes da distribuição.

## 8. Regras para gameplay e balanceamento

O GDD contém decisões confirmadas e propostas de balanceamento. Diferencie-as. Não transforme números provisórios em regras definitivas sem testes.

- O jogo deve recompensar habilidades específicas e exploração, sem grind repetitivo excessivo.
- Inimigos devem ter comportamento e animações legíveis; estados, dano, drops e recompensas devem ser consistentes.
- Economia, loot e progressão devem ser configuráveis e testados para evitar ciclos de lucro infinito ou progresso por ações inválidas.
- Não dar XP por atacar o vazio ou repetir ações inválidas.
- O jogador controla diretamente o personagem; o jogo não é idle.
- Priorize uma região pequena, completa e interessante em vez de um mapa enorme vazio.

## 9. Status, backlog e decisões

Antes de criar uma nova arquitetura ou funcionalidade grande, confira se já existe issue, tarefa, documento, implementação ou decisão relevante. Não invente que há backlog aprovado se não existir.

Se não houver uma tarefa específica, **não comece a implementar funcionalidades aleatórias**. Faça primeiro uma auditoria do estado atual e proponha um backlog ordenado por dependência, impacto e risco, com critérios de aceite.

Ao descobrir uma decisão que precise ser tomada:
- registre a pergunta e as opções;
- recomende a alternativa de menor risco e custo;
- aguarde confirmação quando a escolha alterar o escopo, a arquitetura ou uma decisão de design confirmada.

## 10. Formato obrigatório do relatório final

Use este formato curto e concreto:

- **Estado:** Implementado e testado / Implementado, mas não testado / Parcial / Bloqueado / Não implementado.
- **Resultado:** comportamento observável que mudou.
- **Arquivos:** caminhos alterados e motivo.
- **Validação:** comandos/testes executados e resultado real.
- **Não validado / riscos:** o que ainda precisa ser testado e por quê.
- **Referências:** links diretos para commit, PR, workflow ou preview, se disponíveis.
- **Próximo passo:** uma única recomendação objetiva.

**Regra final:** preservar o projeto e produzir progresso verificável vale mais do que gerar muito código rapidamente.
