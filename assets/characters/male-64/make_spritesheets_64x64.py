from PIL import Image
import numpy as np, json, os
from collections import deque

SRC = '/home/user/uploads/ChatBox_image.jpg'
OUT = '/home/user/spritesheets_64x64'
os.makedirs(OUT, exist_ok=True)

cols = [(41,283),(352,587),(673,887),(985,1205)]
rows = [(80,531),(669,1111)]
names_top = ['front','front-right','right','back-right']
names_bot = ['back','back-left','left','front-left']
cells = []
for i,(x0,x1) in enumerate(cols): cells.append((names_top[i], x0, rows[0][0], x1, rows[0][1]))
for i,(x0,x1) in enumerate(cols): cells.append((names_bot[i], x0, rows[1][0], x1, rows[1][1]))

im = Image.open(SRC).convert('RGB')

def extract(x0,y0,x1,y1,pad=8):
    x0=max(0,x0-pad); y0=max(0,y0-pad); x1=min(im.width,x1+pad); y1=min(im.height,y1+pad)
    crop = im.crop((x0,y0,x1,y1))
    arr = np.array(crop).astype(int)
    mx=arr.max(axis=2); mn=arr.min(axis=2)
    is_bg_candidate = (mn>175) & ((mx-mn)<30)  # light checker
    h,w = is_bg_candidate.shape
    # flood fill from borders through bg_candidate
    visited=np.zeros((h,w),bool)
    dq=deque()
    for xx in range(w):
        for yy in (0,h-1):
            if is_bg_candidate[yy,xx] and not visited[yy,xx]:
                visited[yy,xx]=True; dq.append((yy,xx))
    for yy in range(h):
        for xx in (0,w-1):
            if is_bg_candidate[yy,xx] and not visited[yy,xx]:
                visited[yy,xx]=True; dq.append((yy,xx))
    while dq:
        yy,xx=dq.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=yy+dy,xx+dx
            if 0<=ny<h and 0<=nx<w and not visited[ny,nx] and is_bg_candidate[ny,nx]:
                visited[ny,nx]=True; dq.append((ny,nx))
    alpha = np.where(visited,0,255).astype(np.uint8)
    # clean isolated transparent holes? keep as is
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    img = Image.fromarray(rgba,'RGBA')
    bbox = img.getbbox()
    return img.crop(bbox)

FRAME_W, FRAME_H = 64, 64
MAX_W, MAX_H = 56, 60

def normalize(sprite):
    # scale to fit MAX with NEAREST, integer-ish scale down
    w,h = sprite.size
    scale = min(MAX_W/w, MAX_H/h)
    nw, nh = max(1,int(w*scale)), max(1,int(h*scale))
    return sprite.resize((nw,nh), Image.NEAREST)

def shift_region(base, y_start_ratio, x_split_ratio, left_dx, left_dy, right_dx, right_dy, sway=0):
    """Animate legs (bottom region) and cloak sway."""
    frame = Image.new('RGBA', (FRAME_W, FRAME_H), (0,0,0,0))
    # place base anchored bottom-center, bob applied later by caller paste offset
    return frame  # placeholder

# Walk cycle: bob, left leg (dx,dy), right leg (dx,dy), cloak sway
CYCLE = [
    ( 0,  0, 0,  0, 0,  0),
    (-1, -1,-1,  1, 0,  1),
    (-2,  0, 0,  0, 0,  0),
    ( 0,  1, 0, -1,-1, -1),
    (-1,  0, 0,  0, 0,  0),
    (-2,  0, 0,  0, 0,  1),
]

def make_frame(base, params):
    bob, ldx, ldy, rdx, rdy, sway = params
    w,h = base.size
    anim = base.copy()
    leg_y = int(h*0.84)
    mid_x = w//2
    # save leg crops BEFORE clearing
    left_leg = base.crop((0,leg_y,mid_x,h)).copy()
    right_leg = base.crop((mid_x,leg_y,w,h)).copy()
    # cloak sway: shift a thin bottom strip of cloak (just above legs) by sway px
    if sway != 0:
        cloak_y = int(h*0.70)
        strip = base.crop((0,cloak_y,w,leg_y)).copy()
        anim.paste(Image.new('RGBA',(w,leg_y-cloak_y),(0,0,0,0)), (0,cloak_y))
        anim.paste(strip, (sway,cloak_y), strip)
    # clear leg area and redraw offset
    anim.paste(Image.new('RGBA',(w,h-leg_y),(0,0,0,0)), (0,leg_y))
    anim.paste(left_leg, (ldx, leg_y+ldy), left_leg)
    anim.paste(right_leg, (mid_x+rdx, leg_y+rdy), right_leg)
    canvas = Image.new('RGBA',(FRAME_W,FRAME_H),(0,0,0,0))
    ox = (FRAME_W-w)//2
    oy = FRAME_H - h + bob
    canvas.paste(anim,(ox,oy),anim)
    return canvas

for name,x0,y0,x1,y1 in cells:
    sprite = extract(x0,y0,x1,y1)
    base = normalize(sprite)
    frames=[]
    for p in CYCLE:
        frames.append(make_frame(base,p))
    sheet = Image.new('RGBA',(FRAME_W*6, FRAME_H),(0,0,0,0))
    for i,f in enumerate(frames):
        sheet.paste(f,(i*FRAME_W,0),f)
    png_path = os.path.join(OUT, f'character_{name}.png')
    sheet.save(png_path)
    data = {
        "frames": {
            f"character_{name}_{i:02d}.png": {
                "frame": {"x": i*FRAME_W, "y": 0, "w": FRAME_W, "h": FRAME_H},
                "rotated": False, "trimmed": False,
                "spriteSourceSize": {"x":0,"y":0,"w":FRAME_W,"h":FRAME_H},
                "sourceSize": {"w":FRAME_W,"h":FRAME_H},
                "duration": 120
            } for i in range(6)
        },
        "meta": {
            "app": "Arena spritesheet generator",
            "version": "1.0",
            "image": f"character_{name}.png",
            "format": "RGBA8888",
            "size": {"w": FRAME_W*6, "h": FRAME_H},
            "scale": "1",
            "frameTags": [{"name":"walk","from":0,"to":5,"direction":"forward","loop":True}],
            "direction": name,
            "frameCount": 6,
            "frameWidth": FRAME_W, "frameHeight": FRAME_H,
            "anchor": {"x": 0.5, "y": 1.0},
            "fps": 8
        }
    }
    with open(os.path.join(OUT, f'character_{name}.json'),'w',encoding='utf-8') as fh:
        json.dump(data,fh,indent=2,ensure_ascii=False)
    print(name, sprite.size, '->', base.size)

print("done")
