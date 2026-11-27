"""Static country profiles for the Latin America Election Atlas."""
from collections import Counter
from datetime import date
from html import escape
from pathlib import Path
from statistics import median
from urllib.parse import urlencode, urlsplit
import csv
import io
import json
import math
import re
import shutil

REGION = {
    'South America': ('south','South America'),
    'Central America': ('central','Central America'),
    'Mexico': ('mexico','Mexico'),
    'Caribbean': ('caribbean','Selected Caribbean'),
}
SOURCES = {
    'Argentina CNE': 'https://www.electoral.gov.ar/nuevo/paginas/btn/elecc2023.php',
    'PPEG': 'https://doi.org/10.7910/DVN/5OAH7P',
    'CLEA': 'https://electiondataarchive.org/data-and-documentation/clea-lower-chamber-elections-archive/',
    'Baker & Greene': 'https://www.andybaker.org/data/index.html',
}
BLOCS = ['Left','Center','Right','Uncoded']
CONTEXT = {
    'SP.POP.TOTL': ('Population','people'),
    'SP.URB.TOTL.IN.ZS': ('Urban population','percent'),
    'NY.GDP.PCAP.CD': ('GDP per capita','usd'),
    'NV.AGR.TOTL.ZS': ('Agriculture share of GDP','percent'),
    'NV.IND.TOTL.ZS': ('Industry share of GDP','percent'),
    'NV.SRV.TOTL.ZS': ('Services share of GDP','percent'),
    'GC.XPN.TRFT.ZS': ('Subsidies and transfers','percent'),
}

def esc(value):
    return escape(str(value), quote=True)

def valid_url(value):
    if not isinstance(value,str):
        return None
    try:
        result = urlsplit(value)
        return value if result.scheme == 'https' and result.hostname and not result.username and not result.password else None
    except ValueError:
        return None

def source_link(name, url=None):
    url = valid_url(url) or SOURCES.get(name)
    return f'<a href="{esc(url)}">{esc(name)}</a>' if name and url else esc(name or 'Source not labeled in this record')

def href_map(code, mode='pres', key=None, fragment=''):
    q={'country':code,'view':mode}
    if key is not None:
        q['election']=key
    return '/regional?' + esc(urlencode(q)) + fragment

def date_label(value, year):
    try:
        d=date.fromisoformat(value)
        return f'{d:%b} {d.day}, {d.year}'
    except (TypeError,ValueError):
        return str(year)

def pres_key(e):
    return e.get('id') or e.get('date') or e['year']

def date_options(records, pres=False):
    if pres:
        labels=[(pres_key(e),date_label(e.get('date'),e['year'])) for e in records]
    else:
        counts=Counter(e['year'] for e in records)
        labels=[(e['id'],f"{e['year']} · record {e['id']}" if counts[e['year']]>1 else e['year']) for e in records]
    return ''.join(f'<option value="{esc(k)}">{esc(v)}</option>' for k,v in labels)

def number(value, digits=1):
    return f'{value:,.{digits}f}'

def span(records):
    years=sorted({int(e['year']) for e in records})
    return 'Not in archive' if not years else str(years[0]) if len(years)==1 else f'{years[0]}–{years[-1]}'

