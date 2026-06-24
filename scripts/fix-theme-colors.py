"""Replace hardcoded light-theme hex with colors.* tokens (design-only)."""
from pathlib import Path
import re

ROOT = Path(r"C:\work\mobile-experimental\src")

REPLACEMENTS = [
    ("'#111827'", "colors.text"),
    ('"#111827"', "colors.text"),
    ("'#1f2937'", "colors.text"),
    ("'#6b7280'", "colors.textMuted"),
    ('"#6b7280"', "colors.textMuted"),
    ("'#4b5563'", "colors.textMuted"),
    ('"#4b5563"', "colors.textMuted"),
    ("'#9ca3af'", "colors.textMuted"),
    ("'#2563eb'", "colors.primary"),
    ('"#2563eb"', "colors.primary"),
    ("'#1d4ed8'", "colors.primary"),
    ("'#60a5fa'", "colors.primaryLight"),
    ("'#ef4444'", "colors.loss"),
    ('"#ef4444"', "colors.loss"),
    ("'#dc2626'", "colors.loss"),
    ("'#f59e0b'", "colors.warning"),
    ("'#b45309'", "colors.warning"),
    ("'#16a34a'", "colors.profit"),
    ("'#15803d'", "colors.profit"),
    ("'#34d399'", "colors.profit"),
    ("'#10b981'", "colors.profit"),
    ("'#7c3aed'", "colors.accent"),
    ("'#0891b2'", "colors.primary"),
    ("'#f3f4f6'", "colors.surfaceElevated"),
    ("'#e5e7eb'", "colors.border"),
    ("'#374151'", "colors.textMuted"),
]

IMPORT_THEME = "import { colors } from '../theme';"
IMPORT_THEME_DEEP = "import { colors } from '../../theme';"

for path in ROOT.rglob("*.tsx"):
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text == original:
        continue
    if "colors." in text and "from '../theme'" not in text and "from '../../theme'" not in text and "from '../theme/colors'" not in text:
        depth = len(path.relative_to(ROOT).parts) - 1
        imp = "import { colors } from '" + "../" * depth + "theme';"
        # insert after last import
        m = list(re.finditer(r"^import .+$", text, re.M))
        if m:
            pos = m[-1].end()
            text = text[:pos] + "\n" + imp + text[pos:]
    path.write_text(text, encoding="utf-8")
    print("updated", path.relative_to(ROOT))

print("done")
