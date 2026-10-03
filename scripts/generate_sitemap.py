#!/usr/bin/env python3
"""
Génère sitemap.xml pour mathenlarge.fr.

Liste tous les fichiers .html du dépôt (sauf ceux exclus ci-dessous),
avec leur date de dernière modification lue depuis git.

Usage manuel :  python3 scripts/generate_sitemap.py
(Sinon, lancé automatiquement par .github/workflows/sitemap.yml à chaque push.)
"""
import subprocess
import datetime
from pathlib import Path
from xml.sax.saxutils import escape

BASE_URL = "https://mathenlarge.fr"

# Racine du dépôt = dossier parent de /scripts
ROOT = Path(__file__).resolve().parent.parent

# ─── Ce qu'on NE met PAS dans le sitemap ──────────────────────────────────
# Ajoute / retire des lignes librement. La comparaison se fait sur le chemin
# relatif à la racine (ex. "dm-eleve.html", "sous-dossier/truc.html").

EXCLUDE_EXACT = {
    "dm-eleve.html",   # formulaire de dépôt des DM (élève) — pas une page de contenu
    "dm-prof.html",    # page de correction (prof)
    "404.html",
    "plan.html",       # si tu crées une page "plan du site", inutile de l'indexer elle-même
    # "6eme_starter1.html",   # <- exemple : décommente pour exclure un fichier précis
}

# Exclut tout fichier dont le NOM contient un de ces fragments (minuscules) :
EXCLUDE_CONTAINS = [
    "template",
    "composant",
    "component",
    "_partial",
    "test",
    "-prof",
    # "starter",   # <- décommente cette ligne pour exclure TOUS les Starters
]

# Exclut des dossiers entiers (par préfixe de chemin) :
EXCLUDE_DIRS = [
    ".github",
    "node_modules",
    "scripts",
]
# ──────────────────────────────────────────────────────────────────────────


def git_lastmod(path: Path) -> str:
    """Date du dernier commit touchant ce fichier (YYYY-MM-DD). Défaut : aujourd'hui."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(path)],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
        if out:
            return out
    except Exception:
        pass
    return datetime.date.today().isoformat()


def is_excluded(rel: str) -> bool:
    if rel in EXCLUDE_EXACT:
        return True
    low = rel.lower()
    if any(frag in low for frag in EXCLUDE_CONTAINS):
        return True
    if any(low.startswith(d.lower() + "/") for d in EXCLUDE_DIRS):
        return True
    return False


def main():
    files = sorted(
        p for p in ROOT.rglob("*.html")
        if not is_excluded(p.relative_to(ROOT).as_posix())
    )

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        # La page d'accueil est servie sur l'URL racine, pas /index.html
        loc = BASE_URL + "/" if rel == "index.html" else f"{BASE_URL}/{rel}"
        lines += [
            "  <url>",
            f"    <loc>{escape(loc)}</loc>",
            f"    <lastmod>{git_lastmod(p)}</lastmod>",
            "  </url>",
        ]
    lines += ["</urlset>", ""]

    (ROOT / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")
    print(f"sitemap.xml généré : {len(files)} pages.")


if __name__ == "__main__":
    main()
