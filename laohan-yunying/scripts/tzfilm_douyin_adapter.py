#!/usr/bin/env python3
"""TzFilm-Douyin-Tool -> episode 数据 adapter（独立验收中）。

把 TzFilm 抓的 SQLite 数据 / 评论 JSON 导入 episode：
- snapshot: 读 video_stats -> 13-数据/snapshots.jsonl（追加，不覆盖 manual）
- comments: 读 unreplied-comments.json -> 14-评论/comments.jsonl

不运行 TzFilm 的 launchd/Telegram/预测/发布。source 标 'tzfilm'（验收期标识，
SKILL.md 枚举验收后更新加 tzfilm）。

用法:
  python3 tzfilm_douyin_adapter.py snapshot --db <douyin_stats.db> --title <标题> --episode episodes/<slug> --aweme-id <id>
  python3 tzfilm_douyin_adapter.py comments --input <unreplied-comments.json> --episode episodes/<slug> --aweme-id <id>
"""
import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime


def cmd_snapshot(args):
    db = os.path.expanduser(args.db)
    if not os.path.exists(db):
        print(f"❌ TzFilm db 不存在: {db}", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(db)
    row = conn.execute(
        "SELECT title, timestamp, plays, likes, comments, shares, favorites "
        "FROM video_stats WHERE title LIKE ? ORDER BY timestamp DESC LIMIT 1",
        (f"%{args.title}%",),
    ).fetchone()
    conn.close()
    if not row:
        print(f"❌ TzFilm db 未找到标题含「{args.title}」的视频", file=sys.stderr)
        sys.exit(1)
    title, ts, plays, likes, comments, shares, favorites = row
    snap_dir = os.path.join(args.episode, "13-数据")
    os.makedirs(snap_dir, exist_ok=True)
    snap_file = os.path.join(snap_dir, "snapshots.jsonl")
    record = {
        "platform": "douyin",
        "aweme_id": args.aweme_id,
        "observed_at": ts,
        "source": "tzfilm",
        "metrics": {
            "plays": plays or 0,
            "likes": likes or 0,
            "comments": comments or 0,
            "shares": shares or 0,
            "favorites": favorites or 0,
        },
        "_tzfilm_title": title,
    }
    with open(snap_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"✅ snapshot 追加到 {snap_file}")
    print(f"   视频: {title[:40]}")
    print(f"   observed_at={ts} plays={plays} likes={likes} comments={comments} shares={shares} favorites={favorites}")


def cmd_comments(args):
    inp = os.path.expanduser(args.input)
    if not os.path.exists(inp):
        print(f"❌ 评论 JSON 不存在: {inp}", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(inp, encoding="utf-8"))
    work = data.get("selectedWork", {})
    work_title = work.get("title", "")
    comments = data.get("comments", [])
    comm_dir = os.path.join(args.episode, "14-评论")
    os.makedirs(comm_dir, exist_ok=True)
    comm_file = os.path.join(comm_dir, "comments.jsonl")
    captured_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00")
    count = 0
    with open(comm_file, "a", encoding="utf-8") as f:
        for c in comments:
            record = {
                "platform": "douyin",
                "aweme_id": args.aweme_id,
                "captured_at": captured_at,
                "source": "tzfilm",
                "text": c.get("commentText", ""),
                "likes": 0,
                "_tzfilm_username": c.get("username", ""),
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
    print(f"✅ comments 追加 {count} 条到 {comm_file}")
    print(f"   作品: {work_title[:40]}")


def main():
    p = argparse.ArgumentParser(description="TzFilm -> episode 数据 adapter（独立验收中）")
    sub = p.add_subparsers(dest="cmd", required=True)
    ps = sub.add_parser("snapshot")
    ps.add_argument("--db", required=True)
    ps.add_argument("--title", required=True)
    ps.add_argument("--episode", required=True)
    ps.add_argument("--aweme-id", required=True)
    ps.set_defaults(func=cmd_snapshot)
    pc = sub.add_parser("comments")
    pc.add_argument("--input", required=True)
    pc.add_argument("--episode", required=True)
    pc.add_argument("--aweme-id", required=True)
    pc.set_defaults(func=cmd_comments)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
