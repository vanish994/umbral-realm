# Inimigos

Sprites direcionais fornecidos pelo mantenedor em `docs/` e autorizados para uso no Umbral Realm.

- `zombie-rat/Um_rato_zombie-Idle.png`: rato zumbi, 8 direções em células de 32×32.
- `zombie-wolf/idle.png`: lobo/cachorro zumbi, extraído de `docs/Cachorro_Zombie-Idle-spritesheet.zip`, 8 direções em células de 32×32.
- `slow-zombie/idle.png`: zumbi básico lento, extraído de `docs/Um_zombie_basico_e_lento-Idle-spritesheet.zip`, 8 direções em células de 48×48.
- `scavenger/idle.png` (+ `idle.json`): saqueador humano hostil, extraído de `docs/Saqueador-32x32.zip`, 8 direções em células de 32×32.
- `mutant/idle.png` (+ `idle.json`): mutante de elite, extraído de `docs/Mutante-32x32.zip`, 8 direções em células de 32×32.

Todos os arquivos atuais contêm poses direcionais de idle, não ciclos completos de caminhada, ataque ou morte. A orientação real foi conferida pelos PNGs e metadados JSON antes da integração.

Ordem das oito colunas, igual em todas as folhas de inimigo: sul, sudeste, leste, nordeste, norte,
noroeste, oeste, sudoeste. `moveEnemy` converte o ângulo do movimento em um desses oito quadros.

Cada espécie precisa de uma entrada em `ENEMY_VISUALS` (`src/game.js`) com textura, escala, altura dos
indicadores, área de contato, balanço, largura da barra, raio do marcador e caixa de colisão; o teste
`test/static-app.test.js` falha se uma espécie das regras ficar sem perfil, sem arte ou sem cache offline.
