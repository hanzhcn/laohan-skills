#!/usr/bin/env python3
"""laohan-fengmianzhuzige v4.0 三层合成封面管线
用法: ~/.venvs/cover/bin/python build_cover.py --brief brief.json --out cover.jpg
brief.json 字段见 samples/brief-example.json。层1背景板缺失时自动调Seedream生成；层2真人帧自动rembg抠像。
"""
import argparse, base64, json, os, subprocess, sys, urllib.request

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # skill根目录
FONT = os.path.join(SKILL_DIR, "assets", "fonts", "SourceHanSansCN-Heavy.otf")
W, H = 1080, 1920
GOLD, RED, BLUE, GREEN = "#F5C518", "#E04545", "#3B82F6", "#22C55E"
COLORS = {"gold": GOLD, "red": RED, "blue": BLUE, "green": GREEN, "white": "#FFFFFF"}

def log(m): print(f"[build_cover] {m}", flush=True)

# ---------- 层1: Seedream 背景板 ----------
def gen_bg(prompt: str, out_path: str) -> str:
    if os.path.exists(out_path):
        log(f"bg plate cached: {out_path}"); return out_path
    key = subprocess.run(["zsh","-ic","echo -n $ARK_API_KEY"],capture_output=True,text=True).stdout.strip()
    if not key: sys.exit("ARK_API_KEY missing")
    body = {"model":"doubao-seedream-5-0-lite-260128","prompt":prompt,
            "size":"1440x2560","response_format":"url","watermark":False}
    open("/tmp/_seedream_req.json","w").write(json.dumps(body))
    r = subprocess.run(["curl","-s","-m","180","https://ark.cn-beijing.volces.com/api/v3/images/generations",
        "-H",f"Authorization: Bearer {key}","-H","Content-Type: application/json",
        "--data-binary","@/tmp/_seedream_req.json"],capture_output=True,text=True)
    d = json.loads(r.stdout)
    url = d["data"][0]["url"]
    urllib.request.urlretrieve(url, out_path)
    log(f"bg plate generated -> {out_path}")
    return out_path

# ---------- 层2: rembg 真人抠像 ----------
def cutout(person_frame: str, out_path: str) -> str:
    if os.path.exists(out_path): log(f"cutout cached: {out_path}"); return out_path
    from rembg import remove, new_session
    from PIL import Image
    sess = new_session("u2net")
    im = Image.open(person_frame).convert("RGBA")
    result = remove(im, session=sess)
    bbox = result.getbbox()
    result = result.crop(bbox)
    result.save(out_path)
    log(f"cutout -> {out_path} (bbox {bbox})")
    return out_path

# ---------- 层3: 排版 ----------
def _font(size): from PIL import ImageFont; return ImageFont.truetype(FONT, size)

def draw_tracked(d, xy, text, font, fill, tracking=0, anchor_center_x=None, shadow=None):
    x, y = xy
    if anchor_center_x is not None:
        wsum = sum(d.textlength(c, font=font) + tracking for c in text) - (tracking if text else 0)
        x = anchor_center_x - wsum / 2
    for c in text:
        if shadow:
            off, sc = shadow
            d.text((x+off, y+off), c, font=font, fill=sc)
        d.text((x, y), c, font=font, fill=fill)
        x += d.textlength(c, font=font) + tracking
    return x

def draw_tracked_rgba(layer, xy, text, font, fill, tracking=0, center_x=None):
    from PIL import ImageDraw
    d = ImageDraw.Draw(layer)
    x, y = xy
    if center_x is not None:
        wsum = sum(d.textlength(c, font=font) + tracking for c in text) - (tracking if text else 0)
        x = center_x - wsum / 2
    for c in text:
        d.text((x, y), c, font=font, fill=fill)
        x += d.textlength(c, font=font) + tracking
    return x

def text_width(d, text, font, tracking=0):
    return sum(d.textlength(c, font=font) + tracking for c in text) - (tracking if text else 0)

