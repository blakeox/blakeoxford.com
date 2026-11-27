"""Shared Atlas header, emitted at build time for every page."""
from html import escape

PORTFOLIO = 'https://blakeoxford.com'
ARGENTINA = [
    ('/argentina', '2023 election results', 'National results and province map'),
    ('/local', 'Voting circuits', 'Sections and voting circuits'),
    ('/context', 'Data overlays', 'Population, economy, public finance and geography'),
]
PORTFOLIO_FOOTER = f'<a href="{PORTFOLIO}/">Blake Oxford</a> · <a href="{PORTFOLIO}/projects/">Projects</a> · <a href="{PORTFOLIO}/blog/">Writing</a> · <a href="{PORTFOLIO}/contact/">Contact</a>'

def header(page):
    def link(url, label, note='', element_id='', css=''):
        attrs = (f' id="{element_id}"' if element_id else '') + (f' class="{css}"' if css else '')
        attrs += ' aria-current="page"' if url == page else (' aria-current="location"' if url == '/countries' and page.startswith('/countries/') else '')
        description = f'<small>{escape(note)}</small>' if note else ''
        return f'<a href="{escape(url)}"{attrs}><span>{escape(label)}</span>{description}</a>'

    def group(label, items):
        selected = any(url == page or (url == '/countries' and page.startswith('/countries/')) for url, *_ in items)
        links = ''.join('<li>' + link(
            url, text, note,
            'ctx-local-nav' if page == '/context' and url == '/local' else
            'local-context' if page == '/local' and url == '/context' else '',
        ) + '</li>' for url, text, note in items)
        cls = ' class="atlas-menu-current"' if selected else ''
        return f'<details{cls}><summary>{label}<span class="atlas-chevron" aria-hidden="true"></span></summary><ul>{links}</ul></details>'

    return f'''<a class="bo-skip" href="#main-content">Skip to atlas</a>
<header class="bo-masthead atlas-header"><div class="bo-masthead-inner">
<a href="/" class="bo-brand" aria-label="Latin America Election Atlas home"><img src="/brand/blake_detroit_skyline_bell_isle.DfdxtSEm_Z1z8Ebs.avif" width="36" height="36" alt=""><span><span class="bo-brand-name">Latin America Election Atlas</span><span class="bo-brand-desc">By Blake Oxford</span></span></a>
<button type="button" id="atlas-menu-toggle" aria-expanded="false" aria-controls="atlas-menu" hidden><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span></button>
<nav id="atlas-menu" class="atlas-menu" aria-label="Atlas navigation">
{link('/', 'Home')}
{link('/regional','Map',css='atlas-core-link')}
{link('/countries','Countries',css='atlas-core-link')}
{link('/elections','Recent elections',css='atlas-core-link')}
{group('Argentina 2023', ARGENTINA)}
{link('/connect','Connect AI')}
<div class="atlas-menu-theme"><label for="bo-theme">Theme</label><select class="bo-theme" id="bo-theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
</nav><nav class="atlas-quicknav" aria-label="Explore Atlas">
{link('/regional','Map')}
{link('/countries','Countries')}
{link('/elections','Recent elections')}
</nav></div></header>'''
