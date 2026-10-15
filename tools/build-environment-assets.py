#!/usr/bin/env python3
"""Gera os assets de ambiente do mapa a partir do pack do mantenedor.

Fonte unica: docs/PostApocalypse_AssetPack_v1.1.2.zip (licenca declarada pelo
mantenedor em 2026-10-14, ver docs/ENVIRONMENT_ASSET_PLAN.md). O script:

  1. extrai os objetos escolhidos (mata das bordas e cenario urbano);
  2. remonta os pisos de cada area em laminas 512x512 (16x16 tiles a 2x) com
     clareiras de terra e detalhes medidos no proprio tileset, que quebram a
     repeticao 16x16 dos pisos antigos;
  3. monta a faixa de estrada com as pecas de asfalto do pack;
  4. monta as transicoes entre areas (terra -> mata das ruinas etc.);
  5. monta o tile de parede usado pelas ruinas.

Todas as coordenadas de celula vem de medicao (largura de costura, fracao de
pixels "marcados" e compatibilidade de borda com o piso base), nunca de
suposicao. O pack tem 1.113 PNGs; o plano de ambiente proibe importar o
conjunto inteiro, entao a lista abaixo e explicita.

Uso:
    /tmp/imgvenv/bin/python tools/build-environment-assets.py
"""
import io
import json
import sys
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "docs" / "PostApocalypse_AssetPack_v1.1.2.zip"
ENVIRONMENT = ROOT / "assets" / "environment"

SCALE = 2          # o mundo desenha terreno, props e personagem a 2x
CELL = 16          # grade do pack
SHEET_CELLS = 16   # laminas de 16x16 tiles => 512x512 px a 2x

# --- 1. objetos extraidos -----------------------------------------------------
# chave local -> caminho dentro do zip. Paleta Dark-Green/Rust sempre que existir.
BORDER_OBJECTS = {
    "tree-spruce": "Objects/Nature/Dark-Green/Tree_1_Spruce_Dark-Green.png",
    "tree-spruce-sparse": "Objects/Nature/Dark-Green/Tree_2_Spruce-Sparse_Dark-Green.png",
    "tree-normal": "Objects/Nature/Dark-Green/Tree_3_Normal_Dark-Green.png",
    "tree-big": "Objects/Nature/Dark-Green/Tree_5_Big_Dark-Green.png",
    "tree-big-pine": "Objects/Nature/Dark-Green/Tree_6_Big-pine_Dark-Green.png",
    "tree-birch": "Objects/Nature/Dark-Green/Tree_7_Birch_Dark-Green.png",
    "tree-birch-small": "Objects/Nature/Dark-Green/Tree_8_Birch_Dark-Green.png",
    "tree-oak": "Objects/Nature/Dark-Green/Tree_9_Small-oak_Dark-Green.png",
    "tree-oak-small": "Objects/Nature/Dark-Green/Tree_10_Small-oak_Dark-Green.png",
    "tree-trunk": "Objects/Nature/Dark-Green/Tree-trunk_2_grass_Dark-Green.png",
    "bush": "Objects/Nature/Dark-Green/Bush_1_Dark-Green.png",
    "bush-wide": "Objects/Nature/Dark-Green/Bush_2_Dark-Green.png",
    "grass-tuft-small": "Objects/Nature/Dark-Green/Grass_2_Dark-Green.png",
    "grass-tuft": "Objects/Nature/Dark-Green/Grass_3_Dark-Green.png",
    "grass-tuft-low": "Objects/Nature/Dark-Green/Grass_4_Dark-Green.png",
    "grass-tuft-tall": "Objects/Nature/Dark-Green/Grass_5_Dark-Green.png",
    "rock-grass": "Objects/Nature/Dark-Green/Rocks/Rock-grass_Dark-Green.png",
    "stump": "Objects/Nature/Flowers_Mashrooms_Other-nature-stuff/Stump_1.png",
    "stump-mushrooms": "Objects/Nature/Flowers_Mashrooms_Other-nature-stuff/Stump_2_Mushrooms.png",
}

