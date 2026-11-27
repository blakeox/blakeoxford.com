"""Build a staged Latin America UI/data patch over the existing atlas design.

Use --output to keep the prepared release separate from styled and production.
The normal build requires the new country data; --preview-no-data is local only.
"""
from argparse import ArgumentParser
import json
from pathlib import Path
import re

from geography import ADDITIONS, REGION_NAMES, SCOPE, build as expand_geo

HERE = Path(__file__).resolve().parent
ATLAS = HERE.parent
SOURCE = ATLAS.parent / 'argentina-election' / 'raw/ne-countries.geojson'
PAGES = ['regional.html', 'index.html', 'local.html', 'context.html', 'south-america.html']
ARTIFACTS = PAGES + ['regional.js','regional.css','regional-geography.json','regional-context.json','regional-votes.json']

def changes(text, pairs):
    for old, new in pairs:
        if text.count(old) != 1:
            raise ValueError(f'Patch anchor must occur once: {old[:100]!r}; got {text.count(old)}')
        text = text.replace(old, new, 1)
    return text

def readj(file):
    return json.loads(file.read_text())

def writej(file, data):
    file.write_text(json.dumps(data, ensure_ascii=False,separators=(',', ':'),allow_nan=False)+'\n')

def map_data(base, data, out, geosource, preview):
    votes = readj(base/'regional-votes.json')
    context = readj(base/'regional-context.json')
    if set(votes) & set(ADDITIONS):
        raise ValueError('Build from the original 19-country styled base; refuse to replace existing country records.')
    if preview:
        extra = {c: {'name': n, 'region': r, 'blocs': [], 'leg': [], 'pres': []}
                 for c,(n,r) in ADDITIONS.items()}
        cx = {}
    else:
        extra, cx = readj(data/'votes-extra.json'), readj(data/'context-extra.json')
    assert extra.keys() == ADDITIONS.keys(), 'Missing a requested country'
    assert set(cx) <= set(ADDITIONS), 'Additional context must only contain the four new country codes'
    for c, (name, region) in ADDITIONS.items():
        row=extra[c]
        assert row['name'] == name and row['region'] == region, (c,row['name'],row['region'])
        assert all(isinstance(row[k], list) for k in ('blocs','leg','pres')), c
        for election in row['leg']:
            for area in election['areas']:
                assert len(area) in (4,5) and (len(area)==4 or area[4] is None), (c,area)
    votes.update(extra)
    assert len(votes) == 23
    context.update(cx)
    expanded = expand_geo(readj(base/'regional-geography.json'), votes, geosource)
    assert sum(len(v['pres'])+len(v['leg'])+len(v['blocs']) for v in extra.values()) or preview, 'No new elections'
    writej(out/'regional-votes.json', votes)
    writej(out/'regional-context.json', context)
    writej(out/'regional-geography.json', expanded)
    return votes

def html(base, out):
    for filename in PAGES:
        content = (base/filename).read_text()
        content = changes(content, [
            ('<span class="bo-brand-desc">Election atlas</span>', '<span class="bo-brand-desc">Latin America Election Atlas</span>'),
            ('· Election Atlas</div>', '· Latin America Election Atlas</div>'),
            ('>Voting blocs</a>', '>Latin America</a>'),
        ])
        if filename=='regional.html':
            opts=[('both','All regions')]+[(r,'Selected Caribbean' if r=='Caribbean' else r) for r in REGION_NAMES]
            content = changes(content, [
                ('<title>Election Atlas · South &amp; Central America</title>', '<title>Latin America Election Atlas · Voting and country context</title>'),
                ('Explore voting blocs over time, election returns and constituency strongholds across South and Central America.',
                 'Compare elections, population and economic context across 23 countries in South America, Central America, Mexico and the selected Caribbean.'),
                ('<h1>South &amp; Central America</h1><p class="sub">Compare voting across 19 countries, then drill into national and local results.</p>',
                 '<h1>Latin America Election Atlas</h1><p class="sub">Compare voting across 23 countries in South America, Central America, Mexico and the selected Caribbean, then drill into available national and local results.</p>'),
                ('<option value="both">Both regions</option><option>South America</option><option>Central America</option>',
                 ''.join(f'<option value="{r}">{label}</option>' for r,label in opts)),
                ('The 12 sovereign countries of South America and seven of Central America. Mexico and territories are not included in the country comparisons.',
                 'The atlas covers the 12 sovereign countries of South America, all seven Central American countries (including Belize), Mexico, and three selected Caribbean countries: Cuba, the Dominican Republic and Haiti. This is an explicit geographic scope, not a strict linguistic definition of Latin America. Other Caribbean countries and territories are not included in comparisons; some are shown as unselectable context. Missing results are not zero.'),
                ('Argentina 2023 from <a href="https://www.electoral.gov.ar/nuevo/paginas/btn/elecc2023.php">Cámara Nacional Electoral</a>.',
                 'Argentina 2023 from <a href="https://www.electoral.gov.ar/nuevo/paginas/btn/elecc2023.php">Cámara Nacional Electoral</a>; other country-specific sources and coverage notes are linked on the individual records where available.'),
            ])
        (out/filename).write_text(content)

