#!/usr/bin/env python3
"""抖音关键词搜索 - DrissionPage
用法: python search.py [关键词] [--min N] [--scroll N]
  --min:    最少采集条数(默认30)
  --scroll: 最大滚动次数(默认10)
"""

import argparse
import json
import os
import socket
import time
from datetime import datetime
from DrissionPage import Chromium, ChromiumOptions


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("keyword", nargs="?", default="claude code教程")
    p.add_argument("--min", type=int, default=30, help="最少采集条数(默认30)")
    p.add_argument("--scroll", type=int, default=10, help="最大滚动次数(默认10)")
    return p.parse_args()


def main():
    args = parse_args()
    keyword = args.keyword
    url = f"https://www.douyin.com/search/{keyword}?type=video"
    print(f"搜索: {keyword} | 目标≥{args.min}条 | 最多滚动{args.scroll}次")

    # 启动浏览器：独立持久化 profile（不复用日常 Chrome 的 user-data-dir，避免占用冲突）
    profile_dir = os.path.expanduser(os.environ.get("DOUYIN_PROFILE", "~/.douyin-search-profile"))
    os.makedirs(profile_dir, exist_ok=True)
    co = ChromiumOptions()
    co.set_browser_path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    co.set_user_data_path(profile_dir)
    configured_port = int(os.environ.get("DOUYIN_DEBUG_PORT", "0"))
    if configured_port:
        debug_port = configured_port
    else:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.bind(("127.0.0.1", 0))
            debug_port = probe.getsockname()[1]
    co.set_local_port(debug_port)
    co.set_argument("--no-first-run")
    co.set_argument("--no-default-browser-check")
    browser = Chromium(co)

    # 注入 Profile 5 抽取的抖音登录态 cookie（复用日常 Chrome 登录，免扫码）
    cookies_file = os.path.expanduser(os.environ.get("DOUYIN_COOKIES", "~/.douyin-search-profile/douyin_cookies.json"))
    if os.path.exists(cookies_file):
        with open(cookies_file, "r", encoding="utf-8") as f:
            cookies = json.load(f)
        # 清理 None 值（带 None 的字段 DrissionPage 会拒收）
        cookies = [{k: v for k, v in c.items() if v is not None} for c in cookies]
        tab0 = browser.latest_tab
        tab0.get("https://www.douyin.com/")  # 先到目标域再注 cookie
        time.sleep(3)
        tab0.set.cookies(cookies)  # DrissionPage 4.x：传整个 list
        time.sleep(1)
        tab0.refresh()  # 刷新让 cookie 生效，重判登录态
        time.sleep(3)
        print(f"已注入 {len(cookies)} 个抖音 cookie（来源: {cookies_file}）")
    else:
        print(f"⚠️ 未找到 cookie 文件 {cookies_file}")
        print("   先跑抽取脚本（需本机 Chrome 已登录抖音）:")
        print("   ~/.douyin-search-profile/.venv/bin/python ~/.agents/skills/laohan-douyinsousuo/scripts/extract_cookies.py")
        print("   现在回退扫码登录模式（120秒内手动扫码）...")

    tab = browser.new_tab(url)

    # 等待登录
    print("等待登录...")
    try:
        tab.wait.ele_displayed('tag:span@@class="semi-avatar"', timeout=20)
        print("登录态有效")
    except Exception:
        print("⚠️ cookie 注入无效或已失效，请在弹出的浏览器中扫码登录（120秒）...")
        print("   登录后建议重抽 cookie 持久化: 跑 extract_cookies.py")
        tab.wait.ele_displayed('tag:span@@class="semi-avatar"', timeout=120)
        print("登录成功！")
    time.sleep(2)

    # 登录后再启动监听
    tab.listen.start("aweme/v1/web/search/item")

    videos = []
    seen_ids = set()

    for i in range(args.scroll):
        print(f"\n--- 第 {i + 1}/{args.scroll} 次滚动 ({len(videos)}/{args.min}) ---")
        tab.scroll.to_bottom()
        time.sleep(3)

        for _ in range(5):
            packet = tab.listen.wait(timeout=5)
            if not packet:
                break
            _parse_packet(packet, videos, seen_ids)

        # 采够了就停
        if len(videos) >= args.min:
            print(f"\n已采集 {len(videos)} 条，达到目标")
            break

    # 按点赞排行
    videos.sort(key=lambda x: x["likes"], reverse=True)

    # 输出 TOP 排行
    print(f"\n{'=' * 60}")
    print(f"共 {len(videos)} 条 | 点赞排行 TOP {min(len(videos), 20)}：")
    print(f"{'=' * 60}")
    for i, v in enumerate(videos[:20], 1):
        print(f"\n{i}. {v['title'][:60]}")
        print(f"   {v['author']} | ❤️{v['likes']} 💬{v['comments']} ▶️{v['plays']} | {v['create_time_str']}")
        print(f"   {v['url']}")

    # 保存 JSON
    output_dir = os.path.expanduser("~/.douyin-search-profile/output")
    os.makedirs(output_dir, exist_ok=True)
    safe_name = keyword.replace(" ", "_").replace("/", "_")
    output_file = f"{output_dir}/{safe_name}_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
    print(f"\n已保存: {output_file}")

    browser.quit()


def _parse_packet(packet, videos, seen_ids):
    try:
        body = packet.response.body
        if isinstance(body, str):
            body = json.loads(body)
        data_list = body.get("data", [])
        if not data_list:
            return

        for item in data_list:
            aweme_info = item.get("aweme_info", {})
            if not aweme_info:
                continue
            aweme_id = aweme_info.get("aweme_id", "")
            if aweme_id in seen_ids:
                continue
            seen_ids.add(aweme_id)

            author = aweme_info.get("author", {})
            stats = aweme_info.get("statistics", {})
            create_time = aweme_info.get("create_time", 0)

            video = {
                "title": aweme_info.get("desc", ""),
                "author": author.get("nickname", ""),
                "author_id": author.get("unique_id", "") or author.get("short_id", ""),
                "likes": stats.get("digg_count", 0),
                "comments": stats.get("comment_count", 0),
                "shares": stats.get("share_count", 0),
                "plays": stats.get("play_count", 0),
                "create_time": create_time,
                "create_time_str": datetime.fromtimestamp(create_time).strftime("%Y-%m-%d %H:%M") if create_time else "",
                "aweme_id": aweme_id,
                "url": f"https://www.douyin.com/video/{aweme_id}",
            }
            videos.append(video)
            print(f"  [{len(videos)}] {video['author']} | ❤️{video['likes']} | {video['create_time_str']} | {video['title'][:35]}")

    except Exception as e:
        print(f"  解析错误: {e}")


if __name__ == "__main__":
    main()