STREET_OBJECTS = {
    "car-wreck": "Objects/Vehicles/Rust/Car_1_Rust/Car_1_Rust_Dark-Blue.png",
    "car-overturned": "Objects/Vehicles/Rust/Car_2_Rust_Upsidedown/Car_2_Rust_Dark-Blue_Upsidedown.png",
    "car-scrap": "Objects/Vehicles/Rust/Car_6_Rust_Scrap/Car_6_Rust_Dark-Blue_Scrap.png",
    "van-wreck": "Objects/Vehicles/Normal/Car_3_Van/Car_3_Blue_Van.png",
    "truck-wreck": "Objects/Vehicles/Rust/Car_7_Rust_Truck/Car_7_Rust_Dark-Blue_Truck_.png",
    "motorcycle-wreck": "Objects/Vehicles/Overgrown/Car_9_Motorcycle/Dark-Green/Car_9_Overgrown_Dark-Green_Blue_Motorcycle_Side.png",
    "street-light-side": "Objects/Street-Light_1_Side.png",
    "street-light-up": "Objects/Street-Light_2_Up.png",
    "street-light-overgrown": "Objects/Street-Light_4_Side_Overgrown_Dark-Green.png",
    "bench": "Objects/Bench_1_down.png",
    "hydrant": "Objects/Hydrant_1_red.png",
    "trash-can": "Objects/Trash-can_1.png",
    "trash-bag": "Objects/Trash-bag_1.png",
    "traffic-cone": "Objects/Traffic-cone.png",
    "stop-sign": "Objects/Stop-sign_Down_1.png",
    "manhole": "Objects/Manhole.png",
    "metal-plates": "Objects/Metal-Plates.png",
    "iron-beam": "Objects/Iron-beam.png",
    "pallet": "Objects/Pallet_1.png",
    "cardboard": "Objects/Cardboard_1.png",
    "shopping-cart": "Objects/Shopping-cart.png",
    "refrigerator": "Objects/Refrigerator.png",
    "washing-machine": "Objects/Washing-machine.png",
    "vending-machine": "Objects/Vending-machine_Red_Overgrown_Dark-Green.png",
    "gray-brick": "Objects/Gray-brick.png",
    "gray-brick-debris": "Objects/Gray-brick_Debris.png",
    "container": "Objects/Container/Container_1_Gray_Vertical.png",
    "exhaust-pipe": "Objects/Exhaust-pipe.png",
}

# --- 2. pisos de area ---------------------------------------------------------
# Celulas (col, row) do tileset Tiles/Background_<paleta>_TileSet.png medidas com:
#   - costura com o proprio tile (borda esquerda x direita + topo x base);
#   - fracao de pixels "marcados" (fora da paleta do piso base);
#   - compatibilidade da borda do bloco com o piso base (blocos que se misturam).
# Pisos lisos: grama (5,0), terra (5,0), concreto (5,9), calçamento (1,1).
BASE_CELLS = {
    "grass": (5, 0),
    "dirt": (5, 0),
    "concrete": (5, 9),
    "pebble": (1, 1),
}
BLOB_CELLS = [(3, 0), (5, 1), (17, 0)]     # vegetacao/flores com blob interno (borda = piso base)
DIRT_CLEARING = (0, 1, 3, 2)               # clareira de terra 3x2 (borda 85% compativel com a grama)
BRICK_FLOOR = (4, 11, 3, 2)                # piso de tijolo 3x2 (material proprio)
CONCRETE_MARKS = (2, 8, 2, 2)              # concreto com marcas 2x2 (material proprio)

SHEETS = {
    # nome -> paleta, base, blocos que se misturam, blocos de material, detalhes, semente
    "ground-dark": dict(
        palette="Dark-Green", base="grass",
        blended=[DIRT_CLEARING], hard=[], patches=BLOB_CELLS, extra=5, blocks=3, seed=11,
    ),
    "ground-bleak": dict(
        palette="Bleak-Yellow", base="dirt",
        blended=[DIRT_CLEARING], hard=[], patches=BLOB_CELLS, extra=5, blocks=3, seed=23,
    ),
    "ground-urban": dict(
        palette="Dark-Green", base="concrete",
        blended=[], hard=[BRICK_FLOOR, CONCRETE_MARKS], patches=[], extra=0, blocks=4, seed=37,
    ),
    "ground-refuge": dict(
        palette="Dark-Green", base="pebble",
        blended=[], hard=[BRICK_FLOOR, CONCRETE_MARKS], patches=[], extra=0, blocks=3, seed=53,
    ),
}

