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

def particles(layer, n, box, color, seed=7, glow=True):
    """暖色氛围粒子：box=(x0,y0,x1,y1)区域内随机光斑"""
    import random
    from PIL import Image, ImageDraw, ImageFilter
    rnd = random.Random(seed)
    dot = Image.new("RGBA", layer.size, (0,0,0,0))
    dd = ImageDraw.Draw(dot)
    for _ in range(n):
        x = rnd.randint(box[0], box[2]); y = rnd.randint(box[1], box[3])
        r = rnd.randint(2, 7); a = rnd.randint(50, 160)
        dd.ellipse([x-r, y-r, x+r, y+r], fill=color+(a,))
    if glow:
        dot = dot.filter(ImageFilter.GaussianBlur(6))
    layer.alpha_composite(dot)
    core = Image.new("RGBA", layer.size, (0,0,0,0))
    dd2 = ImageDraw.Draw(core)
    rnd2 = random.Random(seed)
    for _ in range(n):
        x = rnd2.randint(box[0], box[2]); y = rnd2.randint(box[1], box[3])
        r = max(1, rnd2.randint(2, 7)//2); a = rnd2.randint(70, 190)
        dd2.ellipse([x-r, y-r, x+r, y+r], fill=color+(a,))
    layer.alpha_composite(core)

def build(brief: dict, bg_path: str, cut_path: str, out_path: str):
    from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
    # 画布 = 背景板
    bg = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
    canvas = bg.convert("RGBA")
    atmo = brief.get("atmosphere", {})
    if atmo:
        # 背景层粒子（人物后面）
        for grp in atmo.get("behind_person", []):
            particles(canvas, grp["n"], grp["box"], tuple(grp["color"]), seed=grp.get("seed",7))

    # 层2 真人（两种模式）
    if brief.get("person_mode") == "integrated":
        # 融入模式（亮背景素材解法）：抠像+压暗调色+暖光勾边+底部溶隐+投影落地
        # 人物右位移脸让场景呼吸，文字压下身形成深度三明治——不依赖环境暗场
        person = Image.open(cut_path).convert("RGBA")
        ph = int(H * brief.get("integrated_height", 0.535))
        s = ph / person.height
        pw = int(person.width * s)
        person = person.resize((pw, ph), Image.LANCZOS)
        # 调色：压暗+降饱和+冷色罩，让真人进入场景色温
        rgb = person.convert("RGB")
        rgb = ImageEnhance.Brightness(rgb).enhance(brief.get("integrated_brightness", 0.84))
        rgb = ImageEnhance.Color(rgb).enhance(brief.get("integrated_saturation", 0.86))
        tint = Image.new("RGB", rgb.size, tuple(brief.get("integrated_tint", [40,54,78])))
        rgb = Image.composite(tint, rgb, Image.new("L", rgb.size, int(255*brief.get("integrated_tint_alpha", 0.22))))
        # 下半身渐变压暗：躯干坐进场景黑暗（脸保持最亮主体）
        dk_from = brief.get("integrated_darken_from", 0.55)
        dk_to = brief.get("integrated_darken_min", 0.45)
        dark = Image.new("L", rgb.size, 255)
        dd = ImageDraw.Draw(dark)
        for i in range(int(ph*dk_from), ph):
            f = (i - ph*dk_from) / (ph*(1-dk_from))
            dd.line([(0,i),(pw,i)], fill=int(255*(1 - f*(1-dk_to))))
        dark = dark.filter(ImageFilter.GaussianBlur(40))
        rgb = Image.composite(Image.new("RGB", rgb.size, (8,12,20)), rgb, dark.point(lambda v: 255-v))
        person = Image.merge("RGBA", (*rgb.split(), person.getchannel("A")))
        a = person.getchannel("A")
        # 底部溶隐（ torso 底边溶进黑暗，避免"切断漂浮"感）
        fade = brief.get("integrated_bottom_fade", 130)
        if fade > 0:
            fa = a.copy(); fd = ImageDraw.Draw(fa)
            for i in range(fade):
                fd.line([(0, ph-1-i), (pw, ph-1-i)], fill=int(255*(1-i/fade)**1.5))
            person.putalpha(fa)
        # 定位：脸部中心锚点（integration_face_x=脸中心目标x，face_top=脸顶目标y）
        fx = brief.get("integrated_face_x", 0.77)   # 脸中心在抠像宽度中的占比
        px = int(W * brief.get("integrated_face_target_x", 0.77) - fx * pw)
        fty = brief.get("integrated_face_top_frac", 0.01)
        py = int(H * brief.get("integrated_face_top", 0.22) - fty * ph)
        # 身后投影（剪影模糊右下偏移=落地感）
        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        sil = Image.new("RGBA", (pw, ph), (0,0,0,0))
        sil.paste((0,0,0,170), (0,0), a)
        sh.paste(sil, (px+26, py+30), sil)
        sh = sh.filter(ImageFilter.GaussianBlur(30))
        canvas.alpha_composite(sh)
        # 暖光勾边：alpha内缘染暖色（裂纹光在左→光从左来）
        from PIL import ImageChops
        er = a.filter(ImageFilter.MinFilter(11))
        band = ImageChops.subtract(a, er)
        rim = Image.new("RGBA", (pw, ph), (255,178,94,0))
        rim.putalpha(band.point(lambda v: int(v*brief.get("integrated_rim_alpha", 0.55))))
        person = Image.alpha_composite(person, rim)
        canvas.alpha_composite(person, (max(px,-pw), max(py,-ph)))
    elif brief.get("person_mode") == "column":
        # 柱式人物区（后期统一风格主模式，融入度最高）：带真实环境的整柱照片，
        # 边缘渐变羽化溶进海报底，统一压暗调色——柱子哥#76/#78式，无硬矩形边
        frame = Image.open(brief["person_frame"]).convert("RGB")
        cx, cy, cw, ch = brief["person_column"]  # 源帧裁区
        crop = frame.crop((cx, cy, cx+cw, cy+ch))
        ph = int(H * brief.get("column_height", 0.75))
        s = ph / ch
        pw = int(cw * s)
        crop = crop.resize((pw, ph), Image.LANCZOS)
        crop = ImageEnhance.Brightness(crop).enhance(brief.get("column_brightness", 0.80))
        crop = ImageEnhance.Color(crop).enhance(brief.get("column_saturation", 0.86))
        tint = Image.new("RGB", crop.size, tuple(brief.get("column_tint", [40,54,78])))
        crop = Image.composite(tint, crop, Image.new("L", crop.size, int(255*brief.get("column_tint_alpha", 0.26))))
        px = W - pw - int(W * brief.get("person_right_margin", 0.0))
        py = int(H * brief.get("column_top", 0.10))
        # 边缘羽化：只羽化真正落在画布内的边（被裁掉的边不用管）
        mask = Image.new("L", (pw, ph), 255)
        md = ImageDraw.Draw(mask)
        F = int(brief.get("column_feather", 90))
        for edge, visible in (("l", px > 0), ("r", px+pw < W), ("t", py > 0), ("b", py+ph < H)):
            if not visible: continue
            for i in range(F):
                a = int(255 * i / F)
                if edge=="l": md.line([(i,0),(i,ph)], fill=a)
                elif edge=="r": md.line([(pw-1-i,0),(pw-1-i,ph)], fill=a)
                elif edge=="t": md.line([(0,i),(pw,i)], fill=a)
                else: md.line([(0,ph-1-i),(pw,ph-1-i)], fill=a)
        mask = mask.filter(ImageFilter.GaussianBlur(10))
        pl = crop.convert("RGBA"); pl.putalpha(mask)
        canvas.alpha_composite(pl, (max(px,-pw), max(py,-ph)))
    elif brief.get("person_mode") == "block_tr":
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

    # 前景粒子（人物前面，深度三明治）
    if atmo:
        for grp in atmo.get("front_person", []):
            particles(canvas, grp["n"], grp["box"], tuple(grp["color"]), seed=grp.get("seed",11))

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
    dt.text((W/2-lw/2, lead_y), t["lead"], font=f_lead, fill=(255,255,255,255),
            stroke_width=t.get("lead_stroke", 3), stroke_fill=(18,26,40,255))

    # kicker（特大语义色+描边）
    f_kick = _font(t.get("kicker_size", 225))
    kw = text_width(dt, t["kicker"], f_kick)
    kick_y = t.get("kicker_y", 1275)
    col = COLORS.get(t.get("kicker_color","gold"), GOLD)
    dts.text((W/2-kw/2+10, kick_y+10), t["kicker"], font=f_kick, fill=(0,0,0,235))
    dt.text((W/2-kw/2, kick_y), t["kicker"], font=f_kick, fill=col,
            stroke_width=t.get("kicker_stroke", 8), stroke_fill=(24,12,12,255))

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
