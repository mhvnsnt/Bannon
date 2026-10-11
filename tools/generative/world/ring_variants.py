"""ring_variants.py — per-company ring palettes.

The owner has 6 canon companies; their color palettes are PENDING from him
(memory 2026-10-05). This module defines the palette *schema* and 6 placeholder
slots plus a neutral HOUSE default. DO NOT invent canon company names or colors
here — when Real supplies palettes, add them as named entries and the arena /
crowd generators pick them up with zero code changes.

Palette fields (all sRGB hex):
  canvas, apron, ropes, turnbuckle, post, tron (titantron tint), trim
"""
HOUSE = {
    "canvas": "#2b2f36", "apron": "#14161a", "ropes": "#c8ccd2",
    "turnbuckle": "#8f1d1d", "post": "#3a3f47", "tron": "#7fd4ff",
    "trim": "#8f1d1d",
}

# Awaiting owner palettes — clearly marked placeholders, never shown as canon.
COMPANY_01 = dict(HOUSE); COMPANY_01["_awaiting_owner_palette"] = True
COMPANY_02 = dict(HOUSE); COMPANY_02["_awaiting_owner_palette"] = True
COMPANY_03 = dict(HOUSE); COMPANY_03["_awaiting_owner_palette"] = True
COMPANY_04 = dict(HOUSE); COMPANY_04["_awaiting_owner_palette"] = True
COMPANY_05 = dict(HOUSE); COMPANY_05["_awaiting_owner_palette"] = True
COMPANY_06 = dict(HOUSE); COMPANY_06["_awaiting_owner_palette"] = True

PALETTES = {
    "HOUSE": HOUSE,
    "COMPANY_01": COMPANY_01, "COMPANY_02": COMPANY_02, "COMPANY_03": COMPANY_03,
    "COMPANY_04": COMPANY_04, "COMPANY_05": COMPANY_05, "COMPANY_06": COMPANY_06,
}

def get(name):
    if name not in PALETTES:
        raise KeyError(f"unknown palette {name!r}; choose from {sorted(PALETTES)}")
    return PALETTES[name]
