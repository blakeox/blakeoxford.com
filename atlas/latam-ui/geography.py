"""Expand the Natural Earth country map without touching the existing ADM1 joins."""
import json
import math
from pathlib import Path

ADDITIONS = {'MEX': ('Mexico', 'Mexico'), 'CUB': ('Cuba', 'Caribbean'),
             'DOM': ('Dominican Republic', 'Caribbean'), 'HTI': ('Haiti', 'Caribbean')}
LABELS = {'MEX': (-103, 24), 'CUB': (-80.2, 22.4), 'HTI': (-73.05, 19.0), 'DOM': (-70.2, 19.0)}
CONTEXT = {'USA', 'BHS', 'TCA', 'JAM', 'PRI', 'TTO', 'ATG', 'ABW', 'AIA', 'VGB', 'VIR',
           'BLM', 'BRB', 'CUW', 'DMA', 'GLP', 'GRD', 'KNA', 'LCA', 'MAF', 'MTQ',
           'MSR', 'SXM', 'VCT', 'BES', 'GUF', 'FLK'}
REGION_NAMES = ('South America', 'Central America', 'Mexico', 'Caribbean')
SCOPE = '23 countries: South America, Central America, Mexico, Cuba, the Dominican Republic and Haiti'

def project(coordinate):
    lon, lat = coordinate[:2]
    return ((lon + 94) * 7.4, (20 - lat) * 7.35)

def polygon_path(rings):
    result = []
    for ring in rings:
        locations = []
        for coordinate in ring:
            x, y = project(coordinate)
            candidate = (round(x, 1), round(y, 1))
            if not locations or candidate != locations[-1] and math.dist(candidate, locations[-1]) >= 0.24:
                locations.append(candidate)
        if len(set(locations)) >= 3:
            result.append('M' + 'L'.join(f'{x:g},{y:g}' for x, y in locations) + 'Z')
    return ''.join(result)

def frame(boxes, padding):
    x = min(b[0] for b in boxes) - padding
    y = min(b[1] for b in boxes) - padding
    result = (x, y, max(b[2] for b in boxes) + padding - x, max(b[3] for b in boxes) + padding - y)
    return ' '.join(f'{v:.1f}' for v in result)

def build(previous, votes, countries_source):
    new = dict(previous)
    borders = dict(previous['countries'])
    # Province joins use the same projection and indices as the original asset.
    # Neutral context is not selectable and does not affect framing.
    for f in json.loads(Path(countries_source).read_text())['features']:
        code = f['properties']['ADM0_A3']
        if code not in votes and code not in CONTEXT:
            continue
        geometry = f['geometry']
        polys = geometry['coordinates']
        if geometry['type'] == 'Polygon':
            polys = [polys]
        elif geometry['type'] != 'MultiPolygon':
            continue
        if code in ('USA', 'FLK', 'GUF') or code in CONTEXT:
            if code in borders and code in ('FLK', 'GUF'):
                continue
            # Include contiguous USA as unlabeled context; keep remote islands out.
            polys = [p for p in polys if (
                all(-130 < x < -55 and 17 < y < 51 for x,y,*_ in p[0]) if code == 'USA'
                else all(-83 < x < -55 and 8 < y < 29 for x,y,*_ in p[0]))]
        else:
            polys = [p for p in polys if all(-121 < x < -31 and -57 < y < 34 for x,y,*_ in p[0])]
        if not polys:
            continue
        path = ''.join(polygon_path(p) for p in polys)
        if not path:
            continue
        # Preserve click areas and cartographic choices already deployed for the original group.
        old = previous['countries'].get(code, {})
        if code not in ADDITIONS and 'd' in old:
            path = old['d']
        pts = [project(pt) for polygon in polys for pt in polygon[0]]
        box = [min(p[0] for p in pts), min(p[1] for p in pts),
               max(p[0] for p in pts), max(p[1] for p in pts)]
        xy = project(LABELS[code]) if code in LABELS else old.get('xy')
        borders[code] = {'d': path, 'xy': xy, 'box': [round(v, 2) for v in box]}
    new['countries'] = borders
    assert set(votes) <= set(borders), set(votes) - set(borders)
    new['frames'] = {region: frame([borders[code]['box'] for code, row in votes.items()
                                    if row['region'] == region], 9 if region != 'Caribbean' else 15)
                     for region in REGION_NAMES}
    new['frames']['both'] = frame([borders[code]['box'] for code in votes], 14)
    # Retain the original point labels, and add geographical context for Mexico and the Caribbean.
    new['terrain'] = [line for line in previous.get('terrain', []) if line[0] not in
                      ('Sierra Madre Occidental', 'Sierra Madre Oriental', 'Caribbean Sea')]
    new['terrain'] += [(label, *project(loc)) for label, loc in
                       [('Sierra Madre Occidental', (-106, 25)), ('Sierra Madre Oriental', (-99, 23)),
                        ('Caribbean Sea', (-76, 15.8))]]
    new['source'] = {'name': 'Natural Earth 1:50m (country outlines)', 'url': 'https://www.naturalearthdata.com/'}
    return new
