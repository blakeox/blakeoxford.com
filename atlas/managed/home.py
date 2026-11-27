"""Build the homepage from the same archive and geographies as the explorer."""
from collections import Counter
from html import escape
from recent import collect, display

GROUPS = [
    ('South America','south','South America','sa'),
    ('Central America','central','Central America','ca'),
    ('Mexico','mexico','Mexico','mx'),
    ('Caribbean','caribbean','Selected Caribbean','cb'),
]
ARROW='<span class="atlas-arrow" aria-hidden="true">→</span>'

def coverage_map(db, geo):
    classes = {name: key for name,_,_,key in GROUPS}
    x,y,w,h = map(float,geo['frames']['both'].split())
    x -= 170; w += 340
    bounds = f'{x:g} {y:g} {w:g} {h:g}'
    mesh = []
    for lon in range(-130,-19,10):
        pos=(lon+94)*7.4
        if x<pos<x+w:
            mesh.append(f'<path d="M{pos:g},{y:g}v{h:g}"/>')
    for lat in range(-50,31,10):
        pos=(20-lat)*7.35
        if y<pos<y+h:
            mesh.append(f'<path d="M{x:g},{pos:g}h{w:g}"/>')
    paths=[]
    for code,g in geo['countries'].items():
        c=classes[db[code]['region']] if code in db else 'outside'
        paths.append(f'<path class="{c}" d="{escape(g["d"], quote=True)}"/>')
    labels = [
        ('MEXICO',-210,-15,'end',-72,-21),
        ('CENTRAL AMERICA',-53,122,'end',59,56),
        ('CARIBBEAN',238,-24,'start',180,1),
        ('SOUTH AMERICA',464,308,'start',394,293),
    ]
    text=[]
    for title,lx,ly,anchor,px,py in labels:
        ex=lx+10 if anchor=='end' else lx-10
        text.append(f'<path class="home-leader" d="M{px},{py}L{ex},{ly-3}"/><text x="{lx}" y="{ly}" text-anchor="{anchor}">{title}</text>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{bounds}" class="home-geo" role="img" aria-labelledby="home-geo-title home-geo-desc">
<title id="home-geo-title">Atlas geographic coverage</title><desc id="home-geo-desc">Country boundaries in Latin America, colored by geographic group, not election results. The next section lists the covered regions.</desc>
<g class="home-gridlines">{"".join(mesh)}</g><g class="home-shapes">{"".join(paths)}</g>
<g class="home-map-labels">{"".join(text)}<g class="home-ocean"><text x="-10" y="250" text-anchor="middle">PACIFIC</text><text x="495" y="130" text-anchor="middle">ATLANTIC</text></g></g></svg>'''

def content(db, geo):
    group_sizes=Counter(row['region'] for row in db.values())
    regions=[]; legend=[]
    for key, slug, label, cls in GROUPS:
        n=group_sizes[key]; unit='country' if n==1 else 'countries'
        regions.append(f'<li><a href="/regional?region={slug}"><span><strong>{label}</strong><small>{n} {unit}</small></span>{ARROW}</a></li>')
        legend.append(f'<li><i class="{cls}"></i>{label} ({n})</li>')
    rows=[]
    for row in collect(db)[:3]:
        stamp = ('Runoff · '+display(row['runoff']) if row['runoff'] else
                 'First round · '+display(row['first']) if row['first'] else
                 'Presidential archive' if row['kind']=='pres' else 'Lower-house archive')
        anchor='details' if row['kind']=='pres' else 'districts'
        rows.append(f'<li><a href="{row["href"]}#{anchor}"><strong>{escape(row["country"])} {row["year"]}</strong><span>{escape(stamp)}</span>{ARROW}</a></li>')
    return f'''<div class="atlas-home">
<section class="home-hero" aria-labelledby="home-title">
  <div class="home-intro">
    <h1 id="home-title">The political geography of Latin America</h1>
    <p>Explore how countries vote and how results change over time, from regional trends to local returns where available.</p>
    <div class="home-actions"><a class="home-primary" href="/regional">Explore the map</a><a class="home-secondary" href="/countries">Browse countries</a><a class="home-tertiary" href="/elections">Recent elections</a></div>
    <ul class="home-facts" aria-label="Atlas at a glance"><li><strong>{len(db)}</strong> countries</li><li><strong>{len(GROUPS)}</strong> geographic groups</li></ul>
  </div>
  <figure class="home-map">
    {coverage_map(db, geo)}
    <figcaption><strong>Country coverage</strong><ul>{"".join(legend)}</ul></figcaption>
  </figure>
</section>
<section class="home-regions" aria-labelledby="home-regions-title">
  <div class="home-section-heading"><h2 id="home-regions-title">Browse by region</h2><a href="/countries">All countries {ARROW}</a></div>
  <ul>{"".join(regions)}</ul>
</section>
<div class="home-lower">
  <section class="home-election-list" aria-labelledby="home-recent-title">
    <h2 id="home-recent-title">Recent elections</h2>
    <p>Newest results in the Atlas, not a live election feed.</p>
    <ul>{"".join(rows)}</ul>
    <a class="home-text-link" href="/elections">View the election archive {ARROW}</a>
  </section>
  <section class="home-deeper" aria-labelledby="home-deeper-title">
    <h2 id="home-deeper-title">Go deeper</h2>
    <ul><li><a href="/countries"><span>Country profiles &amp; voting history</span>{ARROW}</a></li>
    <li><a href="/argentina"><span>Argentina 2023: results by province and circuit</span>{ARROW}</a></li>
    <li><a href="/south-america"><span>South America population and economy</span>{ARROW}</a></li>
    <li><a href="/regional#atlas-methodology"><span>Sources, data &amp; methodology</span>{ARROW}</a></li>
    <li><a href="/connect"><span>Connect AI to Atlas data</span>{ARROW}</a></li></ul>
  </section>
</div></div>'''
