#!/usr/bin/env python3
"""laohan-pingfen 机械计算器：baseline 分位 / 预测分合成 / 实际分 / 校准 / 回测。

语义打分（rubric 维度分）由执行模型按 references/scoring-rubric.md 给出；
本脚本只做确定性合成、分位、等级、校准对比与回测，保证可复算。
纯 stdlib；缺输入/非法值/越界权重一律非 0 退出。
"""
import argparse
import json
import math
import sys
from pathlib import Path

GRADE_ORDER = ["D", "C", "B", "A", "S"]  # 低→高

DIMENSIONS = {  # v1.0 权重（与 references/scoring-rubric.md 同源；总权重=1）
    "T1": 0.12, "T2": 0.10, "T3": 0.10, "T4": 0.08,
    "F1": 0.13, "F2": 0.12, "F3": 0.10,
    "R1": 0.08, "R2": 0.07, "Q1": 0.10,
}

ACTUAL_WEIGHTS = {"plays": 0.45, "share_k": 0.25, "comment_k": 0.15, "bounce_inv": 0.10, "retain_k": 0.05}

SCORE_GRADE = [(80, "S"), (65, "A"), (50, "B"), (35, "C"), (0, "D")]


def die(msg, code=2):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def load_json(path):
    p = Path(path)
    if not p.is_file():
        die(f"file not found: {path}")
    try:
        return json.loads(p.read_text("utf-8"))
    except json.JSONDecodeError as e:
        die(f"invalid json {path}: {e}")


def score_to_grade(total):
    for th, g in SCORE_GRADE:
        if total >= th:
            return g
    return "D"


def grade_gap(pred, actual):
    """预测档-实际档差：正=高估。档位非法即退出。"""
    for g in (pred, actual):
        if g not in GRADE_ORDER:
            die(f"invalid grade: {g}")
    return GRADE_ORDER.index(pred) - GRADE_ORDER.index(actual)


# ---------- baseline ----------

def extract_rows(snapshot):
    rows = snapshot.get("rows")
    if not rows:
        die("snapshot has no rows")
    out = []
    for r in rows:
        m = r.get("metrics") or {}
        plays = (m.get("plays") or {}).get("value")
        if not isinstance(plays, (int, float)) or plays <= 0:
            die(f"row missing plays: {str(r.get('title_first_line'))[:40]}")
        def val(k):
            v = (m.get(k) or {}).get("value")
            return v if isinstance(v, (int, float)) else 0
        k_plays = plays / 1000.0
        out.append({
            "published_at": r.get("published_at_cst"),
            "title": (r.get("title_first_line") or "")[:30],
            "plays": plays,
            "plays_approximate": bool((m.get("plays") or {}).get("approximate")),
            "likes": val("likes"), "comments": val("comments"), "shares": val("shares"),
            "favorites": val("favorites"), "followers_gained": val("followers_gained"),
            "completion_rate": m.get("completion_rate_percent") or 0,
            "bounce_2s": m.get("bounce_2s_rate_percent") or 0,
            "share_k": round(val("shares") / k_plays, 2) if plays else 0,
            "comment_k": round(val("comments") / k_plays, 3) if plays else 0,
            "like_fav_follower_k": round((val("likes") + val("favorites") + val("followers_gained")) / k_plays, 1) if plays else 0,
        })
    return out


def pct_rank(sorted_vals, x):
    """秩分位 0-1（=严格小于 x 的比例 + 相等半权）。"""
    n = len(sorted_vals)
    below = sum(1 for v in sorted_vals if v < x)
    equal = sum(1 for v in sorted_vals if v == x)
    return round((below + 0.5 * equal) / n, 3)


