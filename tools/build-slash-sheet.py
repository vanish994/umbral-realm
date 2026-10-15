#!/usr/bin/env python3
"""Converte a arte-fonte da Gemini (JPEG 1024x1024, 6 linhas x 8 colunas) na spritesheet
de ataque com faca usada pelo jogo.

Cada celula da fonte tem 128 x 170,67 px e desenha o personagem a ~2,8 px de imagem por
pixel-arte. O script reduz a arte para a mesma escala/ancoragem dos sprites atuais do
jogador (`assets/characters/male/Idle/idle.png`, celula 48x64, pes na linha 43, corpo
centrado em x=24), quantiza as cores na paleta ja usada pelo personagem e grava
`assets/characters/male/Attack/knife-attack.png` com 6 linhas (direcoes) x 12 quadros.

Ordem das linhas (conferida contra os sprites de idle/walk/death do jogador e igual a
folha de tiro): down, left-down, left-up, up, right-up, right-down.

Uso:  python3 tools/build-slash-sheet.py <origem.jpeg> <destino.png>
Requer: pillow
"""
import json
import statistics
import sys
from pathlib import Path

from PIL import Image, ImageChops

WHITE_CUT = 236          # acima disso o pixel e' fundo branco puro
WHITE_FULL = 190         # abaixo disso o pixel e' opaco; entre os dois a alpha sobe em rampa
CELL_W, CELL_H = 48, 64  # mesma celula dos sprites direcionais do jogador
COLUMNS, ROWS = 8, 6
SOURCE_SIDE = 1024
SOURCE_COLUMN = SOURCE_SIDE // COLUMNS
DIRECTIONS = ["down", "left-down", "left-up", "up", "right-up", "right-down"]
# 8 quadros gerados -> 12 quadros de jogo, segurando o pre-ataque e o impacto.
HOLD_SEQUENCE = [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7]
TARGET_BODY_HEIGHT = 25  # altura (px de sprite) do corpo masculino no idle atual
FEET_Y = 43              # linha dos pes no idle atual (celula 48x64)
CENTER_X = 24            # centro do corpo no idle atual
BODY_LUMA = 130          # personagem e' escuro; o clarao azulado e' claro
PALETTE_FILES = ["Idle/idle.png", "Walk/walk.png", "Death/death_normal.png"]
SOURCE_PALETTE_COLORS = 24
EFFECT_PALETTE_COLORS = 6


def white_key(image):
    """Fundo branco -> transparente com rampa suave; pixels transparentes ficam pretos."""
    rgb = image.convert("RGB")
    red, green, blue = rgb.split()
    lowest = ImageChops.darker(red, ImageChops.darker(green, blue))
    span = WHITE_CUT - WHITE_FULL
    alpha = lowest.point(lambda value: 0 if value >= WHITE_CUT else 255 if value <= WHITE_FULL else round(255 * (WHITE_CUT - value) / span))
    keyed = Image.new("RGBA", image.size, (0, 0, 0, 0))
    keyed.paste(rgb, (0, 0), alpha)
    return keyed


def cell_box(row, column):
    top = round(row * SOURCE_SIDE / ROWS)
    bottom = round((row + 1) * SOURCE_SIDE / ROWS)
    left = column * SOURCE_COLUMN
    return left, top, left + SOURCE_COLUMN, bottom


def body_box(cell):
    """Caixa do corpo (pixels escuros opacos) dentro da celula da fonte."""
    opaque = cell.getchannel("A").point(lambda value: 255 if value > 40 else 0)
    dark = cell.convert("L").point(lambda value: 255 if value < BODY_LUMA else 0)
    box = ImageChops.multiply(opaque, dark).getbbox()
    if box is None:
        raise SystemExit("celula sem pixels de personagem")
    return box


