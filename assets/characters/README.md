# Character assets

Source packs are retained in `docs/`. Extracted PNG assets are organized here for the Phaser 3 game.

## Folders
- `male/`: male adventurer animations and related effects.
- `female/`: female adventurer animations and related effects.

## Sprite layout
The supplied directional sheets are generally 384×64 px (8 frames of 48×64 px).
Combined sheets may use a different grid; check the image dimensions before loading them.
Load the directional PNGs with Phaser 3 and create animations for idle, walk, dash, jump and death as needed.
Asset extraction does not yet wire these sprites into the player scene.
