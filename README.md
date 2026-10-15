# Umbral Realm

**Leia primeiro:** [Regras obrigatórias para agentes de IA](AGENTS.md)  
📘 **Documento principal de design:** [GDD — Game Design Document](docs/GDD.md)

RPG de ação e sobrevivência 2D top-down em um apocalipse zumbi. O desenvolvimento começa por um protótipo local/offline; o objetivo de longo prazo é multiplayer, somente depois que o núcleo local estiver divertido, estável e validado.

## Direção técnica

- Plataforma prioritária: Android.
- Formato: jogo web instalável (PWA).
- Tecnologia do protótipo: HTML, CSS, JavaScript e Phaser 3.
- Orientação: horizontal (landscape).
- Orçamento: zero; priorizar ferramentas gratuitas e assets com licença compatível.
- Câmera top-down, controles por toque e salvamento local.

## Executar

Abra `index.html` por um servidor estático. Para testar pelo celular, publique o repositório no GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root). O Phaser é carregado por CDN, então a primeira abertura precisa de internet.

## Escopo e status

O GDD descreve a direção desejada; ele **não comprova que os sistemas já estejam implementados**. Consulte o código, os testes e os workflows antes de afirmar o estado real. Arte final, colisões refinadas, missões e multiplayer só devem ser considerados prontos após implementação e validação.

Use somente assets com licença compatível e registre as licenças antes de distribuir.
