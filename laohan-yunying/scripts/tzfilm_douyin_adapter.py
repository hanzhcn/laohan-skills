#!/usr/bin/env python3
import os
import runpy

target = os.path.expanduser('~/Documents/laohanAI视频创作/scripts/tzfilm_douyin_adapter.py')
if not os.path.isfile(target):
    raise SystemExit('未找到 workflow canonical TzFilm adapter: ' + target)
runpy.run_path(target, run_name='__main__')
