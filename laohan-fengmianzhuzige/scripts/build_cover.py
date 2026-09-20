#!/usr/bin/env python3
"""laohan-fengmianzhuzige v6.0 三层合成封面管线（3:4 + Remotion文字层）
用法: ~/.venvs/cover/bin/python build_cover.py --brief brief.json --out cover.jpg [--text-engine remotion|pil|auto]
v6 变更：画幅1080x1440(3:4,对齐柱子哥真实封面原生画幅)；env_photo源素材亮场预检(warn/strict)；
文字层默认走Remotion静帧(animation-method/runtime/cover，材质级排版，与正片HUD同源组件)，PIL保留为兜底；
bg优先用真实素材(bg_image)，Seedream仅bg_prompt时生成。
"""
import argparse, json, os, subprocess, sys, urllib.request

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # skill根目录
FONT = os.path.join(SKILL_DIR, "assets", "fonts", "SourceHanSansCN-Heavy.otf")
RUNTIME = os.environ.get("LAOHAN_REMOTION_RUNTIME",
    "/Users/hanzhmacbookair/Documents/laohanAI视频创作/animation-method/runtime")
W, H = 1080, 1440  # 3:4 原生画幅（covers_real 实证）
GOLD, RED, BLUE, GREEN = "#F5C518", "#E04545", "#3B82F6", "#22C55E"
COLORS = {"gold": GOLD, "red": RED, "blue": BLUE, "green": GREEN, "white": "#FFFFFF"}

def log(m): print(f"[build_cover] {m}", flush=True)

# ---------- 素材亮场预检（v6：env_photo源必须是暗场/单侧光，亮场平光压暗后=灰暗监控感） ----------
def preflight_light(img, strict: bool):
    small = img.resize((min(240, img.width), int(img.height * min(240, img.width) / img.width)))
    px = sorted(list(small.convert("L").getdata()))
    n = len(px)
    mean = sum(px) / n
    p5, p95 = px[int(n * 0.05)], px[int(n * 0.95)]
    rng = p95 - p5
    flat_bright = mean > 115 and rng < 110
    log(f"preflight light: mean={mean:.0f} p5={p5} p95={p95} range={rng} -> "
        f"{'FLAT_BRIGHT(预期灰暗监控感,建议暗场重拍)' if flat_bright else 'ok'}")
    if flat_bright and strict:
        sys.exit("[build_cover] strict_light: 亮场平光素材被拒绝（brief.strict_light=true）。"
                 "暗场/单侧光摆拍是env_photo路线的前提（融入六法实证）。")
    return flat_bright

# ---------- 层1: Seedream 背景板（兜底；优先bg_image真实素材） ----------
def gen_bg(prompt: str, out_path: str) -> str:
    if os.path.exists(out_path):
        log(f"bg plate cached: {out_path}"); return out_path
    key = subprocess.run(["zsh","-ic","echo -n $ARK_API_KEY"],capture_output=True,text=True).stdout.strip()
    if not key: sys.exit("ARK_API_KEY missing")
    body = {"model":"doubao-seedream-5-0-lite-260128","prompt":prompt,
            "size":"1152x1536","response_format":"url","watermark":False}
    open("/tmp/_seedream_req.json","w").write(json.dumps(body))
    r = subprocess.run(["curl","-s","-m","180","https://ark.cn-beijing.volces.com/api/v3/images/generations",
        "-H",f"Authorization: Bearer {key}","-H","Content-Type: application/json",
        "--data-binary","@/tmp/_seedream_req.json"],capture_output=True,text=True)
    d = json.loads(r.stdout)
    url = d["data"][0]["url"]
    urllib.request.urlretrieve(url, out_path)
    log(f"bg plate generated -> {out_path}")
    return out_path

# ---------- 层2: rembg 真人抠像（仅抠像类模式需要；env_photo不抠） ----------
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

# ---------- 层3a: PIL 文字（兜底引擎） ----------
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