def build_palette(source):
    """Paleta do personagem existente + poucas cores da propria arte (lamina e clarao)."""
    colors = set()
    for relative in PALETTE_FILES:
        sheet = Image.open(Path(__file__).resolve().parent.parent / "assets/characters/male" / relative).convert("RGBA")
        for count, color in sheet.getcolors(1 << 22):
            if count and color[3] > 200:
                colors.add(color[:3])
    quantized = source.convert("RGB").quantize(colors=SOURCE_PALETTE_COLORS, method=Image.MEDIANCUT).convert("RGB")
    colors.update(color for _, color in quantized.getcolors(1 << 22) if min(color) < WHITE_CUT)
    rgb = source.convert("RGB")
    effect = [pixel for pixel in list(rgb.getdata()) if pixel[2] > pixel[0] + 18 and pixel[1] > pixel[0] + 5 and sum(pixel) / 3 > 150]
    if effect:
        strip = Image.new("RGB", (len(effect), 1))
        strip.putdata(effect)
        colors.update(color for _, color in strip.quantize(colors=EFFECT_PALETTE_COLORS, method=Image.MEDIANCUT).convert("RGB").getcolors(1 << 22))
    palette = sorted(colors)
    table = Image.new("P", (1, 1))
    flat = [channel for color in palette for channel in color]
    table.putpalette(flat + [0] * (3 * 256 - len(flat)))
    return table, palette


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    source_path, destination = Path(sys.argv[1]), Path(sys.argv[2])
    keyed = white_key(Image.open(source_path))
    palette, palette_colors = build_palette(keyed)
    print(f"paleta: {len(palette_colors)} cores")

    # 1) Medir o corpo em quadros parados (0, 6 e 7 nao tem efeito) para achar a escala.
    bodies, references = [], []
    for row in range(ROWS):
        boxes = [body_box(keyed.crop(cell_box(row, column))) for column in (0, 6, 7)]
        bodies.append(statistics.median([box[3] - box[1] + 1 for box in boxes]))
        origin_x, origin_y = cell_box(row, 0)[0], cell_box(row, 0)[1]
        references.append({
            "center": origin_x + statistics.median([(box[0] + box[2]) / 2 for box in boxes]),
            "feet": origin_y + statistics.median([box[3] for box in boxes]),
        })
    body_height = statistics.median(bodies)
    scale = body_height / TARGET_BODY_HEIGHT  # px da fonte por px final
    print(f"altura do corpo na fonte: {body_height:.1f} px -> reducao de 1/{scale:.3f}")

    # 2) Montar a folha final: 12 colunas (quadros repetidos) x 6 linhas (direcoes).
    columns = len(HOLD_SEQUENCE)
    sheet = Image.new("RGBA", (CELL_W * columns, CELL_H * ROWS), (0, 0, 0, 0))
    rows_meta = {}
    clipped = []
    for row in range(ROWS):
        reference = references[row]
        translate_x = reference["center"] - CENTER_X * scale
        translate_y = reference["feet"] - FEET_Y * scale
        for slot, source_column in enumerate(HOLD_SEQUENCE):
            frame = keyed.transform(
                (CELL_W, CELL_H), Image.AFFINE,
                (scale, 0, translate_x + source_column * SOURCE_COLUMN,
                 0, scale, translate_y),
                resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0),
            )
            solid = frame.getchannel("A").point(lambda value: 255 if value >= 120 else 0)
            edge = any(solid.getpixel(point) for point in
                       [(x, 0) for x in range(CELL_W)] + [(x, CELL_H - 1) for x in range(CELL_W)] +
                       [(0, y) for y in range(CELL_H)] + [(CELL_W - 1, y) for y in range(CELL_H)])
            if edge:
                clipped.append((row, slot))
            snapped = frame.convert("RGB").quantize(palette=palette, dither=Image.NONE).convert("RGB")
            merged = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
            merged.paste(snapped, (0, 0), solid)
            sheet.paste(merged, (slot * CELL_W, row * CELL_H))
        rows_meta[DIRECTIONS[row]] = {"row": row, "holdSequence": HOLD_SEQUENCE}

    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)
    metadata = {
        "meta": {
            "image": destination.name,
            "source": source_path.name,
            "size": {"w": sheet.width, "h": sheet.height},
            "frameWidth": CELL_W,
            "frameHeight": CELL_H,
            "columns": columns,
            "rows": ROWS,
            "totalFrames": columns * ROWS,
            "directionOrder": DIRECTIONS,
            "frameIndexOrder": "esquerda para direita, de cima para baixo",
            "sourceScale": round(scale, 4),
            "sourceBodyHeightPx": round(body_height, 2),
            "paletteColors": len(palette_colors),
            "note": "Quadros 0/1 e 4/5 repetidos para segurar o pre-ataque e o impacto em 12 quadros por direcao.",
        },
        "directions": rows_meta,
    }
    destination.with_suffix(".json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"gravado {destination} ({sheet.width}x{sheet.height}) e {destination.with_suffix('.json').name}")
    if clipped:
        print(f"atencao: quadros encostando na borda da celula: {clipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
