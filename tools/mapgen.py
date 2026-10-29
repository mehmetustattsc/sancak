"""Sancak harita üretici: Natural Earth (kamu malı) verisinden hex haritalar.
Çıktı: src/maps.json
"""
import json, math, sys, os, random
import numpy as np
from matplotlib.path import Path
NE = os.environ.get('NE', '/home/claude/nvkelso/natural-earth-vector/geojson/')
C = json.load(open(NE + 'ne_50m_admin_0_countries.geojson'))
K = math.cos(math.radians(42))

polys = []
for f in C['features']:
    a = f['properties']['ADM0_A3']
    g = f['geometry']; parts = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in parts:
        ring = np.array(poly[0])
        if ring[:, 0].max() < -15 or ring[:, 0].min() > 30 or ring[:, 1].max() < 33 or ring[:, 1].min() > 52: continue
        polys.append((a, Path(ring), ring[:, 0].min(), ring[:, 0].max(), ring[:, 1].min(), ring[:, 1].max()))

def country_at(lon, lat):
    for a, p, x0, x1, y0, y1 in polys:
        if x0 <= lon <= x1 and y0 <= lat <= y1 and p.contains_point((lon, lat)): return a
    return None

MT = [(5.8,44.0,7.5,46.5),(7,45.6,13.8,47.3),(-1.6,42.4,2.8,43.0),(-3.9,36.9,-2.6,37.3),(11,43.6,12.6,44.2),(12.6,42.0,14.6,43.0),(15.2,39.6,16.4,40.8),
      (15.4,43.4,18.6,44.8),(-6.6,42.8,-3.6,43.2),(-5.6,40.1,-3.2,40.8),(-3.6,38.2,-2.2,38.6),(-7.8,40.1,-7.2,40.5),(6.0,45.0,7.2,46.5),(16.5,42.6,19.5,43.4),
      (8.8,39.8,9.5,40.6),(8.7,41.8,9.3,42.4),(14.8,37.6,15.2,37.9),(9.8,44.1,10.6,44.5)]
def mountain(lon, lat): return any(a <= lon <= c and b <= lat <= d for a, b, c, d in MT)

def neigh(q, r):
    d = [(1,0),(-1,0),(0,-1),(1,-1),(0,1),(1,1)] if r & 1 else [(1,0),(-1,0),(-1,-1),(0,-1),(-1,1),(0,1)]
    return [(q+a, r+b) for a, b in d]
def cube(q, r):
    x = q - (r - (r & 1)) // 2; z = r; return x, -x - z, z
def hdist(a, b):
    ax, ay, az = cube(*a); bx, by, bz = cube(*b); return max(abs(ax-bx), abs(ay-by), abs(az-bz))

def grid(box, s, allowed):
    lon0, lat0, lon1, lat1 = box
    w = math.sqrt(3) * s; h = 1.5 * s
    cols = int((lon1 - lon0) * K / w) + 1; rows = int((lat1 - lat0) / h) + 1
    cells = {}
    for r in range(rows):
        for q in range(cols):
            x = q * w + (w / 2 if r % 2 else 0); y = r * h
            lon = lon0 + x / K; lat = lat1 - y
            pts = [(lon, lat)] + [(lon + 0.6*s*math.cos(math.radians(60*i+30))/K, lat + 0.6*s*math.sin(math.radians(60*i+30))) for i in range(6)]
            cs = [country_at(*p) for p in pts]
            land = [c for c in cs if c and c in allowed]
            if len(land) >= 3 or (cs[0] and cs[0] in allowed):
                best = max(set(land), key=land.count) if land else cs[0]
                cells[(q, r)] = {'land': 1, 'c': best, 'lon': lon, 'lat': lat}
            else:
                cells[(q, r)] = {'land': 0, 'lon': lon, 'lat': lat}
    return cells, cols, rows

