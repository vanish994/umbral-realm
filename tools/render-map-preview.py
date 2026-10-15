#!/usr/bin/env python3
"""Renderiza o mapa estatico do Umbral Realm fora do navegador.

Serve para conferir o resultado visual (pisos, transicoes de area, estrada,
ruinas e props) sem depender de um navegador. A ordem de camadas e a mesma de
src/game.js:

    pisos das areas (depth 0)
      -> detalhes de chao, transicoes e estrada (depth 1, na ordem de insercao)
        -> paredes (depth = y + h) e props (depth = y, ou 2 quando flat)

O arquivo de configuracao e lido do proprio modulo do jogo (via node), entao o
preview nunca diverge de src/world-config.js.

Uso:
    /tmp/imgvenv/bin/python tools/render-map-preview.py docs/previews/mapa.png
    /tmp/imgvenv/bin/python tools/render-map-preview.py /tmp/crop.png --crop 100,300,700,400
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WORLD_CONFIG = ROOT / "src" / "world-config.js"
FOLDERS = ("border", "street", "trail")

FONT = None
for candidate in (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
):
    if Path(candidate).exists():
        FONT = candidate
        break


def load_world():
    """Le src/world-config.js executando o modulo com node."""
    script = "const w = require(process.argv[1]);process.stdout.write(JSON.stringify(w));"
    output = subprocess.run(
        ["node", "-e", script, str(WORLD_CONFIG)],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(output)


def font(size):
    if FONT:
        return ImageFont.truetype(FONT, size)
    return ImageFont.load_default()


def load_asset(relative):
    path = ROOT / relative
    if not path.exists():
        raise SystemExit(f"asset ausente: {relative}")
    return Image.open(path).convert("RGBA")


def load_prop(key):
    for folder in FOLDERS:
        path = ROOT / "assets" / "environment" / folder / f"{key}.png"
        if path.exists():
            return Image.open(path).convert("RGBA")
    raise SystemExit(f"prop sem PNG: {key}")


def tile(canvas, image, box, offset=(0, 0)):
    """Repete uma textura como o tileSprite do Phaser (escala 1:1, fase no canto)."""
    x0, y0, x1, y1 = box
    step_x, step_y = image.width, image.height
    start_x = x0 - (x0 - offset[0]) % step_x
    start_y = y0 - (y0 - offset[1]) % step_y
    for y in range(start_y, y1, step_y):
        for x in range(start_x, x1, step_x):
            canvas.alpha_composite(image, (x, y))


def sprite(image, x, y, scale):
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    return image.resize((width, height), Image.NEAREST), (round(x - width / 2), round(y - height))


def render(world):
    width = world["world"]["width"]
    height = world["world"]["height"]
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 255))

    # depth 0 - pisos das areas (tileSprite 512x512 na escala 1:1).
    for area in world["areas"]:
        ground = load_asset(f"assets/environment/trail/{area['ground']}.png")
        tile(canvas, ground, (area["startX"], 0, area["endX"], height), (area["startX"], 0))

    # depth 1 - detalhes de chao, transicoes de area e estrada, nesta ordem.
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    detail = load_asset("assets/environment/trail/ground-detail.png")
    for x, y in world["groundDetails"]:
        scaled, corner = sprite(detail, x, y, 2)
        scaled.putalpha(scaled.getchannel("A").point(lambda value: int(value * 0.7)))
        overlay.alpha_composite(scaled, corner)
    for edge in world["areaEdges"]:
        edge_image = load_asset(f"assets/environment/trail/{edge['key']}.png")
        tile(overlay, edge_image, (edge["x"] - edge_image.width // 2, 0, edge["x"] + edge_image.width, height))
    road = world["road"]
    road_image = load_asset(f"assets/environment/trail/{road['key']}.png")
    tile(overlay, road_image, (road["x"], road["y"], road["x"] + road["width"], road["y"] + road["height"]))
    canvas.alpha_composite(overlay)

    # paredes + props, ordenados por profundidade como a display list do Phaser.
    drawables = []
    wall = load_asset("assets/environment/trail/wall-brick.png")
    for solid in world["solids"]:
        if solid.get("border"):
            continue
        drawables.append((solid["y"] + solid["h"], len(drawables), ("wall", solid, wall)))
    for prop in world["props"]:
        image = load_prop(prop["key"])
        depth = 2 if prop.get("flat") else prop["y"]
        drawables.append((depth, len(drawables), ("prop", prop, image)))
    for depth, _, (kind, item, image) in sorted(drawables, key=lambda entry: (entry[0], entry[1])):
        if kind == "wall":
            layer = Image.new("RGBA", (item["w"], item["h"]), (0, 0, 0, 0))
            tile(layer, image, (0, 0, item["w"], item["h"]))
            canvas.alpha_composite(layer, (item["x"], item["y"]))
        else:
            scaled, corner = sprite(image, item["x"], item["y"], item.get("scale", 1))
            canvas.alpha_composite(scaled, corner)

    # nomes das areas (texto do Phaser, para orientacao no preview).
    labels = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(labels)
    for index, area in enumerate(world["areas"]):
        color = (0xF0, 0xD7, 0xA0) if index == len(world["areas"]) - 1 else (0xD6, 0xC4, 0x9F)
        text = area["name"]
        text_font = font(20)
        box = draw.textbbox((0, 0), text, font=text_font)
        draw.text(
            ((area["startX"] + area["endX"]) / 2 - (box[2] - box[0]) / 2, 170 - (box[3] - box[1]) / 2),
            text, font=text_font, fill=color + (255,),
        )
    canvas.alpha_composite(labels)
    return canvas.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?", default="docs/previews/mapa.png")
    parser.add_argument("--scale", type=float, default=0.5)
    parser.add_argument("--crop", help="x,y,w,h em coordenadas do mundo (escala 1)")
    parser.add_argument("--crop-scale", type=float, default=1.0)
    args = parser.parse_args()

    world = load_world()
    image = render(world)
    if args.crop:
        x, y, w, h = (int(part) for part in args.crop.split(","))
        image = image.crop((x, y, x + w, y + h))
        if args.crop_scale != 1:
            image = image.resize(
                (round(image.width * args.crop_scale), round(image.height * args.crop_scale)), Image.LANCZOS
            )
    elif args.scale != 1:
        image = image.resize(
            (max(1, round(image.width * args.scale)), max(1, round(image.height * args.scale))), Image.LANCZOS
        )
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output)
    print(f"{output}  {image.width}x{image.height}")


if __name__ == "__main__":
    sys.exit(main())