def build(brief: dict, bg_path: str, cut_path: str, out_path: str):
    from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
    # 画布 = 背景板
    bg = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
    canvas = bg.convert("RGBA")

    # 层2 真人（两种模式）
    if brief.get("person_mode") == "block_tr":
        # 右上角矩形照片块（柱子哥#81式）：从原帧裁块，圆角+投影
        from PIL import ImageDraw as _ID
        frame = Image.open(brief["person_frame"]).convert("RGB")
        bx, by, bw, bh = brief["person_block"]  # 源帧像素坐标
        block = frame.crop((bx, by, bx+bw, by+bh))
        tw = int(W * brief.get("person_block_width", 0.63))
        th = int(tw * bh / bw)
        block = block.resize((tw, th), Image.LANCZOS)
        block = ImageEnhance.Brightness(block).enhance(0.88)
        block = ImageEnhance.Color(block).enhance(0.90)
        # 圆角遮罩
        mask = Image.new("L", (tw, th), 0)
        _ID.Draw(mask).rounded_rectangle([0, 0, tw, th], radius=22, fill=255)
        px = W - tw - int(W * brief.get("person_right_margin", 0.04))
        py = int(H * brief.get("person_top", 0.10))
        # 投影
        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        ImageDraw.Draw(sh).rounded_rectangle([px+10, py+14, px+tw+10, py+th+14], radius=22, fill=(0,0,0,160))
        canvas = Image.alpha_composite(canvas, sh.filter(ImageFilter.GaussianBlur(24)))
        canvas.paste(block, (px, py), mask)
    else:
        person = Image.open(cut_path).convert("RGBA")
        target_h = int(H * brief.get("person_height", 0.62))
        max_w = int(W * brief.get("person_max_width", 0.78))
        scale = min(target_h / person.height, max_w / person.width)  # 宽高双约束，防爆框
        person = person.resize((int(person.width*scale), int(person.height*scale)), Image.LANCZOS)
        person = ImageEnhance.Color(person).enhance(0.92)
        person = ImageEnhance.Brightness(person).enhance(0.97)
        px = W - person.width - int(W * brief.get("person_right_margin", 0.04))
        py = H - person.height - int(H * brief.get("person_bottom_margin", 0.10))
        # 底部投影
        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        ds = ImageDraw.Draw(sh)
        ds.ellipse([px+30, py+person.height-60, px+person.width-30, py+person.height+50], fill=(0,0,0,150))
        sh = sh.filter(ImageFilter.GaussianBlur(38))
        canvas = Image.alpha_composite(canvas, sh)
        canvas = canvas.convert("RGBA")
        canvas.alpha_composite(person, (max(0, px), max(0, py)))

    # 文字区压暗渐变（下半屏 scrim，保证字可读）
    scrim = Image.new("RGBA", (W, H), (0,0,0,0))
    dsc = ImageDraw.Draw(scrim)
    for i in range(int(H*0.42)):
        a = int(120 * (i / (H*0.42))**1.5)
        dsc.line([(0, H-int(H*0.42)+i), (W, H-int(H*0.42)+i)], fill=(0,0,0,a))
    canvas = Image.alpha_composite(canvas, scrim)

    # 层3 标题组
    t = brief["title_group"]
    # 阴影子层（模糊）
    txt_shadow = Image.new("RGBA", (W, H), (0,0,0,0))
    dts = ImageDraw.Draw(txt_shadow)
    txt = Image.new("RGBA", (W, H), (0,0,0,0))
    dt = ImageDraw.Draw(txt)

    # 眉题（左上，宽字距）
    f_eb = _font(t.get("eyebrow_size", 38))
    draw_tracked_rgba(txt_shadow, (84, 112), t["eyebrow"], f_eb, (0,0,0,200), tracking=16)
    draw_tracked_rgba(txt, (80, 108), t["eyebrow"], f_eb, (255,255,255,215), tracking=16)
    # 眉题左侧小竖条
    dt.rectangle([56, 112, 64, 112+f_eb.size+8], fill=(255,255,255,215))

    # 引导行（白）
    f_lead = _font(t.get("lead_size", 100))
    lw = text_width(dt, t["lead"], f_lead)
    lead_y = t.get("lead_y", 1150)
    dts.text((W/2-lw/2+6, lead_y+6), t["lead"], font=f_lead, fill=(0,0,0,230))
    dt.text((W/2-lw/2, lead_y), t["lead"], font=f_lead, fill=(255,255,255,255))

    # kicker（特大语义色）
    f_kick = _font(t.get("kicker_size", 225))
    kw = text_width(dt, t["kicker"], f_kick)
    kick_y = t.get("kicker_y", 1275)
    col = COLORS.get(t.get("kicker_color","gold"), GOLD)
    dts.text((W/2-kw/2+10, kick_y+10), t["kicker"], font=f_kick, fill=(0,0,0,235))
    dt.text((W/2-kw/2, kick_y), t["kicker"], font=f_kick, fill=col)

    # 高亮条（黄底黑字）
    if t.get("bar"):
        f_bar = _font(t.get("bar_size", 58))
        bw = text_width(dt, t["bar"], f_bar)
        pad_x, pad_y = 34, 16
        bar_y = t.get("bar_y", 1585)
        dt.rounded_rectangle([W/2-bw/2-pad_x, bar_y, W/2+bw/2+pad_x, bar_y+f_bar.size+pad_y*2],
                             radius=10, fill=(245,197,24,255))
        dt.text((W/2-bw/2, bar_y+pad_y-2), t["bar"], font=f_bar, fill=(20,16,4,255))

    # 底部英文脚注
    f_ft = _font(t.get("footer_size", 30))
    draw_tracked_rgba(txt_shadow, (0, 1815), t["footer"], f_ft, (0,0,0,160), tracking=10, center_x=W/2)
    draw_tracked_rgba(txt, (0, 1812), t["footer"], f_ft, (255,255,255,135), tracking=10, center_x=W/2)

    txt_shadow = txt_shadow.filter(ImageFilter.GaussianBlur(6))
    canvas = Image.alpha_composite(canvas, txt_shadow)
    canvas = Image.alpha_composite(canvas, txt)

    canvas.convert("RGB").save(out_path, quality=92)
    log(f"cover -> {out_path}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brief", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workdir", default=None)
    a = ap.parse_args()
    brief = json.load(open(a.brief))
    wd = a.workdir or os.path.dirname(os.path.abspath(a.out))
    os.makedirs(wd, exist_ok=True)
    bg_path = os.path.join(wd, "bg_plate.png")
    if brief.get("bg_prompt"):
        gen_bg(brief["bg_prompt"], bg_path)
    else:
        bg_path = brief["bg_image"]
    cut_path = os.path.join(wd, "person_cutout.png")
    cutout(brief["person_frame"], cut_path)
    build(brief, bg_path, cut_path, a.out)

if __name__ == "__main__":
    main()