# --- 3. estrada ---------------------------------------------------------------
# Estrada de terra batida: a celula (col 15, row 1) do tileset de fundo e a terra
# marrom do pack com a melhor costura (2.9) e nenhuma marca (0%). O asfalto claro
# do tileset (y=59..67) foi descartado: em escala 2x virava uma grade de placas
# claras que dominava a tela.
ROAD_DIRT_CELL = (15, 1)
ROAD_WIDTH = 32          # px a 1x (64 px a 2x)
ROAD_HEIGHT = 64         # px a 1x (128 px a 2x)
ROAD_FADE = 3            # linhas de dither nas duas bordas
ROAD_RUTS = (18, 30, 42) # trilhas de roda (a 1x)
ROAD_GRAVEL = 7
ROAD_DARK = (0x3B, 0x2C, 0x2D)
ROAD_STONES = ((0x86, 0x8D, 0x6F), (0x5A, 0x4A, 0x4B), (0x74, 0x69, 0x60))
ROAD_SHADE = 0.88       # escurece a terra para a estrada se distinguir do piso das areas

# --- 4. transicoes entre areas ------------------------------------------------
# chave -> (piso de oeste, paleta do oeste, piso de leste, paleta do leste)
EDGES = {
    "edge-bleak-dark": ("dirt", "Bleak-Yellow", "grass", "Dark-Green"),
    "edge-dark-urban": ("grass", "Dark-Green", "concrete", "Dark-Green"),
    "edge-urban-refuge": ("concrete", "Dark-Green", "pebble", "Dark-Green"),
}
EDGE_WIDTH = 48          # px a 1x (96 px a 2x) de dither centrado na divisa

# --- 5. parede das ruinas -----------------------------------------------------
WALL_TILE = "Tiles/Brick-Wall_TileSet.png"
WALL_CELL = (0, 0)       # unico tile sem recorte/entalhe e sem buraco (medido)


def open_pack():
    if not PACK.exists():
        raise SystemExit(f"pack ausente: {PACK}")
    return zipfile.ZipFile(PACK)


def read_png(archive, name):
    try:
        data = archive.read(name)
    except KeyError:
        raise SystemExit(f"arquivo ausente no pack: {name}")
    return Image.open(io.BytesIO(data)).convert("RGBA")


def upscale(image):
    return image.resize((image.width * SCALE, image.height * SCALE), Image.NEAREST)


def save(image, relative):
    path = ENVIRONMENT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return image.width, image.height, path.stat().st_size


def extract(archive, mapping, folder):
    report = []
    for key, source in mapping.items():
        image = read_png(archive, source)
        width, height, size = save(image, f"{folder}/{key}.png")
        report.append((f"{folder}/{key}", width, height, size, source))
    return report


class Tileset:
    """Acesso as celulas de uma paleta do tileset de fundo, com as medidas."""

    def __init__(self, archive, palette):
        self.image = read_png(archive, f"Tiles/Background_{palette}_TileSet.png")
        self.colors = {}

    def cell(self, col, row):
        return self.image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))

    def palette_of(self, key):
        if key not in self.colors:
            cell = self.cell(*BASE_CELLS[key])
            self.colors[key] = sorted({pixel[:3] for pixel in cell.getdata()})
        return self.colors[key]

    @staticmethod
    def is_base_like(pixel, palette, tolerance=24):
        if pixel[3] < 255:
            return False
        return min(
            abs(pixel[0] - ref[0]) + abs(pixel[1] - ref[1]) + abs(pixel[2] - ref[2])
            for ref in palette
        ) <= tolerance

    def base_like(self, cell, key, tolerance=24):
        """Fracao de pixels da celula que pertencem a paleta do piso base."""
        palette = self.palette_of(key)
        pixels = list(cell.getdata())
        shared = sum(1 for pixel in pixels if self.is_base_like(pixel, palette, tolerance))
        return shared / len(pixels)

    def block(self, col, row, width, height):
        return self.image.crop((col * CELL, row * CELL, (col + width) * CELL, (row + height) * CELL))

    def ring_compatibility(self, col, row, width, height, key, tolerance=24):
        """Fracao do anel externo do bloco que ja e do piso base (blocos que se misturam)."""
        block = self.block(col, row, width, height)
        pixels = block.load()
        palette = self.palette_of(key)
        ring = [(x, 0) for x in range(block.width)]
        ring += [(x, block.height - 1) for x in range(block.width)]
        ring += [(0, y) for y in range(1, block.height - 1)]
        ring += [(block.width - 1, y) for y in range(1, block.height - 1)]
        shared = sum(1 for x, y in ring if self.is_base_like(pixels[x, y], palette, tolerance))
        return shared / len(ring)