def build(brief: dict, bg_path: str, cut_path: str, out_path: str, text_engine: str):
    from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
    # 画布 = 背景板
    bg = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
    canvas = bg.convert("RGBA")
    atmo = brief.get("atmosphere", {})
    if atmo:
        # 背景层粒子（人物后面）
        for grp in atmo.get("behind_person", []):
            particles(canvas, grp["n"], grp["box"], tuple(grp["color"]), seed=grp.get("seed",7))

    # 层2 真人
    if brief.get("person_mode") == "integrated":
        # 融入模式（历史保留；v5.1已否决为主路线，Jeffrey"贴纸感"判定）
        person = Image.open(cut_path).convert("RGBA")
        a0 = person.getchannel("A")
        a_clean = a0.point(lambda v: 0 if v < 120 else min(255, int((v - 120) * 255 / 80)))
        person.putalpha(a_clean)
        if brief.get("integrated_crop"):
            cx0, cy0, cw0, ch0 = brief["integrated_crop"]
            bx, by = brief.get("_cutout_origin", [0, 0])
            person = person.crop((max(0, cx0 - bx), max(0, cy0 - by),
                                  min(person.width, cx0 + cw0 - bx), min(person.height, cy0 + ch0 - by)))
        ph = int(H * brief.get("integrated_height", 0.535))
        s = ph / person.height
        pw = int(person.width * s)
        person = person.resize((pw, ph), Image.LANCZOS)
        rgb = person.convert("RGB")
        rgb = ImageEnhance.Brightness(rgb).enhance(brief.get("integrated_brightness", 0.84))
        rgb = ImageEnhance.Color(rgb).enhance(brief.get("integrated_saturation", 0.86))
        tint = Image.new("RGB", rgb.size, tuple(brief.get("integrated_tint", [40,54,78])))
        rgb = Image.composite(tint, rgb, Image.new("L", rgb.size, int(255*brief.get("integrated_tint_alpha", 0.22))))
        fb = brief.get("integrated_face_boost", 1.14)
        if fb and fb != 1.0:
            fcx = int(pw * brief.get("integrated_face_x", 0.394))
            fcy = int(ph * (brief.get("integrated_face_top_frac", 0.0085) + 0.17))
            fr = int(pw * 0.30)
            fmask = Image.new("L", rgb.size, 0)
            ImageDraw.Draw(fmask).ellipse([fcx-fr, fcy-fr, fcx+fr, fcy+fr], fill=255)
            fmask = fmask.filter(ImageFilter.GaussianBlur(int(fr*0.5)))
            rgb = Image.composite(ImageEnhance.Brightness(rgb).enhance(fb), rgb, fmask)
        dk_from = brief.get("integrated_darken_from", 0.55)
        dk_full = brief.get("integrated_darken_full", 0.85)
        dk_to = brief.get("integrated_darken_min", 0.08)
        dark = Image.new("L", rgb.size, 255)
        dd = ImageDraw.Draw(dark)
        span = max(1, ph * (dk_full - dk_from))
        for i in range(int(ph*dk_from), ph):
            g = min(1.0, (i - ph*dk_from) / span)
            dd.line([(0,i),(pw,i)], fill=int(255*(1 - g*(1-dk_to))))
        dark = dark.filter(ImageFilter.GaussianBlur(40))
        rgb = Image.composite(Image.new("RGB", rgb.size, (8,12,20)), rgb, dark.point(lambda v: 255-v))
        person = Image.merge("RGBA", (*rgb.split(), person.getchannel("A")))
        a = person.getchannel("A")
        fade = brief.get("integrated_bottom_fade", 130)
        if fade > 0:
            fa = a.copy(); fd = ImageDraw.Draw(fa)
            for i in range(fade):
                fd.line([(0, ph-1-i), (pw, ph-1-i)], fill=int(255*(1-i/fade)**1.5))
            person.putalpha(fa)
        fx = brief.get("integrated_face_x", 0.207)
        px = int(W * brief.get("integrated_face_target_x", 0.72) - fx * pw)
        fty = brief.get("integrated_face_top_frac", 0.075)
        py = int(H * brief.get("integrated_face_top", 0.14) - fty * ph)
        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        sil = Image.new("RGBA", (pw, ph), (0,0,0,0))
        sil.paste((0,0,0,170), (0,0), a)
        sh.paste(sil, (px+26, py+30), sil)
        sh = sh.filter(ImageFilter.GaussianBlur(30))
        canvas.alpha_composite(sh)
        from PIL import ImageChops
        er = a.filter(ImageFilter.MinFilter(11))
        band = ImageChops.subtract(a, er)
        rc = tuple(brief.get("integrated_rim_color", [255,178,94]))
        rim = Image.new("RGBA", (pw, ph), rc + (0,))
        rim.putalpha(band.point(lambda v: int(v*brief.get("integrated_rim_alpha", 0.40))))
        person = Image.alpha_composite(person, rim)
        a = person.getchannel("A").filter(ImageFilter.GaussianBlur(2))
        person.putalpha(a)
        x0, y0 = max(px, 0), max(py, 0)
        x1, y1 = min(px + pw, W), min(py + ph, H)
        canvas.alpha_composite(person.crop((x0 - px, y0 - py, x1 - px, y1 - py)), (x0, y0))
    elif brief.get("person_mode") == "env_photo":
        # 环境照片柱（v5.1定案唯一正解）：不抠像！裁"人+周围真实环境"整块矩形，
        # 压暗+冷调让环境变暗场，脸部径向提亮保持最亮焦点，径向alpha罩长距溶黑
        frame = Image.open(brief["person_frame"]).convert("RGB")
        cx, cy, cw, ch = brief["env_crop"]
        crop = frame.crop((cx, cy, cx+cw, cy+ch))
        preflight_light(crop, strict=brief.get("strict_light", False))
        ph = int(H * brief.get("env_height", 0.70))
        s = ph / ch
        pw = int(cw * s)
        crop = crop.resize((pw, ph), Image.LANCZOS)
        crop = ImageEnhance.Brightness(crop).enhance(brief.get("env_brightness", 0.50))
        crop = ImageEnhance.Color(crop).enhance(brief.get("env_saturation", 0.72))
        tint = Image.new("RGB", crop.size, tuple(brief.get("env_tint", [36,52,76])))
        crop = Image.composite(tint, crop, Image.new("L", crop.size, int(255*brief.get("env_tint_alpha", 0.32))))
        fb = brief.get("env_face_boost", 1.8)
        if fb and fb != 1.0:
            fcx = int(pw * brief.get("env_face_x", 0.441))
            fcy = int(ph * brief.get("env_face_y", 0.30))
            fr = int(pw * 0.26)
            fmask = Image.new("L", crop.size, 0)
            ImageDraw.Draw(fmask).ellipse([fcx-fr, fcy-fr, fcx+fr, fcy+fr], fill=255)
            fmask = fmask.filter(ImageFilter.GaussianBlur(int(fr*0.5)))
            crop = Image.composite(ImageEnhance.Brightness(crop).enhance(fb), crop, fmask)
        px = int(W * brief.get("env_face_target_x", 0.66) - brief.get("env_face_x", 0.45) * pw)
        py = int(H * brief.get("env_top", 0.10))
        mask = Image.new("L", (pw, ph), 0)
        md = ImageDraw.Draw(mask)
        mcx = int(pw * brief.get("env_face_x", 0.45))
        mcy = int(ph * brief.get("env_face_y", 0.38))
        rx = pw * brief.get("env_rad_x", 0.60)
        ry = ph * brief.get("env_rad_y", 0.88)
        steps = 44
        for i in range(steps):
            t = (i + 1) / steps                      # 0外圈→1中心
            k = brief.get("env_rad_spread", 1.65) - (brief.get("env_rad_spread", 1.65) - 1.0) * t
            av = int(255 * min(1.0, (t ** 1.5) * 1.35))
            md.ellipse([mcx-rx*k, mcy-ry*k, mcx+rx*k, mcy+ry*k], fill=av)
        mask = mask.filter(ImageFilter.GaussianBlur(55))
        layer = crop.convert("RGBA"); layer.putalpha(mask)
        scrim = Image.new("RGBA", (pw, ph), (0,0,0,0))
        sd = ImageDraw.Draw(scrim)
        SA = brief.get("env_scrim_alpha", 200)
        def hscrim(width_frac, edge):
            Wd = int(pw * width_frac)
            for i in range(Wd):
                av = int(SA * (1 - i / Wd))
                if edge == "l": sd.line([(i,0),(i,ph)], fill=(6,10,18,av))
                else: sd.line([(pw-1-i,0),(pw-1-i,ph)], fill=(6,10,18,av))
        def vscrim(width_frac, edge):
            Hd = int(ph * width_frac)
            for i in range(Hd):
                av = int(SA * (1 - i / Hd))
                if edge == "t": sd.line([(0,i),(pw,i)], fill=(6,10,18,av))
                else: sd.line([(0,ph-1-i),(pw,ph-1-i)], fill=(6,10,18,av))
        if px > 0: hscrim(brief.get("env_left_scrim", 0.32), "l")
        if px + pw < W: hscrim(brief.get("env_right_scrim", 0.0), "r")
        if py > 0: vscrim(brief.get("env_top_scrim", 0.30), "t")
        if py + ph < H: vscrim(brief.get("env_bottom_scrim", 0.30), "b")
        layer = Image.alpha_composite(layer, scrim)
        ss = brief.get("env_seam_shadow", 300)
        if ss:
            band = Image.new("RGBA", (W, H), (0,0,0,0))
            bd = ImageDraw.Draw(band)
            if py > 0:  # 顶边可见→海报侧全宽纵向渐变压黑
                TH = int(ss * 1.2)
                for i in range(min(TH, H)):
                    bd.line([(0, i), (W, i)], fill=(5, 9, 16, int(205 * (1 - i / TH) ** 1.4)))
            if px > 0:  # 左边可见→竖向渐变带
                peak = px + int(ss * 0.3)
                half = ss // 2
                for i in range(-half, half):
                    x = peak + i
                    if 0 <= x < W:
                        bd.line([(x, 0), (x, H)], fill=(5, 9, 16, int(170 * (1 - abs(i) / half))))
            band = band.filter(ImageFilter.GaussianBlur(55))
            canvas = Image.alpha_composite(canvas, band)
        x0, y0 = max(px, 0), max(py, 0)
        x1, y1 = min(px + pw, W), min(py + ph, H)
        canvas.alpha_composite(layer.crop((x0 - px, y0 - py, x1 - px, y1 - py)), (x0, y0))
    elif brief.get("person_mode") == "column":
        frame = Image.open(brief["person_frame"]).convert("RGB")
        cx, cy, cw, ch = brief["person_column"]
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
        from PIL import ImageDraw as _ID
        frame = Image.open(brief["person_frame"]).convert("RGB")
        bx, by, bw, bh = brief["person_block"]
        block = frame.crop((bx, by, bx+bw, by+bh))
        tw = int(W * brief.get("person_block_width", 0.63))
        th = int(tw * bh / bw)
        block = block.resize((tw, th), Image.LANCZOS)
        block = ImageEnhance.Brightness(block).enhance(0.88)
        block = ImageEnhance.Color(block).enhance(0.90)
        mask = Image.new("L", (tw, th), 0)
        _ID.Draw(mask).rounded_rectangle([0, 0, tw, th], radius=22, fill=255)
        px = W - tw - int(W * brief.get("person_right_margin", 0.04))
        py = int(H * brief.get("person_top", 0.10))
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
        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        ds = ImageDraw.Draw(sh)
        ds.ellipse([px+30, py+person.height-60, px+person.width-30, py+person.height+50], fill=(0,0,0,150))
        sh = sh.filter(ImageFilter.GaussianBlur(38))
        canvas = Image.alpha_composite(canvas, sh)
        canvas = canvas.convert("RGBA")
        canvas.alpha_composite(person, (max(0, px), max(0, py)))

    # 层4 全局统一调色（合成后再grade——人物与环境变"一张照片"，对齐原版冷调暗调）
    fg = brief.get("final_grade")
    if fg:
        rgb = canvas.convert("RGB")
        rgb = ImageEnhance.Brightness(rgb).enhance(fg.get("brightness", 0.96))
        rgb = ImageEnhance.Contrast(rgb).enhance(fg.get("contrast", 1.06))
        rgb = ImageEnhance.Color(rgb).enhance(fg.get("color", 0.92))
        if fg.get("black_point"):
            bp = fg["black_point"]
            rgb = rgb.point(lambda v: max(0, int((v - bp) * 255 / (255 - bp))))
        if fg.get("tint"):
            ti = Image.new("RGB", rgb.size, tuple(fg["tint"]))
            rgb = Image.composite(ti, rgb, Image.new("L", rgb.size, int(255*fg.get("tint_alpha", 0.16))))
        canvas = rgb.convert("RGBA")
        if fg.get("vignette_alpha"):
            vg = Image.new("L", (W, H), 0)
            ImageDraw.Draw(vg).ellipse([-W*0.25, -H*0.2, W*1.25, H*1.12], fill=255)
            vg = vg.filter(ImageFilter.GaussianBlur(170))
            darkv = Image.new("RGBA", (W, H), (5,8,14,255))
            darkv.putalpha(vg.point(lambda v: int((255-v)*fg["vignette_alpha"])))
            canvas = Image.alpha_composite(canvas, darkv)

    # 前景粒子（人物前面，深度三明治）
    if atmo:
        for grp in atmo.get("front_person", []):
            particles(canvas, grp["n"], grp["box"], tuple(grp["color"]), seed=grp.get("seed",11))

    # 文字区压暗渐变（下部 scrim，保证字可读）
    scrim = Image.new("RGBA", (W, H), (0,0,0,0))
    dsc = ImageDraw.Draw(scrim)
    for i in range(int(H*0.46)):
        a = int(130 * (i / (H*0.46))**1.5)
        dsc.line([(0, H-int(H*0.46)+i), (W, H-int(H*0.46)+i)], fill=(0,0,0,a))
    canvas = Image.alpha_composite(canvas, scrim)

    # ---------- 层3 出口：remotion 静帧（默认） / PIL 兜底 ----------
    if text_engine == "remotion":
        pre = os.path.join(os.path.dirname(os.path.abspath(out_path)), "pre_text.png")
        canvas.convert("RGB").save(pre)
        log(f"pre-text composite -> {pre}")
        render_text_remotion(brief, pre, out_path)
        return

    # PIL 文字层（兜底；坐标按1440高重排）
    t = brief["title_group"]
    txt_shadow = Image.new("RGBA", (W, H), (0,0,0,0))
    dts = ImageDraw.Draw(txt_shadow)
    txt = Image.new("RGBA", (W, H), (0,0,0,0))
    dt = ImageDraw.Draw(txt)

    f_eb = _font(t.get("eyebrow_size", 36))
    draw_tracked_rgba(txt_shadow, (66, 84), t["eyebrow"], f_eb, (0,0,0,200), tracking=12)
    draw_tracked_rgba(txt, (62, 80), t["eyebrow"], f_eb, (255,255,255,215), tracking=12)
    dt.rectangle([42, 84, 50, 84+f_eb.size+8], fill=(255,255,255,215))
    if t.get("chip_cn"):
        f_c1 = _font(t.get("chip_size", 40))
        f_c2 = _font(t.get("chip_size2", 22))
        cw = max(text_width(dt, t["chip_cn"], f_c1), text_width(dt, t["chip_en"], f_c2)) + 52
        ch = f_c1.size + f_c2.size + 40
        cx0, cy0 = 42, 84 + f_eb.size + 26
        dt.rounded_rectangle([cx0, cy0, cx0+cw, cy0+ch], radius=14,
                             outline=(255,255,255,150), width=3, fill=(10,14,22,160))
        dt.text((cx0+26, cy0+14), t["chip_cn"], font=f_c1, fill=(255,255,255,235))
        dt.text((cx0+26, cy0+14+f_c1.size+4), t["chip_en"], font=f_c2,
                fill=(255,255,255,170))

    f_lead = _font(t.get("lead_size", 84))
    align = t.get("align", "left")
    LX = t.get("left_x", 64) if align == "left" else None
    def ax(w_): return (W - w_) // 2 if align == "center" else LX
    lw = text_width(dt, t["lead"], f_lead)
    lead_y = t.get("lead_y", 812)
    dts.text((ax(lw)+6, lead_y+6), t["lead"], font=f_lead, fill=(0,0,0,230))
    dt.text((ax(lw), lead_y), t["lead"], font=f_lead, fill=(255,255,255,255),
            stroke_width=t.get("lead_stroke", 3), stroke_fill=(18,26,40,255))

    f_kick = _font(t.get("kicker_size", 240))
    kw = text_width(dt, t["kicker"], f_kick)
    kick_y = t.get("kicker_y", 930)
    col = COLORS.get(t.get("kicker_color","gold"), GOLD)
    dts.text((ax(kw)+10, kick_y+10), t["kicker"], font=f_kick, fill=(0,0,0,235))
    dt.text((ax(kw), kick_y), t["kicker"], font=f_kick, fill=col,
            stroke_width=t.get("kicker_stroke", 8), stroke_fill=(24,12,12,255))

    if t.get("bar"):
        f_bar = _font(t.get("bar_size", 52))
        bw = text_width(dt, t["bar"], f_bar)
        pad_x, pad_y = 32, 14
        bar_y = t.get("bar_y", 1268)
        dt.rounded_rectangle([ax(bw)-pad_x, bar_y, ax(bw)+bw+pad_x, bar_y+f_bar.size+pad_y*2],
                             radius=10, fill=(245,197,24,255))
        dt.text((ax(bw), bar_y+pad_y-2), t["bar"], font=f_bar, fill=(20,16,4,255))

    f_ft = _font(t.get("footer_size", 26))
    draw_tracked_rgba(txt_shadow, (0, 1392), t["footer"], f_ft, (0,0,0,160), tracking=9, center_x=W/2)
    draw_tracked_rgba(txt, (0, 1388), t["footer"], f_ft, (255,255,255,135), tracking=9, center_x=W/2)

    txt_shadow = txt_shadow.filter(ImageFilter.GaussianBlur(6))
    canvas = Image.alpha_composite(canvas, txt_shadow)
    canvas = Image.alpha_composite(canvas, txt)

    canvas.convert("RGB").save(out_path, quality=92)
    log(f"cover -> {out_path}")

