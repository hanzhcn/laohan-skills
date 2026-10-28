#!/usr/bin/env python3
"""Explicit Motion creator-center observations; the unimplemented SQLite bridge is retired."""
import argparse
from pathlib import Path
import os
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--record", required=True, help="Motion publish-verification JSON with bound platform IDs")
    args = parser.parse_args()
    target = Path.home() / "Documents/laohanvideo/motion/tools/observe-published.py"
    if not target.is_file():
        parser.error("只读观察器不存在: " + str(target))
    os.execv(sys.executable, [sys.executable, "-B", str(target), "--record", args.record])


if __name__ == "__main__":
    main()