def javascript(base, out):
    text=(base/'regional.js').read_text()
    text=changes(text,[
        ("const regionKey={'both':'','South America':'south','Central America':'central'};\nconst regionName={south:'South America',central:'Central America'};",
         """const regions = [
 ['south','South America','South America'],
 ['central','Central America','Central America'],
 ['mexico','Mexico','Mexico'],
 ['caribbean','Caribbean','Selected Caribbean'],
];
const regionKey=Object.fromEntries([['both',''],...regions.map(([short,name])=>[name,short])]);
const regionName=Object.fromEntries(regions.map(([short,name])=>[short,name]));
const displayRegion = r => regions.find(x=>x[1]===r)?.[2] || 'All regions';
const sourceLink = (name, url) => {
 const label=esc(name||'Source');
 if(typeof url!=='string')return label;
 try {
  const checked=new URL(url);
  return checked.protocol==='https:' && !checked.username && !checked.password ? '<a href="'+esc(checked.href)+'">'+label+'</a>' : label;
 } catch (_) { return label; }
};"""),
        (""" const level=r!=='both'?'<button type="button" data-region="'+esc(r)+'">'+esc(r)+'</button>':'';""",
         """ const level=r!=='both'&&r!=='Mexico'?'<button type="button" data-region="'+esc(r)+'">'+esc(displayRegion(r))+'</button>':'';"""),
        (""" if(country && region!=='both' && db[country].region!==region) region=db[country].region;
 if(country && !q.has('region')) region=db[country].region;""",
         """ if(country && region!=='both' && db[country].region!==region) region=db[country].region;
 if(country && !q.has('region')) region=db[country].region;
 if(!country && region==='Mexico') country='MEX';"""),
        ("""const def='<defs><pattern id="missing" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eef1f5"/><path d="M0 0L0 6" stroke="#aebac9" stroke-width="2"/></pattern></defs>';
function map(){
 const keys=new Set(countries()), frame=region==='Central America'?'0 4 166 100':region==='South America'?'89 48 370 520':'3 7 460 560';
 $('map').setAttribute('viewBox',frame);
 $('map').classList.toggle('map-central',region==='Central America');""",
         """const def='<defs><pattern id="missing" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eef1f5"/><path d="M0 0L0 6" stroke="#aebac9" stroke-width="2"/></pattern></defs>';
const crowd=new Set(['BLZ','GTM','HND','SLV','NIC','CRI','PAN','GUY','SUR','HTI','DOM']);
const physicalFor={
 both:new Set(['Andes','Amazon Basin','Pampas','Patagonia','Guiana Highlands','Caribbean Sea']),
 'South America':new Set(['Andes','Amazon Basin','Pampas','Patagonia','Guiana Highlands']),
 'Central America':new Set(['Central American Cordillera']),
 'Mexico':new Set(['Sierra Madre Occidental','Sierra Madre Oriental']),
 'Caribbean':new Set(['Caribbean Sea']),
};
function map(){
 const keys=new Set(countries()), frame=geo.frames?.[region]||geo.frames?.both||'-206 -124 675 686';
 $('map').setAttribute('viewBox',frame);
 $('map').classList.toggle('map-central',region==='Central America');
 $('map').classList.toggle('map-overview',region==='both');
 $('map').classList.toggle('map-caribbean',region==='Caribbean');
 $('map').classList.toggle('map-mexico',region==='Mexico');
 $('map').setAttribute('aria-label','Select a country on the map: '+displayRegion(region));"""),
        ("geo.terrain.filter(x=>region==='both'||(region==='Central America'?x[0].startsWith('Central'):!x[0].startsWith('Central')))",
         "geo.terrain.filter(x=>physicalFor[region]?.has(x[0]))"),
        (""" const g=geo.countries[k];return g.xy?'<text class="region-label" x="'+g.xy[0]+'" y="'+g.xy[1]+'" text-anchor="middle">'+esc(region==='both'&&['BLZ','GTM','HND','SLV','NIC','CRI','PAN','GUY','SUR'].includes(k)?k:db[k].name)+'</text>':'';""",
         """ const g=geo.countries[k];return g?.xy?'<text class="region-label" x="'+g.xy[0]+'" y="'+g.xy[1]+'" text-anchor="middle">'+esc(region==='both'&&crowd.has(k)?k:region==='Caribbean'&&k==='DOM'?'Dom. Republic':db[k].name)+'</text>':'';"""),
        ("""  const title=region==='both'?'Choose a region or country':region;
  $('details').innerHTML='<h2>'+title+'</h2><p class="regional-note">Select a country on the map or from the country list to see its election history and available local results.</p>'+(region==='both'?'<div class="bo-drill-actions"><button data-region="South America" type="button">South America · 12 countries</button><button data-region="Central America" type="button">Central America · 7 countries</button></div>':'')+'<p class="regional-mini muted">Local coverage varies by country. City and voting-circuit returns are available in the Argentina 2023 atlas.</p>';""",
         """  const title=region==='both'?'Choose a region or country':displayRegion(region);
  const regionButtons=regions.map(([key,name,label])=>{
   const n=sorted.filter(k=>db[k].region===name).length;
   return '<button data-region="'+esc(name)+'" type="button">'+esc(label)+' · '+n+' '+(n===1?'country':'countries')+'</button>';
  }).join('');
  $('details').innerHTML='<h2>'+esc(title)+'</h2><p class="regional-note">Select a country on the map or from the country list to see its election history and available local results.</p>'+(region==='both'?'<div class="bo-drill-actions">'+regionButtons+'</div>':'')+'<p class="regional-mini muted">Local coverage varies by country. City and voting-circuit returns are available in the Argentina 2023 atlas.</p>';"""),
        (""" let h='<p class="eyebrow">'+esc(d.region)+'</p><h2>'+esc(d.name)+'</h2>';
 if(!e){const why=mode==='blocs'?'No comparable ideology scores in this dataset.':mode==='pres'?'No separate presidential results here. Check legislative strongholds for parliamentary systems.':'No constituency records available.';""",
         """ let h='<p class="eyebrow">'+esc(displayRegion(d.region))+'</p><h2>'+esc(d.name)+'</h2>';
 if(d.note)h+='<p class="regional-note">'+esc(d.note)+(d.url?' '+sourceLink('Source',d.url):'')+'</p>';
 if(!e){const why=mode==='blocs'?'No comparable ideology scores in this dataset.':mode==='pres'?'No direct presidential vote returns are available here.':'No comparable local party vote totals are available here.';"""),
        ("""h+='<p class="regional-mini muted">National candidate vote shares · '+esc(e.src)+'</p>';""",
         """if(e.note)h+='<p class="regional-note">'+esc(e.note)+'</p>';
   h+='<p class="regional-mini muted">National candidate vote shares · '+sourceLink(e.src,e.url)+'</p>';
   if(e.first.length>12)h+='<details><summary>Show all '+e.first.length+' first-round entries</summary>'+bars(e.first.map(x=>pRow(...x)),e.first.length)+'</details>';"""),
        ("""h+='<p class="regional-mini muted">Constituencies with usable party tallies. They vary in size; a local lead does not imply a seat win.</p><a href="#districts">Explore constituency results</a>';""",
         """h+='<p class="regional-mini muted">Constituencies with usable party tallies. They vary in size; a local lead does not imply a seat win.'+(e.src?' '+sourceLink(e.src,e.url)+'.':'')+'</p><a href="#districts">Explore constituency results</a>';"""),
        ("""'National presidential returns available here through 2025, depending on country.':'Reported lower-house constituency tallies available here through 2024, depending on country.'""",
         """'National presidential return coverage varies by country.':'Reported lower-house constituency coverage varies by country.'"""),
        ("function setRegion(value){region=value;country='';resetSelection();writeState(true);render();}",
         "function setRegion(value){region=value;country=value==='Mexico'?'MEX':'';resetSelection();writeState(true);render();}"),
        ("l.download='regional-voting-view.csv';","l.download='latin-america-voting-view.csv';"),
    ])
    (out/'regional.js').write_text(text)
    (out/'regional.css').write_text((base/'regional.css').read_text()+"""
/* The overview is intentionally sparse; the region filter enlarges small states. */
.map-overview .region-label{font-size:8px;stroke-width:2.2px}
.map-caribbean .region-label{font-size:5px;stroke-width:1.35px}
.map-caribbean .terrain-label{font-size:5px;stroke-width:1.3px}
.map-mexico .region-label{font-size:9px;stroke-width:2.4px}
.map-mexico .terrain-label{font-size:5px;stroke-width:1.5px}
@media(max-width:760px){.regional-map svg.map-caribbean,.regional-map svg.map-mexico{height:clamp(230px,56vw,355px)}.map-overview .region-label{font-size:10px}}
""")

def main():
    p=ArgumentParser(description=__doc__)
    p.add_argument('--base', type=Path, default=ATLAS/'styled')
    p.add_argument('--data', type=Path, default=ATLAS/'latam-data')
    p.add_argument('--geography', type=Path, default=SOURCE)
    p.add_argument('--output', type=Path, default=HERE/'output')
    p.add_argument('--preview-no-data', action='store_true')
    args=p.parse_args()
    assert args.output.resolve()!=args.base.resolve(), 'Keep output separate from base and production'
    args.output.mkdir(parents=True,exist_ok=True)
    votes=map_data(args.base,args.data,args.output,args.geography,args.preview_no_data)
    html(args.base,args.output)
    javascript(args.base,args.output)
    print(f'Built {len(ARTIFACTS)} patch assets in {args.output} for {len(votes)} countries'
          +(' (placeholder elections in preview)' if args.preview_no_data else '')+'; '+SCOPE)
if __name__=='__main__':
    main()