def dither_mask(width, height, ring=2):
    """Mascara opaca no miolo e em xadrez na borda: cola a clareira sem corte reto."""
    mask = Image.new("L", (width, height), 255)
    pixels = mask.load()
    for y in range(height):
        for x in range(width):
            edge = min(x, y, width - 1 - x, height - 1 - y)
            if edge < ring and (x + y) % 2:
                pixels[x, y] = 0
    return mask


def build_sheet(archive, name, spec):
    tileset = Tileset(archive, spec["palette"])
    base = tileset.cell(*BASE_CELLS[spec["base"]])
    grid = [[base.copy() for _ in range(SHEET_CELLS)] for _ in range(SHEET_CELLS)]

    state = spec["seed"]
    def random():
        nonlocal state
        state = (state * 1664525 + 1013904223) % (2 ** 32)
        return state / 2 ** 32

    blocks = []
    for description, collection in (("clareira", spec["blended"]), ("material", spec["hard"])):
        for col, row, width, height in collection:
            if description == "clareira":
                compatibility = tileset.ring_compatibility(col, row, width, height, spec["base"])
                if compatibility < 0.8:
                    raise SystemExit(
                        f"{name}: clareira {col},{row} nao se mistura com {spec['base']} "
                        f"(compatibilidade {compatibility:.2f})"
                    )
            for _ in range(spec.get("blocks", 3) * 4):
                ox = 1 + int(random() * (SHEET_CELLS - width - 2))
                oy = 1 + int(random() * (SHEET_CELLS - height - 2))
                if any(abs(ox - px) < width + 2 and abs(oy - py) < height + 2 for px, py, _, _ in blocks):
                    continue
                blocks.append((ox, oy, width, height))
                for y in range(height):
                    for x in range(width):
                        cell = tileset.cell(col + x, row + y)
                        ring = 2 if description == "clareira" else 1
                        cell.putalpha(Image.composite(
                            cell.getchannel("A"),
                            Image.new("L", cell.size, 0),
                            dither_mask(CELL, CELL, ring).resize(cell.size),
                        ))
                        grid[oy + y][ox + x] = cell
                break

    for _ in range(spec["extra"]):
        px = 1 + int(random() * (SHEET_CELLS - 2))
        py = 1 + int(random() * (SHEET_CELLS - 2))
        patch = tileset.cell(*spec["patches"][int(random() * len(spec["patches"]))])
        mask = dither_mask(patch.width, patch.height, 2)
        base_alpha = patch.getchannel("A")
        patch.putalpha(Image.composite(base_alpha, Image.new("L", patch.size, 0), mask))
        grid[py][px] = patch

    sheet = Image.new("RGBA", (SHEET_CELLS * CELL, SHEET_CELLS * CELL), (0, 0, 0, 0))
    for y in range(SHEET_CELLS):
        for x in range(SHEET_CELLS):
            sheet.alpha_composite(grid[y][x], (x * CELL, y * CELL))
    return upscale(sheet), blocks