# ---------- 层3b: Remotion 静帧文字层（材质级，与正片HUD同源组件） ----------
def render_text_remotion(brief: dict, pre_text_png: str, out_path: str):
    cover_dir = os.path.join(RUNTIME, "cover")
    pub = os.path.join(cover_dir, "public")
    if not os.path.isdir(pub): sys.exit(f"runtime cover dir missing: {cover_dir}（检查 laohan-remotion-runtime）")
    import shutil
    shutil.copyfile(pre_text_png, os.path.join(pub, "pre_text.png"))
    pub_font = os.path.join(pub, "SourceHanSansCN-Heavy.otf")  # gitignore的本地缓存，缺失自愈
    if not os.path.exists(pub_font):
        shutil.copyfile(FONT, pub_font)
    t = brief.get("title_group", {})
    r = brief.get("remotion", {})
    props = {
        "eyebrow_en": r.get("eyebrow_en", t.get("eyebrow", "")),
        "eyebrow_cn": r.get("eyebrow_cn", ""),
        "chip": {"cn": t.get("chip_cn", "老韩AI"), "en": t.get("chip_en", "LAOHAN.AI")},
        "lead": t.get("lead", ""), "lead_size": r.get("lead_size", 82),
        "kicker": {"text": t.get("kicker", ""), "tone": r.get("kicker_tone", t.get("kicker_color", "gold")),
                   "size": r.get("kicker_size", 246)},
        "bar": t.get("bar"), "footer": t.get("footer", ""),
        "stamp": r.get("stamp"), "text_top": r.get("text_top", 812),
    }
    props_json = json.dumps(props, ensure_ascii=False)
    cli = os.path.join(RUNTIME, "node_modules", ".bin", "remotion")
    if not os.path.exists(cli): sys.exit(f"remotion cli missing: {cli}")
    still_png = os.path.abspath(out_path.rsplit(".", 1)[0] + "_still.png")
    cmd = [cli, "still", os.path.join(cover_dir, "index.tsx"), "LaohanCover", still_png,
           "--frame=120", f"--public-dir={pub}", f"--props={props_json}", "--log=error", "--overwrite"]
    log("remotion still: LaohanCover 1080x1440 @frame120")
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=RUNTIME)  # cwd=runtime复用其chrome缓存，避免重新下载
    if res.returncode != 0:
        sys.exit(f"remotion still failed:\n{res.stdout}\n{res.stderr}")
    from PIL import Image
    Image.open(still_png).convert("RGB").save(out_path, quality=92)
    log(f"cover -> {out_path}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brief", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workdir", default=None)
    ap.add_argument("--text-engine", default="auto", choices=["auto", "remotion", "pil"])
    a = ap.parse_args()
    brief = json.load(open(a.brief))
    wd = a.workdir or os.path.dirname(os.path.abspath(a.out))
    os.makedirs(wd, exist_ok=True)
    engine = a.text_engine
    if engine == "auto":
        engine = "remotion" if os.path.exists(os.path.join(RUNTIME, "cover", "index.tsx")) else "pil"
    bg_path = os.path.join(wd, "bg_plate.png")
    if brief.get("bg_prompt"):
        gen_bg(brief["bg_prompt"], bg_path)
    else:
        bg_path = brief["bg_image"]
    # env_photo/column/block_tr 不需要抠像；抠像类模式才跑 rembg
    cut_path = os.path.join(wd, "person_cutout.png")
    if brief.get("person_mode") in (None, "", "integrated"):
        cutout(brief["person_frame"], cut_path)
    build(brief, bg_path, cut_path, a.out, engine)

if __name__ == "__main__":
    main()