def cmd_baseline(args):
    rows = extract_rows(load_json(args.snapshot))
    if len(rows) < 8:
        print(f"WARN: N={len(rows)} < 8，分位降级为秩参考", file=sys.stderr)
    plays = sorted(r["plays"] for r in rows)
    med = plays[len(plays) // 2] if len(plays) % 2 else (plays[len(plays)//2 - 1] + plays[len(plays)//2]) / 2
    base = {
        "generated_from": str(args.snapshot),
        "observed_at": load_json(args.snapshot).get("observed_at"),
        "n_works": len(rows),
        "median_plays": med,
        "plays_quantiles": {f"P{p}": sorted(r["plays"] for r in rows)[max(0, int(len(rows)*p/100)-1 if p<100 else len(rows)-1)] for p in (25, 50, 75, 90)},
        "works": sorted(rows, key=lambda r: r["plays"], reverse=True),
        "note": "分位含全部在架作品（窗口口径混合：48h/7d/CONTEXT，见各期 actuals 的窗口标注）",
    }
    Path(args.out).write_text(json.dumps(base, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"baseline: N={len(rows)} median={med:.0f} P90={base['plays_quantiles']['P90']} -> {args.out}")


# ---------- predict ----------

def cmd_score(args):
    dims = load_json(args.dims)
    unknown = set(dims) - set(DIMENSIONS)
    if unknown:
        die(f"unknown dimensions: {sorted(unknown)}; valid={sorted(DIMENSIONS)}")
    missing = set(DIMENSIONS) - set(dims)
    if missing and not args.allow_missing:
        die(f"missing dimensions: {sorted(missing)} (use --allow-missing to record partial)")
    total_w = sum(DIMENSIONS.values())
    if abs(total_w - 1.0) > 1e-6:
        die(f"rubric weights sum {total_w} != 1.0")
    for k, v in dims.items():
        if not (0 <= v <= 5):
            die(f"dim {k} score {v} out of [0,5]")
    total = round(sum(dims.get(k, 0) / 5 * w for k, w in DIMENSIONS.items()) * 100, 1)
    report = {
        "episode": args.episode,
        "rubric_version": args.rubric_version,
        "created_at": args.created_at or "UNSET",
        "mode": "PREDICT",
        "dimension_scores": dims,
        "weights": {k: w for k, w in DIMENSIONS.items() if k in dims},
        "total": total,
        "grade": score_to_grade(total),
        "immutable": True,
        "notes": args.notes or "",
    }
    out = Path(args.out) if args.out else Path(f"predictions/{args.episode}.json")
    if out.exists() and not args.stdout_only:
        die(f"prediction exists, refuse to overwrite (immutable): {out}")
    if args.stdout_only:
        print(json.dumps(report, ensure_ascii=False, indent=1))
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(f"prediction {args.episode}: total={total} grade={report['grade']} -> {out}")


# ---------- actual ----------

def cmd_actual(args):
    data = load_json(args.data)
    base = load_json(args.baseline)
    required = ["episode", "window", "plays"]
    for k in required:
        if k not in data:
            die(f"actual data missing field: {k}")
    if data["window"] in ("13h", "first_read"):
        die("13h 内读数无判定效力（EP08 判例），拒绝出正式等级")
    works = base.get("works") or die("baseline has no works")
    plays_vals = sorted(w["plays"] for w in works)
    for arr, key in ((works, "share_k"), (works, "comment_k")):
        _ = key
    share_vals = sorted(w.get("share_k", 0) for w in works)
    comm_vals = sorted(w.get("comment_k", 0) for w in works)
    bounce_vals = sorted(w.get("bounce_2s", 0) for w in works)
    retain_vals = sorted(w.get("like_fav_follower_k", 0) for w in works)
    med = base["median_plays"]

    p_plays = pct_rank(plays_vals, data["plays"])
    p_share = pct_rank(share_vals, data.get("share_k", 0))
    p_comm = pct_rank(comm_vals, data.get("comment_k", 0))
    p_bounce_inv = 1 - pct_rank(bounce_vals, data.get("bounce_2s", 0))  # 跳出越低越好
    p_retain = pct_rank(retain_vals, data.get("like_fav_follower_k", 0))
    total = round(100 * sum(ACTUAL_WEIGHTS[k] * v for k, v in
                  {"plays": p_plays, "share_k": p_share, "comment_k": p_comm,
                   "bounce_inv": p_bounce_inv, "retain_k": p_retain}.items()), 1)

    # 等级：播放主导 + 结构证据
    mult = data["plays"] / med if med else 0
    if mult >= 3 or p_plays >= 0.9:
        grade = "S"
    elif p_plays >= 0.75:
        grade = "A"
    elif p_plays >= 0.5:
        grade = "B"
    elif p_plays >= 0.25:
        grade = "C"
    else:
        grade = "D"

    layers = {
        "入口(2s跳出)": ("强" if p_bounce_inv >= 0.7 else "弱" if p_bounce_inv <= 0.3 else "中"),
        "裂变(千播转)": ("强" if p_share >= 0.7 else "弱" if p_share <= 0.3 else "中"),
        "互动(千播评)": ("强" if p_comm >= 0.7 else "弱" if p_comm <= 0.3 else "中"),
    }
    flags = []
    if grade in ("S", "A") and data.get("completion_rate") is not None:
        comp_rank = pct_rank(sorted(w.get("completion_rate", 0) for w in works), data["completion_rate"])
        if comp_rank <= 0.3:
            flags.append("结构性险胜候选：播放高但完播分位垫底（EP06 转发飞轮模式）")
    if p_bounce_inv >= 0.7 and p_plays <= 0.4:
        flags.append("入口强无裂变：跳出优但播放低（EP03R 模式，第二门断）")

    report = {
        "episode": data["episode"], "mode": "ACTUAL", "window": data["window"],
        "source": data.get("source", "UNSET"),
        "plays": data["plays"], "vs_median": round(mult, 2),
        "metrics": {k: data.get(k) for k in ("share_k", "comment_k", "bounce_2s", "completion_rate", "like_fav_follower_k")},
        "percentiles": {"plays": p_plays, "share_k": p_share, "comment_k": p_comm,
                        "bounce_inv": round(p_bounce_inv, 3), "retain": p_retain},
        "actual_score": total, "grade": grade,
        "layer_diagnosis": layers, "flags": flags,
        "baseline_n": base.get("n_works"), "immutable": False,
    }
    out = Path(args.out) if args.out else Path(f"actuals/{data['episode']}.json")
    if args.stdout_only:
        print(json.dumps(report, ensure_ascii=False, indent=1))
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(f"actual {data['episode']}: score={total} grade={grade} ({data['window']}) -> {out}")


# ---------- calibrate / backtest ----------

def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j+1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                r[order[k]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    n = len(xs)
    mx, my = sum(rx)/n, sum(ry)/n
    num = sum((a-mx)*(b-my) for a, b in zip(rx, ry))
    den = math.sqrt(sum((a-mx)**2 for a in rx) * sum((b-my)**2 for b in ry))
    return round(num/den, 3) if den else 0.0


def cmd_calibrate(args):
    pdir, adir = Path(args.predictions), Path(args.actuals)
    pairs = []
    for pf in sorted(pdir.glob("*.json")):
        af = adir / pf.name
        if not af.is_file():
            continue
        pred, act = load_json(pf), load_json(af)
        gap = grade_gap(pred["grade"], act["grade"])
        verdict = "CALIBRATED" if gap == 0 else ("OVERESTIMATED" if gap > 0 else "UNDERESTIMATED")
        pairs.append({"episode": pf.stem, "pred_total": pred["total"], "pred_grade": pred["grade"],
                      "actual_grade": act["grade"], "gap": gap, "verdict": verdict,
                      "attribution_required": abs(gap) >= 2})
    if not pairs:
        die("no prediction+actual pairs found")
    n_cal = sum(1 for p in pairs if p["verdict"] == "CALIBRATED")
    rho = spearman([p["pred_total"] for p in pairs],
                   [math.log(load_json(Path(args.actuals)/f"{p['episode']}.json")["plays"]) for p in pairs])
    out = {"generated_at": args.created_at or "UNSET", "pairs": pairs,
           "calibrated_rate": round(n_cal/len(pairs), 3), "spearman_pred_vs_logplays": rho,
           "attribution_backlog": [p["episode"] for p in pairs if p["attribution_required"]]}
    print(json.dumps(out, ensure_ascii=False, indent=1))


def cmd_backtest(args):
    """输入 [{episode, total, log_plays}]，输出区分度。top 判定按档位+容差（并列同档不算退位）。"""
    rows = load_json(args.data)
    if len(rows) < 4:
        die("backtest needs >=4 rows")
    for r in rows:
        for k in ("episode", "total", "log_plays"):
            if k not in r:
                die(f"backtest row missing {k}: {r}")
    rho = spearman([r["total"] for r in rows], [r["log_plays"] for r in rows])
    best = max(rows, key=lambda r: r["total"])
    worst = min(rows, key=lambda r: r["total"])
    expect_top_total = next((r["total"] for r in rows if r["episode"] == args.expect_top), None)
    expect_bot_total = next((r["total"] for r in rows if r["episode"] == args.expect_bottom), None)
    if expect_top_total is None or expect_bot_total is None:
        die("expect-top/expect-bottom episode not in backtest rows")
    top_ok = (best["episode"] == args.expect_top
              or (best["total"] - expect_top_total) <= args.tolerance
              and score_to_grade(best["total"]) == score_to_grade(expect_top_total))
    bottom_ok = (worst["episode"] == args.expect_bottom
                 or (expect_bot_total - worst["total"]) <= args.tolerance
                 and score_to_grade(worst["total"]) == score_to_grade(expect_bot_total))
    print(json.dumps({"spearman": rho, "top": best["episode"], "bottom": worst["episode"],
                      "pass": rho > 0 and top_ok and bottom_ok, "tolerance": args.tolerance},
                     ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser(description="laohan-pingfen deterministic scorer")
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("baseline"); b.add_argument("--snapshot", required=True); b.add_argument("--out", required=True); b.set_defaults(fn=cmd_baseline)
    s = sub.add_parser("score"); s.add_argument("--episode", required=True); s.add_argument("--dims", required=True)
    s.add_argument("--rubric-version", default="v1.0"); s.add_argument("--created-at"); s.add_argument("--notes")
    s.add_argument("--out"); s.add_argument("--allow-missing", action="store_true"); s.add_argument("--stdout-only", action="store_true"); s.set_defaults(fn=cmd_score)
    a = sub.add_parser("actual"); a.add_argument("--data", required=True); a.add_argument("--baseline", required=True)
    a.add_argument("--out"); a.add_argument("--stdout-only", action="store_true"); a.set_defaults(fn=cmd_actual)
    c = sub.add_parser("calibrate"); c.add_argument("--predictions", default="predictions"); c.add_argument("--actuals", default="actuals"); c.add_argument("--created-at"); c.set_defaults(fn=cmd_calibrate)
    t = sub.add_parser("backtest"); t.add_argument("--data", required=True); t.add_argument("--expect-top", required=True); t.add_argument("--expect-bottom", required=True); t.add_argument("--tolerance", type=float, default=2.0); t.set_defaults(fn=cmd_backtest)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
