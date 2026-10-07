#!/usr/bin/env python3
"""
seo_titles.py — Optimise le <head> SEO de toutes les pages de mathenlarge.fr
à partir de data.js (source de vérité : niveau + sujet + type + nom + url).

Pour chaque page référencée dans data.js, le script :
  - réécrit le <title> au format "Sujet Niveau : …"
  - pose une <meta name="description">
  - pose un <link rel="canonical"> (répond à l'alerte Google "page en double
    sans URL canonique")
  - pose les balises Open Graph / Twitter (joli aperçu quand un lien est partagé)

Tout est regroupé dans un bloc délimité <!-- seo-auto:start --> … :end -->,
donc le script est IDEMPOTENT : on peut le relancer sans dupliquer ni casser.
Il ne touche QU'AU <title> et à ce bloc — aucun autre contenu des pages.

Usage :  python3 scripts/seo_titles.py             (applique)
         python3 scripts/seo_titles.py --dry-run   (montre le bilan sans écrire)
"""
import re, sys, html, unicodedata
from pathlib import Path

ROOT     = Path(__file__).resolve().parent.parent
DATA_JS  = ROOT / "data.js"
SITE     = "Mathenlarge"
BASE_URL = "https://mathenlarge.fr"
TITLE_MAX = 65  # au-delà, Google tronque dans ses résultats

GRADE_LABEL = {"6eme":"6ème","5eme":"5ème","4eme":"4ème",
               "3eme":"3ème","2nde":"2nde","1ere":"1ère"}

# Corrections d'affichage des sujets (data.js contient parfois des clés sans accent)
TOPIC_FIX = {
    "Equations": "Équations",
    "Eléments de géométrie": "Éléments de géométrie",
    "Enchainement d'opérations": "Enchaînement d'opérations",
}

