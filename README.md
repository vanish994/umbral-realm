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

Sirva a raiz por HTTP; abrir via `file://` não permite validar o service worker. Por exemplo:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Para testar pelo celular, publique o repositório no GitHub Pages. O Phaser 3.80.1 está versionado em `vendor/phaser/` com sua licença, e o service worker pré-carrega o motor, o shell e os sprites usados na cena; depois da primeira visita online, o protótipo pode iniciar sem rede.

## Verificação

```bash
npm test   # integridade dos recursos locais, cache offline e manifesto
npm run check  # inclui verificação de sintaxe do JavaScript
```

O teste real de instalação, orientação, controles e retomada offline ainda deve ser feito em um dispositivo Android.

## Escopo e status

O GDD descreve a direção desejada; ele **não comprova que os sistemas já estejam implementados**. Consulte o código, os testes e os workflows antes de afirmar o estado real. A fotografia técnica revisada e o backlog por dependência estão em [`docs/TECHNICAL_AUDIT.md`](docs/TECHNICAL_AUDIT.md). Arte final, colisões refinadas, missões e multiplayer só devem ser considerados prontos após implementação e validação.

Use somente assets com licença compatível e registre as licenças antes de distribuir.
