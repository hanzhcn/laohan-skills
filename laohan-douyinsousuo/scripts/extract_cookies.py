#!/usr/bin/env python3
"""抽取本机 Chrome 抖音登录态 cookie，供 search.py 免扫码注入。

用法:
  python extract_cookies.py [--profile 5] [--output <path>]

  --profile  Chrome profile 名（默认 5，即本机抖音登录态所在 profile）
  --output   cookie JSON 输出路径（默认 ~/.douyin-search-profile/douyin_cookies.json）

原理: 用 browser_cookie3 读 Chrome 的 Cookies 库（自动处理 keychain 解密），
筛 douyin/iesdouyin 域 cookie，存成 DrissionPage set.cookies() 可吃的格式。

退出码:
  0  成功（且含 sessionid，登录态有效）
  1  无 sessionid（登录态无效，需先在 Chrome 登录抖音）
  2  读 cookie 失败（profile 路径不对 / Chrome 占用 / browser_cookie3 解密失败）
"""
import argparse
import json
import os
import sys

try:
    import browser_cookie3 as bc3
except ImportError:
    print("❌ 无 browser_cookie3，装: ~/.douyin-search-profile/.venv/bin/pip install browser-cookie3", file=sys.stderr)
    sys.exit(2)


def find_cookie_file(profile_name):
    """Chrome 的 Cookies 库可能在 Profile 根或 Network/ 子目录，逐个试。"""
    base = os.path.expanduser(f"~/Library/Application Support/Google/Chrome/{profile_name}")
    for candidate in [os.path.join(base, "Cookies"), os.path.join(base, "Network", "Cookies")]:
        if os.path.exists(candidate):
            return candidate
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--profile", default="5", help="Chrome profile 名(默认5,本机抖音登录态所在)")
    p.add_argument("--output", default=os.path.expanduser("~/.douyin-search-profile/douyin_cookies.json"))
    args = p.parse_args()

    # profile 名支持 "Profile 5" 或 "5" 两种写法
    pname = args.profile if args.profile.startswith("Profile") else f"Profile {args.profile}"
    cookie_file = find_cookie_file(pname)
    if not cookie_file:
        print(f"❌ 找不到 {pname} 的 Cookies 库（试过 Profile 根和 Network/ 子目录）", file=sys.stderr)
        print(f"   确认 Chrome 有这个 profile，且你已用它登录抖音", file=sys.stderr)
        sys.exit(2)

    try:
        cj = bc3.chrome(cookie_file=cookie_file)
    except Exception as e:
        print(f"❌ 读 Chrome cookie 失败: {type(e).__name__}: {e}", file=sys.stderr)
        print("   常见原因: Chrome 正在运行锁住库(关掉重试) / keychain 权限弹窗未点允许", file=sys.stderr)
        sys.exit(2)

    dy = [c for c in cj if "douyin" in c.domain or "iesdouyin" in c.domain]
    if not dy:
        print(f"❌ {pname} 无任何抖音域 cookie，先用这个 profile 登录 douyin.com", file=sys.stderr)
        sys.exit(1)

    # 转 DrissionPage 格式：清 None 值（带 None 的字段 set.cookies 会拒收）
    cookies = []
    for c in dy:
        item = {
            "name": c.name,
            "value": c.value,
            "domain": c.domain,
            "path": c.path,
            "expiry": c.expires if c.expires and c.expires > 0 else None,
            "secure": bool(c.secure),
        }
        item = {k: v for k, v in item.items() if v is not None}
        cookies.append(item)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(cookies, f, ensure_ascii=False, indent=2)

    has_sess = any(c["name"] == "sessionid" for c in cookies)
    key_logins = ["sessionid", "sessionid_ss", "sid_guard", "sid_tt", "uid_tt", "s_v_web_id"]
    found = [k for k in key_logins if any(c["name"] == k for c in cookies)]
    print(f"✅ 抽到 {len(cookies)} 个抖音 cookie → {args.output}")
    print(f"   来源: {cookie_file}")
    print(f"   关键登录 cookie: {', '.join(found) if found else '无'}")
    if not has_sess:
        print("⚠️ 无 sessionid，登录态可能失效。请用该 profile 重新登录 douyin.com 后重抽。", file=sys.stderr)
        sys.exit(1)
    print(f"   sessionid ✓ 登录态有效")


if __name__ == "__main__":
    main()
