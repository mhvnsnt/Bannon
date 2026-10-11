#!/usr/bin/env python3
"""Shim -> gemini-editor home base (font-wizard). Donor-first, no duplication.

Usage: same as the home client:
    edit_image.py -i in.jpg --instr "make the background black" -o out.jpg
"""
import os
import sys
from pathlib import Path

HOME = Path(os.environ.get(
    "GEMINI_EDITOR_HOME",
    Path.home() / "workspace/font-wizard/tools/gemini-editor",
))
CLIENT = HOME / "edit_image.py"
if not CLIENT.exists():
    sys.exit(f"gemini-editor home not found: {CLIENT} (set GEMINI_EDITOR_HOME)")
os.execv(sys.executable, [sys.executable, str(CLIENT), *sys.argv[1:]])
