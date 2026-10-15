# Interface anterior do UI Package

Seleção extraída de `docs/UI Package.zip`. Estes arquivos foram usados na primeira revisão do HUD e permanecem preservados como referência, mas a apresentação ativa foi substituída pela seleção em `assets/ui-smart/`.

| Arquivo integrado | Origem no ZIP | Uso |
| --- | --- | --- |
| `panel-border.png` | `Frames/1-1.png` | Molduras do HUD, objetivo, inimigo e localização |
| `button-frame.png` | `Frames/3-6.png` | Botões de arma, interação, save e tela cheia |
| `status-bar-frame.png` | `Windows/8-3.png` | Barras de vida, XP e inimigo |
| `vitality-heart.png` | `Status/1-4.png` | Ícone de vitalidade |
| `coin.png` | `Status/2-4.png` | Ícone de moedas |

Os PNGs foram inspecionados nas dimensões originais antes da integração. A apresentação usa `image-rendering: pixelated`. Molduras são escaladas pelo CSS, mas a estrutura e os controles continuam em HTML para manter acessibilidade e adaptação às proporções de telas Android.

O restante do pacote não foi extraído: inventário, loja e janelas maiores só devem entrar quando os respectivos sistemas existirem.