def build(spec):
    allowed = set(spec['countries'])
    lo, hi = 0.15, 2.0
    for _ in range(26):
        s = (lo + hi) / 2; cells, cols, rows = grid(spec['box'], s, allowed)
        n = sum(1 for c in cells.values() if c['land'])
        if n > spec['target']: lo = s
        else: hi = s
    cells, cols, rows = grid(spec['box'], s, allowed)
    land = {k for k, c in cells.items() if c['land']}
    # drop tiny land components that are not wanted (or all islands on land-only maps)
    comp = {}; cid = 0
    for k in land:
        if k in comp: continue
        st = [k]; comp[k] = cid
        while st:
            u = st.pop()
            for v in neigh(*u):
                if v in land and v not in comp: comp[v] = cid; st.append(v)
        cid += 1
    size = {}
    for k in land: size[comp[k]] = size.get(comp[k], 0) + 1
    main = max(size, key=size.get)
    for k in list(land):
        if comp[k] != main and (not spec['navy'] or size[comp[k]] < 2):
            cells[k] = {'land': 0, 'lon': cells[k]['lon'], 'lat': cells[k]['lat']}; land.discard(k)
    # sea: keep only sea cells within 2 of land (navy) else within 1 (decor)
    keep = {}
    for k, c in cells.items():
        if c['land']: keep[k] = c
        elif any(hdist(k, l) <= (2 if spec['navy'] else 1) for l in land): keep[k] = c
    cells = keep
    # owners
    for k, c in cells.items():
        if c['land']: c['f'] = spec['owner'](c['c'], c['lon'], c['lat'])
    # cities & castles: nearest land hex
    def nearest(lon, lat):
        return min(land, key=lambda k: ((cells[k]['lon'] - lon) * K) ** 2 + (cells[k]['lat'] - lat) ** 2)
    places = {}
    for name, lon, lat, lvl, kind in spec['places']:
        k = nearest(lon, lat)
        d = math.hypot((cells[k]['lon'] - lon) * K, cells[k]['lat'] - lat)
        if d > 1.6 * s: print('  skip far', name, file=sys.stderr); continue
        if k in places:
            alt = [n for n in neigh(*k) if n in land and n not in places]
            if kind == 'city' or not alt: print('  clash', name, 'with', places[k][0], file=sys.stderr); continue
            k = min(alt, key=lambda n: ((cells[n]['lon'] - lon) * K) ** 2 + (cells[n]['lat'] - lat) ** 2)
        if kind == 'city' and any(hdist(k, o) < 2 for o in places):
            # try a free neighbouring hex that keeps spacing
            alt = [n for n in neigh(*k) if n in land and n not in places and all(hdist(n, o) >= 2 for o in places)]
            if not alt: print('  adjacent, skip', name, file=sys.stderr); continue
            k = min(alt, key=lambda n: ((cells[n]['lon'] - lon) * K) ** 2 + (cells[n]['lat'] - lat) ** 2)
        if kind == 'castle' and sum(1 for o in places if hdist(k, o) < 2 and places[o][2] == 'castle'):
            print('  castle next to castle, skip', name, file=sys.stderr); continue
        places[k] = (name, lvl, kind)
    # capitals
    caps = {}
    for f, cname in spec['caps'].items():
        for k, v in places.items():
            if v[0] == cname: caps[f] = k
    # farms: deterministic, ~24% of plain land, prefer near cities
    rnd = random.Random(spec['seed'])
    plain = [k for k in land if k not in places and not mountain(cells[k]['lon'], cells[k]['lat'])]
    plain.sort(key=lambda k: (min([hdist(k, p) for p in places if places[p][2] == 'city'] or [9]), rnd.random()))
    farms = set()
    for k in plain:
        if len(farms) >= round(len(land) * 0.24): break
        if sum(1 for n in neigh(*k) if n in farms) >= 2: continue
        farms.add(k)
    out = {'name': spec['name'], 'navy': spec['navy'], 'factions': spec['factions'], 'cells': []}
    idx = {}
    for i, (k, c) in enumerate(sorted(cells.items(), key=lambda kv: (kv[0][1], kv[0][0]))):
        idx[k] = i
        if not c['land']:
            out['cells'].append([k[0], k[1], 0]); continue
        t, nm, lv = 1, '', 0
        if k in places:
            nm, lv, kind = places[k]; t = 3 if kind == 'city' else 4
        elif k in farms: t, lv = 2, 1
        mt = 1 if mountain(c['lon'], c['lat']) and t != 3 else 0
        cap = 1 if k in caps.values() else 0
        out['cells'].append([k[0], k[1], t, c['f'], mt, lv, nm, cap])
    fac = {}
    for row in out['cells']:
        if row[2]: fac.setdefault(row[3], [0, 0]); fac[row[3]][0] += 1; fac[row[3]][1] += row[2] == 3
    print(spec['name'], 'land', len(land), 'sea', len(cells) - len(land), 'cols', cols, 'rows', rows, fac, file=sys.stderr)
    for f in spec['factions']:
        assert f in caps, ('no capital', f)
    return out

