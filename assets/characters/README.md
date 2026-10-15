# Character assets

Source packs are retained in `docs/`. Extracted PNG assets are organized here for the Phaser 3 game.

## Folders
- `male/`: male adventurer animations and related effects (idle, walk, death, dash, jump, attack and shoot).
- `female/`: female adventurer animations and related effects.

## Sprite layout
The supplied directional sheets are generally 384×64 px (8 frames of 48×64 px).
Combined sheets may use a different grid; check the image dimensions before loading them.

All six-direction player sheets share the same row order, confirmed by comparing every row against
the individual PNGs of the original pack:

| Row | Direction | Notes |
|---|---|---|
| 0 | `down` | front view |
| 1 | `left-down` | left profile |
| 2 | `left-up` | plain side pose |
| 3 | `up` | back view |
| 4 | `right-up` | right profile looking up |
| 5 | `right-down` | right profile looking down |

`src/animation-rules.js` is the single source of truth for that table; idle, walk, death and both
attack sheets use it.

## Attack sheets

| Folder | File | Grid | Used for |
|---|---|---|---|
| `male/Attack/` | `knife-attack.png` (+ `.json`) | 12 × 6 frames of 48×64 | melee attack (`close` action: knife and katana) |
| `male/Shoot/` | `pistol-shoot.png` (+ `.json`) | 8 × 6 frames of 48×64 | firearm attack (`far` action: revolver and pistol) |

`knife-attack.png` is generated from `docs/source-art/male-slash-source.jpeg` (the 1024×1024 art
delivered for this task) with:

```bash
python3 tools/build-slash-sheet.py docs/source-art/male-slash-source.jpeg assets/characters/male/Attack/knife-attack.png
```

The converter keys the white background, scales the standing body to the same 25 px height and feet
line (y = 43) used by the idle sprite, quantizes the result on the character palette already shipped
in `Idle/`, `Walk/` and `Death/`, and writes the `.json` metadata next to the sheet. It requires
Pillow. Re-running it must keep `src/animation-rules.js` consistent (12 columns, 6 rows, same row order).

`pistol-shoot.png` is the artwork delivered for this task, kept at its original resolution; its JSON
records the frame rate (12), the muzzle-flash frame (index 4) and the row order.