def chart(series, caption, labels, units="%"):
    years=sorted({int(y) for line in series for y,v in line if isinstance(v,(float,int)) and math.isfinite(v)})
    if not years:
        return ''
    first,last=years[0],years[-1]
    def x(y): return 336 if first==last else 50+(y-first)*567/(last-first)
    def y(v): return 194-min(100,max(0,v))*1.64
    lines=''.join(f'<line class="ct-grid" x1="50" y1="{y(v):.1f}" x2="617" y2="{y(v):.1f}"/><text x="44" y="{y(v)+4:.1f}" text-anchor="end">{v}{units}</text>' for v in (0,25,50,75,100))
    ticks=years if len(years)<=7 else list(dict.fromkeys(years[round(i*(len(years)-1)/5)] for i in range(6)))
    if len(ticks)>1:
        ticks=[t for i,t in enumerate(ticks) if i==0 or x(t)-x(ticks[i-1])>=34 or t==last]
        if len(ticks)>2 and x(ticks[-1])-x(ticks[-2])<34:
            del ticks[-2]
    lines+=''.join(f'<text x="{x(t):.1f}" y="217" text-anchor="middle">{t}</text>' for t in ticks)
    for i,line in enumerate(series):
        rows=[(yr,v) for yr,v in line if isinstance(v,(float,int)) and math.isfinite(v)]
        # Use separate dot-only series for runoff; the occurrence of a runoff is not universal.
        if rows and labels[i] != 'Runoff leader':
            lines+=f'<polyline class="ct-line ct-s{i}" points="'+' '.join(f'{x(yr):.1f},{y(v):.1f}' for yr,v in rows)+'"/>'
        for yr,v in rows:
            lines+=f'<circle r="4" class="ct-dot ct-s{i}" cx="{x(yr):.1f}" cy="{y(v):.1f}"><title>{esc(labels[i])}, {yr}: {number(v)}{units}</title></circle>'
    legend=''.join(f'<li><i class="ct-key ct-s{i}"></i>{esc(label)}</li>' for i,label in enumerate(labels) if any(v is not None for _,v in series[i]))
    return f'<figure class="ct-plot"><svg viewBox="0 0 640 232" role="img" aria-label="{esc(caption)}. Values are also available in the table below.">{lines}</svg><figcaption><ul>{legend}</ul>{esc(caption)}</figcaption></figure>'

SECTION_INFO = {
    'presidential': ('01', 'National elections', 'Presidential history'),
    'blocs': ('02', 'Ideological series', 'Voting bloc history'),
    'districts': ('03', 'Subnational elections', 'Legislative constituencies'),
    'country-context': ('04', 'Population & economy', 'Country context'),
}


def section_open(key, status=None, attrs=''):
    index, category, title = SECTION_INFO[key]
    state = 'available' if status else 'missing'
    return (f'<section id="{key}" class="ct-section" aria-labelledby="{key}-title"{attrs}>'
            f'<header class="ct-section-head"><div><p class="eyebrow">{index} / {esc(category)}</p>'
            f'<h2 id="{key}-title">{esc(title)}</h2></div>'
            f'<p class="ct-status" data-coverage="{state}">{esc(status or "Not in this archive")}</p></header>')


def empty_section(key, message):
    return (section_open(key)
            + f'<div class="ct-empty"><p>{esc(message)}</p></div></section>')


def page_nav():
    return '<nav class="ct-jump" aria-label="On this page">' + ''.join(
        f'<a href="#{key}"><span aria-hidden="true">{index}</span>{esc(title)}</a>'
        for key, (index, _, title) in SECTION_INFO.items()
    ) + '</nav>'