def iber_owner(c, lon, lat):
    if c == 'PRT': return 'turkuaz'
    if c in ('FRA', 'AND'): return 'mavi'
    if c == 'ESP':
        if lat < 38.6: return 'yesil'
        if lon > -1.5 and lat < 43: return 'kirmizi'
        if lon < -4.9 and lat > 41.2: return 'kahve'
        return 'sari'
    return 'n'
IBER = {
  'name': 'İber Yarımadası', 'navy': False, 'box': (-9.7, 35.9, 3.6, 44.0), 'target': 64, 'seed': 1,
  'countries': ['ESP', 'PRT', 'FRA', 'AND'],
  'owner': iber_owner,
  'factions': ['sari', 'yesil', 'kirmizi', 'kahve', 'turkuaz', 'mavi'],
  'caps': {'sari': 'Toledo', 'kahve': 'León', 'yesil': 'Kurtuba', 'kirmizi': 'Zaragoza', 'turkuaz': 'Lizbon', 'mavi': 'Toulouse'},
  'places': [
    ('Toledo', -4.02, 39.86, 3, 'city'), ('León', -5.57, 42.60, 3, 'city'), ('Kurtuba', -4.78, 37.88, 3, 'city'), ('Zaragoza', -0.88, 41.65, 3, 'city'),
    ('Lizbon', -9.14, 38.72, 3, 'city'), ('Toulouse', 1.44, 43.60, 3, 'city'),
    ('Sevilla', -5.98, 37.39, 2, 'city'), ('Gırnata', -3.60, 37.18, 2, 'city'), ('Barselona', 2.17, 41.39, 2, 'city'),
    ('Valensiya', -0.38, 39.47, 2, 'city'), ('Burgos', -3.70, 42.34, 2, 'city'), ('Porto', -8.61, 41.15, 2, 'city'),
    ('Santiago', -8.54, 42.88, 1, 'city'), ('Valladolid', -4.72, 41.65, 1, 'city'),
    ('Murcia', -1.13, 37.99, 1, 'city'), ('Badajoz', -6.97, 38.88, 1, 'city'), ('Pamplona', -1.64, 42.81, 1, 'city'),
    ('Montpellier', 3.88, 43.61, 1, 'city'), ('Coimbra', -8.43, 40.20, 1, 'city'),
    ('Segovia', -4.12, 40.95, 1, 'castle'), ('Calatrava', -3.83, 38.90, 1, 'castle'), ('Loarre', -0.61, 42.33, 1, 'castle'),
    ('Carcassonne', 2.35, 43.21, 2, 'castle'), ('Almería', -2.47, 36.84, 1, 'castle'), ('Tarifa', -5.60, 36.01, 1, 'castle'),
    ('Peñíscola', 0.40, 40.36, 1, 'castle'), ('Guimarães', -8.29, 41.44, 1, 'castle'), ('Trujillo', -5.88, 39.46, 1, 'castle'),
  ]}