def deaccent(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn').lower()

# ── 1. data.js -> url : {grades:set, topic, type, name} ──────────────────────
def parse_data_js():
    txt = DATA_JS.read_text(encoding="utf-8")
    heads = [(m.group(1), m.group(2), m.end())
             for m in re.finditer(r'"(\d\w+):([^"]+)"\s*:\s*\{', txt)]
    item_re = re.compile(r'\{\s*n:\s*"((?:[^"\\]|\\.)*)"\s*,\s*url:\s*"([^"]+)"\s*\}')
    mapping = {}
    for i, (grade, topic, start) in enumerate(heads):
        end = heads[i+1][2] if i+1 < len(heads) else len(txt)
        block = txt[start:end]
        topic = TOPIC_FIX.get(topic, topic)
        for typ in ("lecon", "exercices", "exerciseurs"):
            m = re.search(typ + r'\s*:\s*\[', block)
            if not m:
                continue
            depth, j = 0, m.end()-1
            while j < len(block):
                if block[j] == '[': depth += 1
                elif block[j] == ']':
                    depth -= 1
                    if depth == 0: break
                j += 1
            for it in item_re.finditer(block[m.end():j]):
                name, url = it.group(1), it.group(2)
                rec = mapping.setdefault(url, {"grades":set(), "topic":topic,
                                               "type":typ, "name":name})
                rec["grades"].add(grade)
                if typ == "lecon":                      # la leçon prime
                    rec.update(type="lecon", name=name, topic=topic)
    return mapping

# ── 2. Titre / description ───────────────────────────────────────────────────
def grade_str(grades):
    order = ["6eme","5eme","4eme","3eme","2nde","1ere"]
    g = sorted(grades, key=lambda x: order.index(x) if x in order else 9)
    labels = [GRADE_LABEL.get(x, x) for x in g]
    if len(labels) == 1: return labels[0]
    if len(labels) == 2: return f"{labels[0]} et {labels[1]}"
    return "collège"

def clean_name(name):
    n = re.sub(r'^(Exercices?|Leçon|Activité|Chapitre[^–\-]*|Séquence[^–\-]*|Bilan)'
               r'\s*[–\-:]\s*', '', name).strip()
    return n or name

def has_topic(spec, topic):
    return deaccent(topic.split()[0]) in deaccent(spec)

def build_title(rec):
    topic, g, typ = rec["topic"], grade_str(rec["grades"]), rec["type"]
    if typ == "lecon":
        core = f"{topic} {g} : cours et exercices corrigés"
    elif typ == "exercices":
        spec = clean_name(rec["name"])
        core = f"{spec} — {g}" if has_topic(spec, topic) else f"{topic} {g} : {spec}"
    else:  # exerciseurs
        spec = clean_name(rec["name"])
        core = f"{spec} — {g}" if has_topic(spec, topic) else f"{spec} — {topic} {g}"
    full = f"{core} | {SITE}"
    if len(full) > TITLE_MAX:          # trop long -> on retire le nom du site
        full = core
    if len(full) > TITLE_MAX:          # encore trop long -> on coupe proprement
        full = full[:TITLE_MAX-1].rstrip(" –-:") + "…"
    return full

def build_desc(rec):
    topic, g, typ = rec["topic"], grade_str(rec["grades"]), rec["type"]
    if typ == "lecon":
        return (f"{topic} en {g} : cours clair, méthodes et exercices corrigés "
                f"à faire en ligne sur {SITE}.")
    if typ == "exercices":
        return (f"{clean_name(rec['name'])} — exercices de {topic.lower()} en {g} "
                f"avec correction détaillée sur {SITE}.")
    return (f"{clean_name(rec['name'])} : exercice interactif de maths "
            f"({topic}, {g}) à faire en ligne sur {SITE}.")

# ── 3. Écriture dans le <head> ───────────────────────────────────────────────
TITLE_RE = re.compile(r'<title>.*?</title>', re.I | re.S)
BLOCK_RE = re.compile(r'\n?[ \t]*<!-- seo-auto:start -->.*?<!-- seo-auto:end -->',
                      re.I | re.S)
HAS_DESC = re.compile(r'<meta\s+name="description"', re.I)
HAS_CANON = re.compile(r'<link\s+rel="canonical"', re.I)

def canonical(url):
    return BASE_URL + "/" if url == "index.html" else f"{BASE_URL}/{url}"

def build_block(rec, url, existing_desc, existing_canon):
    title = build_title(rec); desc = build_desc(rec); loc = canonical(url)
    e = lambda s: html.escape(s, quote=True)
    lines = ["<!-- seo-auto:start -->"]
    if not existing_desc:
        lines.append(f'<meta name="description" content="{e(desc)}">')
    if not existing_canon:
        lines.append(f'<link rel="canonical" href="{e(loc)}">')
    lines += [
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:url" content="{e(loc)}">',
        f'<meta property="og:site_name" content="{SITE}">',
        f'<meta property="og:image" content="{BASE_URL}/apercu.png">',
        '<meta name="twitter:card" content="summary_large_image">',
        "<!-- seo-auto:end -->",
    ]
    return title, "\n".join(lines)

def apply_file(path, rec, url, dry=False):
    txt = path.read_text(encoding="utf-8")
    if "<title>" not in txt.lower():
        return None
    # on enlève d'abord un éventuel bloc auto précédent (idempotence)
    txt2 = BLOCK_RE.sub('', txt)
    has_desc  = bool(HAS_DESC.search(txt2))   # meta description écrite à la main ?
    has_canon = bool(HAS_CANON.search(txt2))
    title, block = build_block(rec, url, has_desc, has_canon)
    new_title = f"<title>{html.escape(title, quote=False)}</title>"
    txt2 = TITLE_RE.sub(lambda m: new_title, txt2, count=1)
    txt2 = txt2.replace(new_title, new_title + "\n" + block, 1)
    if txt2 != txt and not dry:
        path.write_text(txt2, encoding="utf-8")
    return title

def main():
    dry = "--dry-run" in sys.argv
    mapping = parse_data_js()
    done = skipped = 0
    toolong = []
    for url, rec in sorted(mapping.items()):
        p = ROOT / url
        if not p.exists():
            skipped += 1; continue
        t = apply_file(p, rec, url, dry=dry)
        if t:
            done += 1
            if len(t) > TITLE_MAX: toolong.append((url, len(t), t))
    print(f"{'[dry-run] ' if dry else ''}{done} pages traitées, "
          f"{skipped} introuvables, {len(mapping)} entrées data.js.")
    if toolong:
        print(f"⚠ {len(toolong)} titres > {TITLE_MAX} caractères")

if __name__ == "__main__":
    main()