def build_road(archive):
    """Estrada de terra: terra do pack, bordas em dither, trilhas e cascalho."""
    dirt = Tileset(archive, "Dark-Green").cell(*ROAD_DIRT_CELL)
    strip = Image.new("RGBA", (ROAD_WIDTH, ROAD_HEIGHT), (0, 0, 0, 0))
    for y in range(0, ROAD_HEIGHT, CELL):
        for x in range(0, ROAD_WIDTH, CELL):
            strip.alpha_composite(dirt, (x, y))
    pixels = strip.load()

    state = 20251015
    def random():
        nonlocal state
        state = (state * 1664525 + 1013904223) % (2 ** 32)
        return state / 2 ** 32

    # bordas: dither para o piso da area aparecer por baixo da estrada
    for index in range(ROAD_FADE):
        for x in range(ROAD_WIDTH):
            if (x + index * 3) % 3 != 0:
                pixels[x, index] = (0, 0, 0, 0)
            if (x + index * 3) % 3 != 2:
                pixels[x, ROAD_HEIGHT - 1 - index] = (0, 0, 0, 0)

    # trilhas de roda: faixas mais escuras com dither, como terra batida
    for rut in ROAD_RUTS:
        for x in range(ROAD_WIDTH):
            for offset in (0, 1, 2):
                y = rut + offset
                if (x * 2 + y) % 3:
                    continue
                r, g, b, a = pixels[x, y]
                pixels[x, y] = (
                    int(r * 0.55 + ROAD_DARK[0] * 0.45),
                    int(g * 0.55 + ROAD_DARK[1] * 0.45),
                    int(b * 0.55 + ROAD_DARK[2] * 0.45),
                    a,
                )

    # pedras soltas, discretas
    for _ in range(ROAD_GRAVEL):
        x = int(random() * ROAD_WIDTH)
        y = ROAD_FADE + 2 + int(random() * (ROAD_HEIGHT - ROAD_FADE * 2 - 4))
        pixels[x, y] = ROAD_STONES[int(random() * len(ROAD_STONES))] + (255,)

    # sombreamento leve: mantem a textura da terra, mas separa a estrada do piso
    for y in range(ROAD_HEIGHT):
        for x in range(ROAD_WIDTH):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (int(r * ROAD_SHADE), int(g * ROAD_SHADE), int(b * ROAD_SHADE), a)
    return upscale(strip)


def build_edge(archive, west_key, west_palette, east_key, east_palette):
    """Dither vertical entre dois pisos: substitui as linhas pretas de divisa."""
    left = Tileset(archive, west_palette).cell(*BASE_CELLS[west_key])
    right = Tileset(archive, east_palette).cell(*BASE_CELLS[east_key])
    strip = Image.new("RGBA", (EDGE_WIDTH, CELL * 2), (0, 0, 0, 0))
    state = 97
    for y in range(strip.height):
        for x in range(EDGE_WIDTH):
            state = (state * 1103515245 + 12345) % (2 ** 31)
            bias = x / EDGE_WIDTH + (state / 2 ** 31 - 0.5) * 0.5
            source = left if bias < 0.5 else right
            strip.paste(source.crop((x % CELL, y % CELL, x % CELL + 1, y % CELL + 1)), (x, y))
    return upscale(strip)


def build_wall(archive):
    source = read_png(archive, WALL_TILE)
    return upscale(source.crop((
        WALL_CELL[0] * CELL, WALL_CELL[1] * CELL,
        (WALL_CELL[0] + 1) * CELL, (WALL_CELL[1] + 1) * CELL,
    )))


def main():
    archive = open_pack()
    report = {"objects": [], "textures": []}

    report["objects"] += extract(archive, BORDER_OBJECTS, "border")
    report["objects"] += extract(archive, STREET_OBJECTS, "street")

    for name, spec in SHEETS.items():
        sheet, blocks = build_sheet(archive, name, spec)
        width, height, size = save(sheet, f"trail/{name}.png")
        report["textures"].append((f"trail/{name}", width, height, size, f"{spec['palette']} {spec['base']} + {len(blocks)} blocos"))

    road = build_road(archive)
    width, height, size = save(road, "trail/road.png")
    report["textures"].append(("trail/road", width, height, size, "terra batida do pack"))

    for name, (west_key, west_palette, east_key, east_palette) in EDGES.items():
        edge = build_edge(archive, west_key, west_palette, east_key, east_palette)
        width, height, size = save(edge, f"trail/{name}.png")
        report["textures"].append((f"trail/{name}", width, height, size, f"{west_key} -> {east_key}"))

    wall = build_wall(archive)
    width, height, size = save(wall, "trail/wall-brick.png")
    report["textures"].append(("trail/wall-brick", width, height, size, "Brick-Wall_TileSet"))

    print(json.dumps({
        "objects": len(report["objects"]),
        "textures": len(report["textures"]),
        "detail": report,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
