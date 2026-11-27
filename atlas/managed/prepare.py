"""Assemble only the curated public Atlas outputs for Cloudflare's native bundler."""
from pathlib import Path
import json
import re
import shutil
from navigation import header, PORTFOLIO_FOOTER
from recent import content as election_index
from home import content as atlas_home
from countries import build_country_pages

here = Path(__file__).resolve().parent
root = here.parent
base = root / 'styled'
overlay = root / 'latam-ui/output'
target = here / 'public.next'
HTMLS = {'regional.html', 'index.html', 'local.html', 'context.html', 'south-america.html'}
OVERLAYS = HTMLS | {'regional-votes.json', 'regional-geography.json', 'regional-context.json', 'regional.js', 'regional.css'}

def public_path(f):
    rel = f.relative_to(base)
    if any(x.startswith('.') for x in rel.parts):
        return False
    if len(rel.parts) == 1:
        return f.suffix in {'.html', '.css', '.js', '.json', '.csv'}
    if len(rel.parts) == 2 and rel.parts[0] == 'local':
        return bool(re.fullmatch(r'(?:index|[1-9]|1[0-9]|2[0-4])\.json', f.name))
    return len(rel.parts) == 2 and rel.parts[0] == 'brand' and f.suffix in {'.woff2', '.avif', '.svg', '.txt'}

NAV_ASSETS = '<link rel="stylesheet" href="/atlas-menu-v4.css"><script defer src="/atlas-menu-v3.js"></script>'
PAGES = {'regional.html': '/regional', 'index.html': '/argentina', 'local.html': '/local', 'context.html': '/context', 'south-america.html': '/south-america'}

def page_shell(title, description, route, body, assets=''):
    from html import escape
    head = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{escape(description, quote=True)}"><title>{escape(title)}</title><link rel="icon" href="/brand/favicon.svg"><script src="/atlas-theme-v1.js"></script><link rel="stylesheet" href="/atlas.css"><link rel="stylesheet" href="/atlas-design-v1.css">'
    footer = f'</main><div class="bo-site-footer">{PORTFOLIO_FOOTER}</div></body></html>'
    return head + NAV_ASSETS + assets + '</head><body>' + header(route) + '<main id="main-content" tabindex="-1">' + body + footer

def homepage():
    db = json.loads((overlay / 'regional-votes.json').read_text())
    geo = json.loads((overlay / 'regional-geography.json').read_text())
    return page_shell(
        'Latin America Election Atlas · Elections and voting history',
        'Explore elections, voting history, and political geography across Latin America, with regional maps, recent results, and country profiles.',
        '/', atlas_home(db, geo), '<script src="/atlas-home-compat-v1.js"></script><link rel="stylesheet" href="/atlas-home-v1.css">')

def recent_page():
    head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Explore presidential and lower-house elections recorded across Latin America since 2020."><title>Recent elections · Latin America Election Atlas</title><link rel="icon" href="/brand/favicon.svg"><script src="/atlas-theme-v1.js"></script><link rel="stylesheet" href="/atlas.css"><link rel="stylesheet" href="/atlas-design-v1.css"><link rel="stylesheet" href="/recent-v1.css"><script defer src="/recent-v1.js"></script>'
    footer = f'</main><div class="bo-site-footer">{PORTFOLIO_FOOTER}</div></body></html>'
    return head + NAV_ASSETS + '</head><body>' + header('/elections') + '<main id="main-content" tabindex="-1">' + election_index(json.loads((overlay / 'regional-votes.json').read_text())) + footer

def docs():
    head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Connect your AI to the Election Atlas’s public election and context data with MCP."><title>Connect AI · Latin America Election Atlas</title><link rel="icon" href="/brand/favicon.svg"><script src="/atlas-theme-v1.js"></script><link rel="stylesheet" href="/atlas.css"><link rel="stylesheet" href="/atlas-design-v1.css">'
    footer = f'</main><div class="bo-site-footer">{PORTFOLIO_FOOTER}</div></body></html>'
    return head + NAV_ASSETS + '</head><body>' + header('/connect') + '<main id="main-content" tabindex="-1">' + (root / 'mcp/connect-content.html').read_text() + footer

ARGENTINA_TOOLS = {
    '/argentina': '2023 province map',
    '/local': '2023 voting circuits',
    '/context': 'Argentina data overlays',
}

def argentina_breadcrumb(route):
    if route not in ARGENTINA_TOOLS:
        return ''
    return f'<nav class="atlas-argentina-breadcrumb" aria-label="Breadcrumb"><a href="/countries">All countries</a><span aria-hidden="true">›</span><a href="/countries/arg">Argentina profile</a><span aria-hidden="true">›</span><span aria-current="page">{ARGENTINA_TOOLS[route]}</span></nav>'


if target.exists():
    shutil.rmtree(target)
target.mkdir()
for source in sorted(base.rglob('*')):
    if not source.is_file() or source.is_symlink() or not public_path(source):
        continue
    rel = source.relative_to(base).as_posix()
    input_file = overlay / rel if rel in OVERLAYS else source
    if rel == 'regional.html':
        input_file = root / 'latam-ui/explorer' / rel
    path = target / ('argentina.html' if rel == 'index.html' else rel)
    path.parent.mkdir(parents=True, exist_ok=True)
    if rel in HTMLS:
        html, n = re.subn(r'(<body>).*?(<main id="main-content"[^>]*>)', lambda match: match[1] + header(PAGES[rel]) + match[2] + argentina_breadcrumb(PAGES[rel]), input_file.read_text(), count=1, flags=re.S)
        if n != 1:
            raise RuntimeError(f'Missing Atlas page shell in {rel}')
        html = html.replace('</head>', NAV_ASSETS + '</head>', 1)
        html = re.sub(r'(<div class="bo-site-footer">).*?(</div>)', lambda match: match[1] + PORTFOLIO_FOOTER + match[2], html, count=1, flags=re.S)
        path.write_text(html)
        if rel == 'regional.html':
            (target / 'connect.html').write_text(docs())
    else:
        shutil.copyfile(input_file, path)
(target / 'index.html').write_text(homepage())
(target / 'elections.html').write_text(recent_page())
build_country_pages(target, overlay, page_shell)
for suffix in ('css', 'js'):
    shutil.copyfile(root / 'latam-ui/explorer' / f'regional.{suffix}', target / f'regional-explorer-v2.{suffix}')
    shutil.copyfile(root / 'latam-ui/explorer/legacy' / f'regional.{suffix}', target / f'regional-explorer-v1.{suffix}')
for asset in ('atlas-menu-v2.css', 'atlas-menu-v2.js', 'atlas-menu-v3.css', 'atlas-menu-v3.js', 'atlas-menu-v4.css', 'recent-v1.css', 'recent-v1.js', 'atlas-home-v1.css', 'atlas-home-compat-v1.js'):
    shutil.copyfile(here / asset, target / asset)
if (here / 'public').exists():
    shutil.rmtree(here / 'public')
target.rename(here / 'public')
print(f'Assembled {sum(f.is_file() for f in (here / "public").rglob("*"))} public Atlas files')