def presidential(country, code):
    name=country['name']
    records=sorted(country['pres'], key=lambda e:(e['year'],str(e.get('date',''))), reverse=True)
    if not records:
        return empty_section('presidential', 'No direct presidential results are available here. This does not mean no elections took place.')
    history=[]
    series=[[],[]]
    details=[]
    for i,e in enumerate(records):
        pkey=esc(pres_key(e))
        first=e.get('first') or []
        run=e.get('run') or []
        year=e['year']
        first_desc=f'{esc(first[0][0])} · {number(first[0][2])}%' if first else '—'
        run_desc=f'{esc(run[0][0])} · {number(run[0][2])}%' if run else '—'
        history.append(f'<tr><th scope="row">{esc(date_label(e.get("date"),year))}</th><td>{first_desc}</td><td>{run_desc}</td></tr>')
        series[0].append((year,first[0][2] if first else None))
        series[1].append((year,run[0][2] if run else None))
        def round_details(label,candidates,iso):
            if not candidates:
                return ''
            rows=[]
            for c in candidates:
                who,party,share,votes=c[:4]
                rows.append(f'<tr><th scope="row">{esc(who)}</th><td>{esc(party or "—")}</td><td>{number(share,2)}%</td><td>{number(votes,0) if isinstance(votes,(float,int)) else "—"}</td></tr>')
            return f'<div class="ct-round"><h4>{esc(label)} · {esc(date_label(iso,year))}</h4><div class="ct-table-wrap"><table><thead><tr><th scope="col">Candidate</th><th scope="col">Party or coalition</th><th scope="col">Share</th><th scope="col">Votes</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></div>'
        note=f'<p class="ct-note">{esc(e["note"])}</p>' if e.get('note') else ''
        details.append(f'<details class="ct-result" data-contest="{pkey}"{" open" if i==0 else ""}><summary>Candidate results · {esc(date_label(e.get("date"),year))}</summary>{round_details("First round",first,e.get("date"))}{round_details("Runoff",run,e.get("runDate"))}{note}<p class="ct-note">Source: {source_link(e.get("src"),e.get("url"))}. <a href="{href_map(code,"pres",pres_key(e),"#details")}">Open this election on the regional map</a>.</p></details>')
    plot=chart([list(reversed(line)) for line in series],'Share won by the leading candidate in each archived contest, not a continuous party trend. Runoffs are shown only where recorded.',['First-round leader','Runoff leader'])
    return f'''{section_open("presidential", f"{len(records)} contests · {span(records)}")}
{plot}<details class="ct-data"><summary>Election history table</summary><div class="ct-table-wrap"><table><thead><tr><th scope="col">First-round date</th><th scope="col">First-round leader</th><th scope="col">Runoff leader</th></tr></thead><tbody>{"".join(history)}</tbody></table></div></details>
<div class="ct-specific"><label class="ct-control" hidden>Inspect a contest<select name="pres" data-country-control="pres">{date_options(records,True)}</select></label><div id="ct-contest-results">{"".join(details)}</div></div></section>'''

def bloc_section(records):
    records=sorted(records,key=lambda e:e['year'])
    if not records:
        return empty_section('blocs', 'The archive has no comparable ideological vote-share series for this country.')
    plot=chart([[(e['year'],e['shares'][i]) for e in records] for i in range(len(BLOCS))],'Historical first-round presidential vote shares by coded bloc. Recent candidates are not assigned an ideology without source data.',BLOCS)
    rows=''.join(f'<tr><th scope="row">{e["year"]}</th>'+''.join(f'<td>{number(v)}%</td>' for v in e['shares'])+'</tr>' for e in reversed(records))
    headings=''.join(f'<th scope="col">{b}</th>' for b in BLOCS)
    return f'{section_open("blocs", span(records))}{plot}<details class="ct-data"><summary>Bloc vote-share table</summary><div class="ct-table-wrap"><table><thead><tr><th scope="col">Year</th>{headings}</tr></thead><tbody>{rows}</tbody></table></div></details><p class="ct-note">Source: {source_link("Baker & Greene")}. “Uncoded” is shown separately, not assigned to a bloc.</p></section>'

def constituency_margin(pairs):
    if len(pairs)<2:
        return None
    total=sum(row[1] for row in pairs)
    return (pairs[0][1]-pairs[1][1])*100/total if total else None

def leg_summary(e, shapes):
    tally=Counter(a[4] for a in e['areas'] if len(a)>4 and type(a[4]) is int and 0<=a[4]<len(shapes))
    points=[]
    for i,a in enumerate(e['areas']):
        if len(a)>4 and tally.get(a[4])==1:
            pairs=a[2]
            if not pairs:
                continue
            total=sum(row[1] for row in pairs)
            if not total:
                continue
            gap=constituency_margin(pairs)
            name=e['parties'].get(pairs[0][0],pairs[0][0])
            lead='Tied lead' if gap==0 else name
            points.append([a[4],i,a[0],lead,gap])
    return points

