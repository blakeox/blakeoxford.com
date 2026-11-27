"""Build the recent-election index from the same records shown on the map."""
from collections import Counter, defaultdict
from datetime import date
from html import escape
from urllib.parse import urlencode, urlparse
import re

FROM_YEAR = 2020
SOURCES = {
    'Argentina CNE': 'https://www.electoral.gov.ar/nuevo/paginas/btn/elecc2023.php',
    'PPEG': 'https://doi.org/10.7910/DVN/5OAH7P',
    'CLEA': 'https://electiondataarchive.org/data-and-documentation/clea-lower-chamber-elections-archive/',
}
REGIONS = {
    'South America': 'south', 'Central America': 'central',
    'Mexico': 'mexico', 'Caribbean': 'caribbean',
}

def iso_day(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None

def display(day):
    return f'{day:%b} {day.day}, {day.year}'

def https(value):
    if not isinstance(value, str):
        return None
    url = urlparse(value)
    return value if url.scheme == 'https' and url.hostname and not url.username and not url.password else None

def collect(db):
    rows = []
    for code, country in db.items():
        for kind in ('pres','leg'):
            for record in country[kind]:
                year = int(record['year'])
                if year < FROM_YEAR:
                    continue
                first, runoff = iso_day(record.get('date')), iso_day(record.get('runDate'))
                # A documented later runoff determines when the contest was decided.
                effective = runoff or first
                event_key = record.get('id') or record.get('date') or year
                href = '/regional?' + escape(urlencode({'country':code,'view':kind,'election':event_key}), quote=True)
                source_name = record.get('src') or ('CLEA' if kind == 'leg' else None)
                source_url = https(record.get('url')) or SOURCES.get(source_name)
                rows.append({
                    'code': code, 'country': country['name'], 'region': REGIONS[country['region']],
                    'kind': kind, 'year': year, 'date': effective, 'first': first, 'runoff': runoff,
                    'href': href, 'record': record, 'source': source_name, 'source_url': source_url,
                })
    rows.sort(key=lambda row: row['country'])
    rows.sort(key=lambda row: (row['year'],row['date'] or date(row['year'],1,1)), reverse=True)
    return rows

def article(row):
    kind = row['kind']; record = row['record']
    if kind=='pres':
        rounds = record.get('run') or record.get('first') or []
        first_entry = rounds[0] if rounds else None
        round_label = 'Runoff leader' if record.get('run') else 'First-round leader'
        result = f'<p class="recent-result"><span>{round_label}</span><strong>{escape(first_entry[0])}</strong><b>{first_entry[2]:.1f}%</b></p>' if first_entry else '<p>No candidate shares shown.</p>'
        dates = []
        if row['first']:
            dates.append('First round ' + display(row['first']))
        if row['runoff']:
            dates.append('Runoff ' + display(row['runoff']))
        stamp = ' · '.join(dates) if dates else str(row['year'])
        href = row['href'] + '#details'
    else:
        result = f'<p class="recent-result"><span>Archive coverage</span><strong>{len(record.get("areas", [])):,} constituencies</strong></p>'
        stamp = f'{row["year"]} · constituency archive'
        href = row['href'] + '#districts'
    title = escape(row['country'])
    kind_label = 'Presidential' if kind=='pres' else 'Lower house'
    source = f'<a href="{escape(row["source_url"], quote=True)}">{escape(row["source"] or "Source")}</a>' if row['source_url'] else ''
    return f'''<article class="recent-entry" data-region="{row['region']}" data-code="{row['code']}" data-kind="{kind}" data-year="{row['year']}">
<div class="recent-entry-top"><h3><a href="{href}">{title}</a></h3><span class="recent-badge">{kind_label}</span></div>
<p class="recent-date">{escape(stamp)}</p>{result}
<div class="recent-entry-links"><a href="{href}">Explore results <span class="recent-sr-only">for {title}, {row['year']} {kind_label.lower()}</span> <span aria-hidden="true">›</span></a>{source}</div>
</article>'''

def content(db):
    rows = collect(db)
    counts = Counter(r['code'] for r in rows)
    years = defaultdict(list)
    for row in rows:
        years[row['year']].append(row)
    country_options = ''.join(f'<option value="{k}">{escape(row["name"])}</option>'
        for k,row in sorted(db.items(),key=lambda item:item[1]['name']))
    year_options = ''.join(f'<option>{y}</option>' for y in sorted(years,reverse=True))
    timeline = ''.join(f'<section class="recent-year"><h2>{y}</h2><div>{"".join(map(article, entries))}</div></section>' for y,entries in years.items())
    coverage = ''.join(f'<li><a href="/countries/{k.lower()}">{escape(row["name"])}</a><span>{counts[k]} {"election" if counts[k]==1 else "elections"} since {FROM_YEAR}</span></li>'
        for k,row in sorted(db.items(),key=lambda item:item[1]['name']))
    return f'''<div class="recent-elections">
<header class="recent-hero"><p class="eyebrow">Latin America Election Atlas</p><h1>Recent elections</h1>
<p class="sub">Browse presidential and lower-house elections recorded in the Atlas since {FROM_YEAR}, newest first.</p>
<p class="recent-scope">This is an archive index, not a live tracker. Countries, years and contests may be missing. Presidential rounds are grouped into one election.</p></header>
<form class="recent-filters" id="recent-filters" aria-label="Filter recent elections" hidden>
<label>Region<select name="region"><option value="">All regions</option><option value="south">South America</option><option value="central">Central America</option><option value="mexico">Mexico</option><option value="caribbean">Selected Caribbean</option></select></label>
<label>Country<select name="country"><option value="">All countries</option>{country_options}</select></label>
<label>Election type<select name="type"><option value="">All types</option><option value="pres">Presidential</option><option value="leg">Lower house</option></select></label>
<label>Year<select name="year"><option value="">All years</option>{year_options}</select></label>
<button type="button" id="recent-clear">Clear filters</button>
</form>
<p id="recent-summary" role="status">{len(rows)} elections across {len(counts)} countries</p>
{timeline}
<p id="recent-empty" hidden>No indexed elections match these filters. Try a different country or year.</p>
<details class="recent-coverage"><summary>Coverage by country</summary><p>Zero means no records since {FROM_YEAR} in this Atlas, not that the country held no election. Open a country to find older or contextual records.</p><ul>{coverage}</ul></details>
<p><a href="/regional#atlas-methodology">Atlas sources and methodology</a></p></div>'''