def italy_owner(c, lon, lat):
    if c in ('FRA', 'MCO'): return 'n' if lon > 8.3 and lat < 43.1 else 'mavi'   # Korsika tarafsız
    if c in ('DEU', 'AUT', 'CHE', 'LIE'): return 'siyah'
    if c in ('SVN', 'HRV', 'BIH', 'MNE', 'HUN', 'SRB'): return 'bordo'
    if c in ('ITA', 'SMR', 'VAT'):
        if 8.0 < lon < 10.0 and 38.8 < lat < 41.4: return 'n'   # Sardinya tarafsız
        if lat > 44.5: return 'yesil'
        if lat > 41.2: return 'sari'
        return 'turuncu'
    return 'n'
ITALY = {
  'name': 'İtalya ve Akdeniz', 'navy': True, 'box': (5.0, 36.6, 19.2, 47.9), 'target': 72, 'seed': 2,
  'countries': ['ITA', 'SMR', 'VAT', 'FRA', 'MCO', 'CHE', 'AUT', 'DEU', 'LIE', 'SVN', 'HRV', 'BIH', 'MNE'],
  'owner': italy_owner,
  'factions': ['yesil', 'sari', 'turuncu', 'mavi', 'siyah', 'bordo'],
  'caps': {'yesil': 'Milano', 'sari': 'Roma', 'turuncu': 'Napoli', 'mavi': 'Marsilya', 'siyah': 'Innsbruck', 'bordo': 'Zagreb'},
  'places': [
    ('Roma', 12.50, 41.90, 3, 'city'), ('Milano', 9.19, 45.46, 3, 'city'), ('Napoli', 14.25, 40.85, 3, 'city'),
    ('Marsilya', 5.37, 43.30, 3, 'city'), ('Innsbruck', 11.40, 47.27, 3, 'city'), ('Zagreb', 15.98, 45.81, 3, 'city'),
    ('Venedik', 12.33, 45.44, 2, 'city'), ('Cenova', 8.93, 44.41, 2, 'city'), ('Floransa', 11.25, 43.77, 2, 'city'),
    ('Palermo', 13.36, 38.12, 2, 'city'), ('Bari', 16.87, 41.12, 1, 'city'), ('Torino', 7.68, 45.07, 1, 'city'),
    ('Ancona', 13.50, 43.60, 1, 'city'), ('Siraküza', 15.29, 37.07, 1, 'city'), ('Cagliari', 9.11, 39.22, 1, 'city'),
    ('Sassari', 8.56, 40.73, 1, 'city'), ('Ajaccio', 8.74, 41.92, 1, 'city'), ('Nice', 7.27, 43.70, 1, 'city'),
    ('Zürih', 8.54, 47.37, 2, 'city'), ('Ljubljana', 14.50, 46.05, 1, 'city'), ('Split', 16.44, 43.51, 1, 'city'),
    ('Ragusa', 18.09, 42.65, 1, 'city'), ('Reggio', 15.65, 38.11, 1, 'city'), ('Grenoble', 5.72, 45.19, 1, 'city'),
    ('Castel del Monte', 16.27, 41.08, 1, 'castle'), ('Monte Cassino', 13.81, 41.49, 1, 'castle'), ('San Leo', 12.34, 43.90, 1, 'castle'),
    ('Canossa', 10.46, 44.58, 1, 'castle'), ('Bard', 7.75, 45.61, 2, 'castle'), ('Klis', 16.52, 43.56, 1, 'castle'),
    ('Bled', 14.10, 46.37, 1, 'castle'), ('Erice', 12.59, 38.04, 1, 'castle'), ('Chillon', 6.93, 46.41, 1, 'castle'),
    ('Verona', 10.99, 45.44, 1, 'castle'),
  ]}

maps = [build(IBER), build(ITALY)]
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'maps.json')
json.dump(maps, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('wrote', out, os.path.getsize(out), file=sys.stderr)