def district_section(code, country, shapes):
    name=country['name']
    records=sorted(country['leg'],key=lambda e:(e['year'], e.get('month') or 0,e['id']),reverse=True)
    if not records:
        return empty_section('districts', 'The archive does not contain lower-house constituency returns for this country.')
    summaries={str(e['id']):{'year':e['year'],'count':len(e['areas']),'omitted':e.get('omitted') or 0,
                'points':leg_summary(e,shapes)} for e in records}
    raw=json.dumps(summaries,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    latest=records[0]
    current=summaries[str(latest['id'])]
    medians={}
    for e in records:
        observations=[v for area in e['areas'] if (v:=constituency_margin(area[2])) is not None]
        medians[e['id']]=median(observations) if observations else None
    distinct={}
    for e in records:
        distinct.setdefault(e['year'],medians[e['id']])
    historical=chart([sorted(distinct.items())],'Median local top-two margin across districts in each archive year. Coverage and districts can change; this is not a national result. If more than one record exists in a year, the chart uses the most recent record in that year.',['Median district margin'],' pp')
    def median_label(e):
        v=medians[e['id']]
        return '—' if v is None else f'{number(v)} pp'

    geo=''
    if shapes:
        xs,ys,x2s,y2s=zip(*(s['box'] for s in shapes))
        x,y,x2,y2=min(xs),min(ys),max(x2s),max(y2s)
        view=f'{x-4:.2f} {y-4:.2f} {x2-x+8:.2f} {y2-y+8:.2f}'
        marks=''.join(f'<path data-shape="{i}" d="{esc(g["d"])}" fill-rule="evenodd"/>' for i,g in enumerate(shapes))
        geo=f'<figure class="ct-district-map" id="ct-district-map" hidden><svg viewBox="{view}" role="img" aria-label="{esc(name)} legislative boundaries, shaded by the margin between the leading two parties. Read the chart values in the mapped districts table.">{marks}</svg><figcaption><ul><li><i class="ct-map-swatch ct-gap-1"></i>Under 10 pp</li><li><i class="ct-map-swatch ct-gap-2"></i>10 to &lt; 25 pp</li><li><i class="ct-map-swatch ct-gap-3"></i>25 pp or more</li><li><i class="ct-map-swatch"></i>No comparable margin</li></ul>One-to-one boundary matches only; current reference geography may differ from historical districts.</figcaption></figure>'
    table_rows=''.join(f'<tr><th scope="row">{e["year"]}</th><td>{len(e["areas"]):,}</td><td>{len(summaries[str(e["id"])]["points"]):,}</td><td>{median_label(e)}</td><td><a href="{href_map(code,"leg",e["id"],"#districts")}">Explore {e["year"]} results</a></td></tr>' for e in records)
    special='<p><a href="/argentina">Argentina 2023: presidential results by province</a> · <a href="/local">Sections and voting circuits</a></p>' if code=='ARG' else ''
    header=section_open('districts', f'{len(records)} archive records · {span(records)}', f' data-country="{esc(code)}" data-default-leg="{latest["id"]}"')
    return f'''{header}
<p>Explore lower-house results by constituency, not seat counts or presidential district totals. Mapped records are only those that match the reference boundaries.</p>{special}
<div class="ct-district-controls"><label class="ct-control" hidden>Inspect a legislative election<select name="leg" data-country-control="leg">{date_options(records)}</select></label><a id="ct-district-link" href="{href_map(code,"leg",latest["id"],"#districts")}">Explore all constituencies for {latest['year']}</a></div>
<p id="ct-district-status" class="ct-note"><span>{len(current['points']):,} mapped of {current['count']:,} archived constituencies.</span> The archive links below include unmapped constituencies.</p>
{geo}<details id="ct-mapped-data" class="ct-data" hidden><summary>Mapped districts table</summary><div class="ct-table-wrap"><table><thead><tr><th scope="col">Constituency</th><th scope="col">Local leader</th><th scope="col">Top-two margin</th></tr></thead><tbody id="ct-mapped-rows"></tbody></table></div></details>
{historical}<details class="ct-data"><summary>All legislative archive years</summary><div class="ct-table-wrap"><table><thead><tr><th scope="col">Year</th><th scope="col">Archived districts</th><th scope="col">Matched boundaries</th><th scope="col">Median margin</th><th scope="col">Results</th></tr></thead><tbody>{table_rows}</tbody></table></div></details>
<p class="ct-note">Source: {source_link("CLEA")}. Each margin uses reported party/list tallies in the selected constituency. It is not a national vote share or a seat result.</p><script type="application/json" id="ct-district-json">{raw}</script></section>'''

def country_context(data):
    stats=[]
    for key,(name,unit) in CONTEXT.items():
        v=data.get(key)
        if not isinstance(v,(float,int)) or not math.isfinite(v):
            continue
        val=('$'+number(v,0)+' USD') if unit=='usd' else number(v,0) if unit=='people' else number(v)+'%'
        label=name + (' · share of expense' if key=='GC.XPN.TRFT.ZS' else '')
        stats.append(f'<div><dt>{esc(label)}</dt><dd>{esc(val)}</dd></div>')
    if not stats:
        return empty_section('country-context', 'No comparable national indicators are available in this Atlas snapshot.')
    return section_open("country-context", "2023 snapshot") + '<dl class="ct-context">' + ''.join(stats) + '</dl><p class="ct-note">Source: <a href="https://databank.worldbank.org/source/world-development-indicators">World Bank World Development Indicators</a>. These indicators describe national context, not individual voters or policy effects.</p></section>'

def national_csv(country):
    out=io.StringIO()
    writer=csv.writer(out,lineterminator='\n')
    writer.writerow(['election_year','round','date','candidate','party','share_percent','votes','source'])
    for e in sorted(country['pres'],key=lambda e:e['year'],reverse=True):
        for key,r,d in [('first','first round',e.get('date')),('run','runoff',e.get('runDate'))]:
            for candidate in e.get(key,[]):
                # External labels are text, never spreadsheet formulas.
                bits=[("'"+v if v.lstrip()[:1] in ('=','+','-','@') else v) if isinstance(v,str) else v for v in candidate[:4]]
                writer.writerow([e['year'],r,d,*bits,e.get('src')])
    return out.getvalue()

def profile(code,country,context,shapes):
    name=country['name']
    region,region_label=REGION[country['region']]
    note=f'<p class="ct-alert">{esc(country["note"])}'+(f' <a href="{esc(valid_url(country.get("url")))}">Coverage source</a>' if valid_url(country.get('url')) else '')+'</p>' if country.get('note') else ''
    argentina='<a href="/argentina">Argentina 2023 detailed atlas</a>' if code=='ARG' else ''
    csv_url=f'<a download href="/countries/{code.lower()}-presidential.csv">Download presidential CSV</a>' if country['pres'] else ''
    scopes=[('presidential',country['pres']),('blocs',country['blocs']),('districts',country['leg'])]
    scope_cards=''.join(
        f'<div><dt><a href="#{key}">{esc(SECTION_INFO[key][2])}</a></dt>'
        f'<dd data-coverage="{"available" if records else "missing"}">{span(records) if records else "Not in archive"}</dd></div>'
        for key,records in scopes
    )
    return f'''<div class="ct-page"><nav aria-label="Breadcrumb" class="ct-breadcrumb"><a href="/countries">All countries</a><span aria-hidden="true">›</span><a href="/countries#{region}">{esc(region_label)}</a><span aria-hidden="true">›</span><span aria-current="page">{esc(name)}</span></nav>
<header class="ct-hero"><p class="eyebrow">Country election profile · {esc(region_label)}</p><h1>{esc(name)}</h1><p class="sub">Explore the elections and voting patterns available in the archive over time.</p>
<div class="ct-actions"><a class="ct-primary" href="{href_map(code)}">Show {esc(name)} on map</a>{argentina}{csv_url}</div>
<dl class="ct-scope">{scope_cards}</dl>{note}
<p class="ct-note">Coverage dates indicate the records in this Atlas, not all elections held. Older results may have different denominators or geographic coverage. <a href="/regional#atlas-methodology">Read the methodology</a>.</p></header>
{page_nav()}
{presidential(country,code)}{bloc_section(country['blocs'])}{district_section(code,country,shapes)}{country_context(context)}</div>'''

def directory(votes):
    body=[]
    for region,(slug,label) in REGION.items():
        group=sorted(((k,c) for k,c in votes.items() if c['region']==region),key=lambda x:x[1]['name'])
        cards=[]
        for k,c in group:
            slots=[e['year'] for name in ('pres','leg','blocs') for e in c[name]]
            detail=f'Archive through {max(slots)}' if slots else 'Context and coverage notes'
            cards.append(f'<li data-country="{k.lower()}"><a href="/countries/{k.lower()}"><strong>{esc(c["name"])}</strong><span>{esc(detail)}</span><b aria-hidden="true">›</b></a></li>')
        body.append(f'<section class="ct-directory-region" id="{slug}"><header><h2>{esc(label)}</h2><span>{len(group)} {"country" if len(group)==1 else "countries"}</span></header><ul>{"".join(cards)}</ul></section>')
    return f'<div class="ct-page ct-directory"><header class="ct-hero"><p class="eyebrow">Latin America Election Atlas</p><h1>Country profiles</h1><p class="sub">Explore election history, voting trends and local results across all {len(votes)} countries in the Atlas.</p><p class="ct-map-return"><a href="/regional">Browse on the map <span aria-hidden="true">›</span></a></p></header><div class="ct-find" hidden><label for="ct-country-query">Find a country</label><input type="search" id="ct-country-query" placeholder="e.g. Brazil" autocomplete="off" spellcheck="false"><p id="ct-country-count" role="status">{len(votes)} countries</p><p id="ct-country-empty" hidden>No matches. Try a shorter name.</p></div><nav class="ct-jump" aria-label="Select a region">'+''.join(f'<a href="#{slug}">{esc(label)}</a>' for slug,label in REGION.values())+'</nav>'+''.join(body)+'</div>'

def build_country_pages(target, overlay, page_shell):
    votes=json.loads((overlay/'regional-votes.json').read_text())
    contexts=json.loads((overlay/'regional-context.json').read_text())
    geography=json.loads((overlay/'regional-geography.json').read_text())['districts']
    folder=target/'countries'
    folder.mkdir(exist_ok=True)
    assets='<link rel="stylesheet" href="/countries/profile-v2.css"><script defer src="/countries/profile-v1.js"></script>'
    (target/'countries.html').write_text(page_shell('Country profiles','Explore election history and voting trends across the countries in the Atlas.','/countries',directory(votes),assets+'<link rel="stylesheet" href="/countries/directory-v1.css"><script defer src="/countries/directory-v1.js"></script>'))
    for code,row in votes.items():
        if not re.fullmatch('[A-Z]{3}',code):
            raise ValueError(f'Invalid country code: {code}')
        slug=code.lower()
        (folder/f'{slug}.html').write_text(page_shell(f'{row["name"]} election history',f'Explore {row["name"]} election results, voting trends, constituency coverage and national context.',f'/countries/{slug}',profile(code,row,contexts.get(code,{}),geography.get(code,[])),assets))
        if row['pres']:
            (folder/f'{slug}-presidential.csv').write_text(national_csv(row))
    for file in ('profile-v1.css','profile-v2.css','profile-v1.js','directory-v1.css','directory-v1.js'):
        shutil.copyfile(Path(__file__).parent/file, folder/file)
