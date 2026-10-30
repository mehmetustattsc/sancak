"""Sancak harita üretici: Natural Earth (kamu malı) verisinden hex haritalar.
Çıktı: src/maps.json
"""
import json, math, sys, os, random
import numpy as np
from matplotlib.path import Path
NE = os.environ.get('NE', '/home/claude/nvkelso/natural-earth-vector/geojson/')
C = json.load(open(NE + 'ne_50m_admin_0_countries.geojson'))
K = math.cos(math.radians(42))

ALL = []
for f in C['features']:
    a = f['properties']['ADM0_A3']
    g = f['geometry']; parts = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in parts:
        ring = np.array(poly[0])
        ALL.append((a, Path(ring), ring[:, 0].min(), ring[:, 0].max(), ring[:, 1].min(), ring[:, 1].max()))
polys = []
def use_box(box, legacy=False):
    """Haritanın kutusuna değen ülke parçalarını seç. legacy: ilk haritaların eski süzgeci (çıktı aynı kalsın)."""
    global polys
    if legacy: x0, y0, x1, y1 = -15, 33, 36, 52
    else: x0, y0, x1, y1 = box[0] - 3, box[1] - 3, box[2] + 3, box[3] + 3
    polys = [p for p in ALL if not (p[3] < x0 or p[2] > x1 or p[5] < y0 or p[4] > y1)]

def country_at(lon, lat):
    for a, p, x0, x1, y0, y1 in polys:
        if x0 <= lon <= x1 and y0 <= lat <= y1 and p.contains_point((lon, lat)): return a
    return None

MT = [(5.8,44.0,7.5,46.5),(7,45.6,13.8,47.3),(-1.6,42.4,2.8,43.0),(-3.9,36.9,-2.6,37.3),(11,43.6,12.6,44.2),(12.6,42.0,14.6,43.0),(15.2,39.6,16.4,40.8),
      (15.4,43.4,18.6,44.8),(-6.6,42.8,-3.6,43.2),(-5.6,40.1,-3.2,40.8),(-3.6,38.2,-2.2,38.6),(-7.8,40.1,-7.2,40.5),(6.0,45.0,7.2,46.5),(16.5,42.6,19.5,43.4),
      (8.8,39.8,9.5,40.6),(8.7,41.8,9.3,42.4),(14.8,37.6,15.2,37.9),(9.8,44.1,10.6,44.5)]
MT_CUR = MT
def mountain(lon, lat): return any(a <= lon <= c and b <= lat <= d for a, b, c, d in MT_CUR)

def neigh(q, r):
    d = [(1,0),(-1,0),(0,-1),(1,-1),(0,1),(1,1)] if r & 1 else [(1,0),(-1,0),(-1,-1),(0,-1),(-1,1),(0,1)]
    return [(q+a, r+b) for a, b in d]
def cube(q, r):
    x = q - (r - (r & 1)) // 2; z = r; return x, -x - z, z
def hdist(a, b):
    ax, ay, az = cube(*a); bx, by, bz = cube(*b); return max(abs(ax-bx), abs(ay-by), abs(az-bz))

def grid(box, s, allowed, foreign_void=False):
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
                best = max(sorted(set(land)), key=land.count) if land else cs[0]   # eşitlikte alfabetik: her çalıştırmada aynı sonuç
                cells[(q, r)] = {'land': 1, 'c': best, 'lon': lon, 'lat': lat}
            elif foreign_void and cs[0]:
                continue   # haritaya alınmayan ülkenin toprağı: boşluk (deniz değil)
            else:
                cells[(q, r)] = {'land': 0, 'lon': lon, 'lat': lat}
    return cells, cols, rows

def build(spec):
    global K, MT_CUR
    K = math.cos(math.radians(spec.get('klat', 42)))
    MT_CUR = MT + spec.get('mt', [])
    use_box(spec['box'], spec.get('legacy', False))
    allowed = set(spec['countries'])
    lo, hi = 0.15, 2.0
    for _ in range(26):
        s = (lo + hi) / 2; cells, cols, rows = grid(spec['box'], s, allowed, spec.get('foreign_void'))
        n = sum(1 for c in cells.values() if c['land'])
        if n > spec['target']: lo = s
        else: hi = s
    box = spec['box']
    if spec.get('pad_w'):   # kıyı haritanın kenarına değmesin: batıya deniz sütunu ekle (gemiler etrafından dolaşabilsin)
        box = (box[0] - spec['pad_w'] * math.sqrt(3) * s / K,) + tuple(box[1:])
    cells, cols, rows = grid(box, s, allowed, spec.get('foreign_void'))
    land = {k for k, c in cells.items() if c['land']}
    if os.environ.get('DUMP') == spec['name']:   # hata ayıklama: DUMP='Harita adı' ile hücre koordinatları
        for k, c in sorted(cells.items()):
            if (-8 < c['lon'] < -2 and 34.5 < c['lat'] < 37.8) or (24.5 < c['lon'] < 31.5 and 38 < c['lat'] < 42): print('  dump', k, round(c['lon'], 2), round(c['lat'], 2), c['land'], c.get('c'), file=sys.stderr)
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
        if comp[k] != main and (not spec['navy'] or size[comp[k]] < spec.get('island_min', 2)):
            cells[k] = {'land': 0, 'lon': cells[k]['lon'], 'lat': cells[k]['lat']}; land.discard(k)
    # deniz yaz: kaba ızgarada kaybolan dar denizler (Marmara gibi)
    for lon, lat in spec.get('sea_at', []):
        k = min(land, key=lambda k: ((cells[k]['lon'] - lon) * K) ** 2 + (cells[k]['lat'] - lat) ** 2)
        cells[k] = {'land': 0, 'lon': cells[k]['lon'], 'lat': cells[k]['lat']}; land.discard(k)
    # sea: keep only sea cells within 2 of land (navy) else within 1 (decor)
    keep = {}
    for k, c in cells.items():
        if c['land']: keep[k] = c
        elif any(hdist(k, l) <= (2 if spec['navy'] else 1) for l in land): keep[k] = c
    cells = keep
    # küçük kopuk su parçalarını at (ör. haritaya alınmayan ülkelerin toprağı göl gibi görünmesin)
    sea = {k for k, c in cells.items() if not c['land']}; seen = set()
    for k in list(sea):
        if k in seen: continue
        st, part = [k], [k]; seen.add(k)
        while st:
            u = st.pop()
            for v in neigh(*u):
                if v in sea and v not in seen: seen.add(v); st.append(v); part.append(v)
        if len(part) < 8:
            for v in part: del cells[v]
    # owners
    for k, c in cells.items():
        if c['land']: c['f'] = spec['owner'](c['c'], c['lon'], c['lat'])
    # cities & castles: nearest land hex
    def nearest(lon, lat):
        return min(land, key=lambda k: ((cells[k]['lon'] - lon) * K) ** 2 + (cells[k]['lat'] - lat) ** 2)
    places = {}
    force = {}
    for pl in spec['places']:
        name, lon, lat, lvl, kind = pl[:5]
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
        if len(pl) > 5: force[k] = pl[5]
    for k, f in force.items(): cells[k]['f'] = f      # tarihî sahibine ver (kaba ızgarada karşı kıyıya düşen yerler)
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
    if spec.get('titles'): out['titles'] = spec['titles']
    if spec.get('story'): out['story'] = spec['story']
    if spec.get('styles'): out['styles'] = spec['styles']
    # geçitler: açılan boğazın iki kıyısındaki kara hücreleri (aralarında 2 hücre mesafe olmalı)
    links = []
    for A, Bp in spec.get('links', []):
        ka = min(land, key=lambda k: ((cells[k]['lon'] - A[0]) * K) ** 2 + (cells[k]['lat'] - A[1]) ** 2)
        kb = min(land, key=lambda k: ((cells[k]['lon'] - Bp[0]) * K) ** 2 + (cells[k]['lat'] - Bp[1]) ** 2)
        assert hdist(ka, kb) == 2, ('geçit 2 hücre olmalı', spec['name'], ka, kb, hdist(ka, kb))
        links.append([ka[0], ka[1], kb[0], kb[1]])
    if links: out['links'] = links
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
        row = [k[0], k[1], t, c['f'], mt, lv, nm, cap]
        if nm and nm in spec.get('straits', []): row.append(1)   # boğaz şehri: gemiler içinden geçebilir
        out['cells'].append(row)
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
        if lon > 1.1 and lat < 40.3: return 'n'   # Balear adaları tarafsız
        if lat < 38.6: return 'yesil'
        if lon > -1.5 and lat < 43: return 'kirmizi'
        if lon < -4.9 and lat > 41.2: return 'kahve'
        return 'sari'
    return 'n'
IBER = {
  'name': 'İber Yarımadası', 'legacy': True, 'navy': True, 'box': (-9.7, 35.9, 3.6, 44.0), 'target': 64, 'seed': 1, 'island_min': 1, 'pad_w': 1,
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
    ('Montpellier', 3.88, 43.61, 1, 'city'), ('Coimbra', -8.43, 40.20, 1, 'city'), ('Palma', 2.65, 39.57, 1, 'city'),
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
  'name': 'İtalya ve Akdeniz', 'legacy': True, 'navy': True, 'box': (5.0, 36.6, 19.2, 47.9), 'target': 72, 'seed': 2,
  'countries': ['ITA', 'SMR', 'VAT', 'FRA', 'MCO', 'CHE', 'AUT', 'DEU', 'LIE', 'SVN', 'HRV', 'BIH', 'MNE'],
  'owner': italy_owner,
  'factions': ['yesil', 'sari', 'turuncu', 'mavi', 'siyah', 'bordo'],
  'caps': {'yesil': 'Milano', 'sari': 'Roma', 'turuncu': 'Napoli', 'mavi': 'Marsilya', 'siyah': 'Innsbruck', 'bordo': 'Zagreb'},
  'places': [
    ('Roma', 12.50, 41.90, 3, 'city'), ('Milano', 9.19, 45.46, 3, 'city'), ('Napoli', 14.25, 40.85, 3, 'city'),
    ('Marsilya', 5.37, 43.30, 3, 'city'), ('Innsbruck', 11.40, 47.27, 3, 'city'), ('Zagreb', 15.98, 45.81, 3, 'city'),
    ('Venedik', 12.33, 45.44, 2, 'city'), ('Cenova', 8.93, 44.41, 2, 'city'), ('Floransa', 11.25, 43.77, 2, 'city'),
    ('Palermo', 13.36, 38.12, 2, 'city'), ('Bari', 16.87, 41.12, 1, 'city', 'yesil'), ('Torino', 7.68, 45.07, 1, 'city'),
    ('Ancona', 13.50, 43.60, 1, 'city'), ('Siraküza', 15.29, 37.07, 1, 'city'), ('Cagliari', 9.11, 39.22, 1, 'city'),
    ('Sassari', 8.56, 40.73, 1, 'city'), ('Ajaccio', 8.74, 41.92, 1, 'city'), ('Nice', 7.27, 43.70, 1, 'city'),
    ('Zürih', 8.54, 47.37, 2, 'city'), ('Ljubljana', 14.50, 46.05, 1, 'city'), ('Split', 16.44, 43.51, 1, 'city'),
    ('Ragusa', 18.09, 42.65, 1, 'city'), ('Reggio', 15.65, 38.11, 1, 'city'), ('Grenoble', 5.72, 45.19, 1, 'city'),
    ('Castel del Monte', 16.27, 41.08, 1, 'castle'), ('Monte Cassino', 13.81, 41.49, 1, 'castle'), ('San Leo', 12.34, 43.90, 1, 'castle'),
    ('Canossa', 10.46, 44.58, 1, 'castle'), ('Bard', 7.75, 45.61, 2, 'castle'), ('Klis', 16.52, 43.56, 1, 'castle'),
    ('Bled', 14.10, 46.37, 1, 'castle'), ('Erice', 12.59, 38.04, 1, 'castle'), ('Chillon', 6.93, 46.41, 1, 'castle'),
    ('Verona', 10.99, 45.44, 1, 'castle'),
  ]}

def balkan_owner(c, lon, lat):
    if c == 'TUR':
        if (lon < 29.4 and lat > 40.85) or (lon < 26.9 and lat > 40.0): return 'mor'      # Trakya ve İstanbul
        return 'kirmizi' if lat >= 39.0 else 'kahve'
    if c == 'GRC':
        if lat < 35.8 or (lon > 25.6 and lat < 40.0): return 'n'          # Girit, Rodos ve Ege adaları tarafsız
        return 'mor' if (lat > 40.25 and lon > 22.3) else 'turkuaz'
    if c == 'BGR': return 'siyah'
    if c == 'ROU': return 'yesil'
    if c in ('SRB', 'KOS', 'MNE', 'MKD'): return 'bordo'
    if c in ('BIH', 'HRV'): return 'sari'
    return 'n'                                                             # Arnavutluk tarafsız
BALKAN = {
  'name': 'Balkanlar ve Anadolu', 'legacy': True, 'navy': True, 'box': (15.6, 34.8, 33.6, 46.3), 'target': 135, 'seed': 3, 'island_min': 1, 'foreign_void': True,
  'sea_at': [(28.4, 40.75), (27.2, 40.6)], 'straits': ['İstanbul'],
  'styles': {'kirmizi': 'turk', 'kahve': 'turk'},
  'countries': ['TUR', 'GRC', 'BGR', 'ROU', 'SRB', 'KOS', 'MNE', 'MKD', 'BIH', 'HRV', 'ALB'],
  'owner': balkan_owner,
  'factions': ['kirmizi', 'mor', 'turkuaz', 'siyah', 'bordo', 'yesil', 'sari', 'kahve'],
  'titles': {'kirmizi': 'Beylik', 'kahve': 'Sultanlık', 'mor': 'İmparatorluk', 'siyah': 'Çarlık', 'yesil': 'Voyvodalık', 'bordo': 'Despotluk', 'sari': 'Banlık'},
  'caps': {'kirmizi': 'Bursa', 'kahve': 'Konya', 'mor': 'İstanbul', 'turkuaz': 'Atina', 'siyah': 'Tırnova', 'bordo': 'Belgrad', 'yesil': 'Tergovişte', 'sari': 'Saraybosna'},
  'places': [
    ('İstanbul', 28.97, 41.01, 3, 'city'), ('Bursa', 29.06, 40.19, 3, 'city'), ('Konya', 32.49, 37.87, 3, 'city'), ('Atina', 23.73, 37.98, 3, 'city'),
    ('Tırnova', 25.63, 43.08, 3, 'city'), ('Belgrad', 20.46, 44.82, 3, 'city'), ('Tergovişte', 25.46, 44.93, 3, 'city'), ('Saraybosna', 18.41, 43.86, 3, 'city'),
    ('Edirne', 26.56, 41.68, 2, 'city', 'kirmizi'), ('Selanik', 22.94, 40.64, 2, 'city'), ('Ankara', 32.85, 39.93, 2, 'city'), ('İzmir', 27.14, 38.42, 2, 'city'),
    ('Sofya', 23.32, 42.70, 2, 'city'), ('Üsküp', 21.43, 42.00, 2, 'city'), ('Kraiova', 23.80, 44.32, 1, 'city'), ('Ragusa', 18.09, 42.65, 2, 'city', 'sari'),
    ('İznik', 29.72, 40.43, 1, 'city'), ('Antalya', 30.71, 36.89, 1, 'city'), ('Denizli', 29.09, 37.78, 1, 'city'), ('Kastamonu', 33.78, 41.38, 1, 'city'),
    ('Varna', 27.91, 43.21, 1, 'city'), ('Filibe', 24.75, 42.14, 1, 'city'), ('Niş', 21.90, 43.32, 1, 'city'), ('Kalas', 28.05, 45.43, 1, 'city'),
    ('Split', 16.44, 43.51, 1, 'city'), ('Zagreb', 15.98, 45.81, 1, 'city'), ('Yanya', 20.85, 39.66, 1, 'city'), ('Mora', 22.11, 37.04, 1, 'city'),
    ('Kandiye', 25.13, 35.34, 1, 'city'), ('Draç', 19.45, 41.32, 1, 'city'),
    ('Kütahya', 29.98, 39.42, 1, 'castle'), ('Alanya', 32.00, 36.54, 1, 'castle'), ('Vize', 27.77, 41.57, 1, 'castle', 'mor'), ('Rumeli', 27.6, 41.1, 1, 'castle'),
    ('Vidin', 22.88, 43.99, 1, 'castle'), ('Semendire', 20.93, 44.66, 2, 'castle'), ('Braşov', 25.59, 45.65, 1, 'castle'), ('Prizren', 20.74, 42.21, 1, 'castle'),
    ('Jajce', 17.27, 44.34, 1, 'castle'), ('Mistra', 22.37, 37.07, 1, 'castle'), ('Akrokorint', 22.87, 37.89, 1, 'castle'), ('Kruja', 19.79, 41.51, 1, 'castle'),
    ('Çimenlik', 26.40, 40.15, 1, 'castle'), ('Silistre', 27.26, 44.12, 1, 'castle'),
  ]}
def west_owner(c, lon, lat):
    if c in ('FRA',): return 'n' if (lon < -0.9 and lat > 46.8) else 'mavi'      # Bretanya tarafsız
    if c == 'GBR': return 'buz'
    if c in ('NLD', 'BEL', 'LUX'): return 'turuncu'
    if c == 'DEU':
        if lat >= 50.3: return 'siyah' if lon >= 10.6 else 'kahve'
        return 'sari'
    if c == 'POL': return 'siyah' if lat > 50.6 else 'bordo'
    if c in ('AUT', 'CZE', 'SVN', 'HUN', 'SVK', 'HRV'): return 'bordo'
    if c == 'ITA': return 'yesil'
    return 'n'                     # İsviçre tarafsız
WEST = {
  'name': 'Batı Avrupa', 'legacy': True, 'navy': True, 'box': (-5.9, 44.0, 17.6, 55.4), 'target': 165, 'seed': 4, 'island_min': 2, 'foreign_void': True,
  'sea_at': [(1.59, 51.02)], 'links': [((0.23, 51.02), (2.28, 50.14))],          # Manş: su yolu ve geçit
  'countries': ['FRA', 'GBR', 'NLD', 'BEL', 'LUX', 'DEU', 'POL', 'AUT', 'CZE', 'SVN', 'HRV', 'ITA', 'CHE'],
  'owner': west_owner,
  'factions': ['mavi', 'buz', 'turuncu', 'kahve', 'siyah', 'sari', 'bordo', 'yesil'],
  'titles': {'mavi': 'Cumhuriyet', 'buz': 'Krallık', 'turuncu': 'Krallık', 'kahve': 'Konfederasyon', 'siyah': 'Krallık', 'sari': 'Krallık', 'bordo': 'İmparatorluk', 'yesil': 'Krallık'},
  'caps': {'mavi': 'Paris', 'buz': 'Londra', 'turuncu': 'Brüksel', 'kahve': 'Köln', 'siyah': 'Berlin', 'sari': 'Münih', 'bordo': 'Viyana', 'yesil': 'Torino'},
  'places': [
    ('Paris', 2.35, 48.86, 3, 'city'), ('Londra', -0.13, 51.51, 3, 'city'), ('Brüksel', 4.35, 50.85, 3, 'city'), ('Köln', 6.96, 50.94, 3, 'city'),
    ('Berlin', 13.40, 52.52, 3, 'city'), ('Münih', 11.58, 48.14, 3, 'city'), ('Viyana', 16.37, 48.21, 3, 'city'), ('Torino', 7.69, 45.07, 3, 'city'),
    ('Lyon', 4.84, 45.76, 2, 'city'), ('Nantes', -1.55, 47.22, 1, 'city'), ('Lille', 3.06, 50.63, 1, 'city'), ('Strazburg', 7.75, 48.58, 2, 'city'), ('Bordeaux', -0.58, 44.84, 1, 'city'),
    ('Manchester', -2.24, 53.48, 2, 'city'), ('Bristol', -2.59, 51.45, 1, 'city'), ('Birmingham', -1.90, 52.48, 1, 'city'),
    ('Amsterdam', 4.90, 52.37, 2, 'city'), ('Rotterdam', 4.48, 51.92, 1, 'castle', 'turuncu'),
    ('Hamburg', 9.99, 53.55, 2, 'city'), ('Hannover', 9.73, 52.37, 1, 'city'), ('Frankfurt', 8.68, 50.11, 2, 'city'),
    ('Dresden', 13.74, 51.05, 2, 'city'), ('Breslau', 17.04, 51.11, 1, 'city'), ('Stettin', 14.55, 53.43, 1, 'city'),
    ('Nürnberg', 11.08, 49.45, 1, 'city'), ('Stuttgart', 9.18, 48.78, 2, 'city', 'sari'),
    ('Prag', 14.42, 50.08, 2, 'city'), ('Graz', 15.44, 47.07, 1, 'city'), ('Trieste', 13.78, 45.65, 1, 'city'),
    ('Milano', 9.19, 45.46, 2, 'city', 'yesil'), ('Venedik', 12.33, 45.44, 1, 'city'), ('Cenova', 8.93, 44.41, 1, 'city'),
    ('Zürih', 8.54, 47.37, 2, 'city'), ('Cenevre', 6.14, 46.20, 1, 'city', 'n'),
    ('Verdun', 5.39, 49.16, 2, 'castle'), ('Belfort', 6.86, 47.64, 1, 'castle'), ('Brest', -4.49, 48.39, 1, 'castle'),
    ('Dover', 1.31, 51.13, 1, 'castle', 'buz'), ('York', -1.08, 53.96, 1, 'castle'), ('Namur', 4.87, 50.47, 1, 'castle'), ('Lüksemburg', 6.13, 49.61, 1, 'castle', 'turuncu'),
    ('Koblenz', 7.59, 50.36, 1, 'castle', 'kahve'), ('Magdeburg', 11.63, 52.12, 1, 'castle'), ('Kiel', 10.13, 54.32, 1, 'castle'),
    ('Ulm', 9.99, 48.40, 1, 'castle'), ('Linz', 14.29, 48.31, 1, 'castle'), ('Olomouc', 17.25, 49.59, 1, 'castle'), ('Verona', 10.99, 45.44, 1, 'castle'),
  ]}
def east_owner(c, lon, lat):
    if c == 'RUS': return 'siyah' if lon < 23 else ('buz' if lat >= 50.2 else 'turuncu')
    if c == 'POL': return 'siyah' if lat >= 51.0 else 'bordo'
    if c in ('HUN', 'SVK'): return 'bordo'
    if c == 'UKR': return 'bordo' if lon < 25.6 else 'mor'
    if c == 'ROU': return 'bordo' if (lat > 46.3 and lon < 25.2) else 'yesil'
    if c == 'MDA': return 'yesil'
    if c == 'TUR': return 'kirmizi'
    if c in ('GEO', 'ARM', 'AZE'): return 'turuncu'
    if c in ('LTU', 'LVA'): return 'kahve'
    if c == 'BLR': return 'kahve' if lon < 28.3 else 'buz'
    return 'n'                                   # Bulgaristan tarafsız
EAST = {
  'name': 'Doğu Cephesi ve Kafkasya', 'legacy': True, 'navy': True, 'box': (17.6, 39.6, 45.2, 56.4), 'target': 200, 'seed': 5, 'island_min': 2, 'foreign_void': True,
  'styles': {'kirmizi': 'turk'},
  'countries': ['RUS', 'POL', 'HUN', 'SVK', 'UKR', 'ROU', 'MDA', 'TUR', 'GEO', 'ARM', 'AZE', 'LTU', 'LVA', 'BLR', 'BGR'],
  'owner': east_owner,
  'factions': ['buz', 'siyah', 'bordo', 'yesil', 'kirmizi', 'mor', 'turuncu', 'kahve'],
  'titles': {'buz': 'Çarlık', 'siyah': 'Krallık', 'bordo': 'İmparatorluk', 'yesil': 'Krallık', 'kirmizi': 'Saltanat', 'mor': 'Hetmanlık', 'turuncu': 'Kazaklığı', 'kahve': 'Dükalık'},
  'caps': {'buz': 'Moskova', 'siyah': 'Königsberg', 'bordo': 'Budapeşte', 'yesil': 'Bükreş', 'kirmizi': 'İstanbul', 'mor': 'Kiev', 'turuncu': 'Rostov', 'kahve': 'Vilna'},
  'places': [
    ('Moskova', 37.62, 55.75, 3, 'city'), ('Königsberg', 20.51, 54.71, 3, 'city'), ('Budapeşte', 19.04, 47.50, 3, 'city'), ('Bükreş', 26.10, 44.43, 3, 'city'),
    ('İstanbul', 28.97, 41.01, 3, 'city'), ('Kiev', 30.52, 50.45, 3, 'city'), ('Stavropol', 41.97, 45.04, 1, 'city'), ('Vilna', 25.28, 54.69, 3, 'city'),
    ('Smolensk', 32.05, 54.78, 2, 'city'), ('Voronej', 39.20, 51.66, 1, 'city'), ('Rostov', 39.72, 47.23, 3, 'city'), ('Çaritsin', 44.51, 48.70, 1, 'city'), ('Kursk', 36.19, 51.73, 1, 'city'), ('Krasnodar', 38.98, 45.04, 1, 'city'),
    ('Danzig', 18.65, 54.35, 2, 'city'), ('Varşova', 21.01, 52.23, 2, 'city'),
    ('Krakov', 19.94, 50.06, 2, 'city'), ('Lemberg', 24.03, 49.84, 2, 'city'), ('Kolojvar', 23.60, 46.77, 1, 'city'),
    ('Yaş', 27.60, 47.16, 1, 'city'), ('Köstence', 28.63, 44.17, 1, 'city'), ('Kişinev', 28.86, 47.01, 1, 'city', 'yesil'),
    ('Edirne', 26.56, 41.68, 2, 'city', 'kirmizi'), ('Bursa', 29.06, 40.19, 2, 'city'), ('Ankara', 32.85, 39.93, 1, 'city'), ('Trabzon', 39.72, 41.00, 2, 'city'),
    ('Odessa', 30.73, 46.48, 2, 'city'), ('Harkov', 36.23, 49.99, 2, 'city'), ('Yekaterinoslav', 35.04, 48.46, 1, 'city'),
    ('Riga', 24.10, 56.95, 2, 'city'), ('Minsk', 27.56, 53.90, 2, 'city', 'kahve'),
    ('Sofya', 23.32, 42.70, 1, 'city'), ('Varna', 27.91, 43.21, 1, 'city'),
    ('Tula', 37.62, 54.20, 1, 'castle'), ('Bryansk', 34.36, 53.24, 1, 'castle'), ('Novorossiysk', 37.77, 44.72, 1, 'castle'),
    ('Thorn', 18.60, 53.01, 1, 'castle'), ('Przemyśl', 22.77, 49.78, 2, 'castle'), ('Komárom', 18.13, 47.76, 1, 'castle'),
    ('Brăila', 27.97, 45.27, 1, 'castle'), ('Çatalca', 28.46, 41.14, 1, 'castle', 'kirmizi'), ('Sinop', 35.15, 42.02, 1, 'castle'), ('Kars', 43.10, 40.60, 2, 'castle'),
    ('Sivastopol', 33.52, 44.60, 2, 'castle'), ('Jitomir', 28.66, 50.25, 1, 'castle'), ('Kaunas', 23.90, 54.90, 1, 'castle', 'kahve'), ('Brest-Litovsk', 23.69, 52.10, 1, 'castle'),
  ]}
def europe_owner(c, lon, lat):
    return {'ESP': 'sari', 'PRT': 'sari', 'FRA': 'mavi', 'GBR': 'buz', 'IRL': 'buz', 'DEU': 'siyah', 'POL': 'turuncu',
            'AUT': 'bordo', 'CZE': 'bordo', 'SVK': 'bordo', 'HUN': 'bordo', 'SVN': 'bordo', 'ITA': 'yesil',
            'HRV': 'mor', 'BIH': 'mor', 'SRB': 'mor', 'MNE': 'mor', 'KOS': 'mor', 'MKD': 'turkuaz', 'ALB': 'turkuaz',
            'GRC': 'turkuaz', 'ROU': 'kahve', 'BGR': 'kahve', 'TUR': 'kirmizi'}.get(c, 'n')
EUROPE = {
  'name': 'Avrupa', 'legacy': True, 'navy': True, 'box': (-10.6, 34.8, 36.4, 56.2), 'target': 255, 'seed': 6, 'island_min': 2, 'foreign_void': True,
  'links': [((-1.89, 51.72), (-0.15, 49.47))],                                       # Manş geçidi
  'straits': ['İstanbul'], 'sea_at': [(-1.02, 50.6), (28.0, 40.7), (26.2, 39.9), (25.4, 38.9), (25.6, 37.6)],
  'styles': {'kirmizi': 'turk'},
  'countries': ['ESP', 'PRT', 'FRA', 'GBR', 'IRL', 'DEU', 'POL', 'AUT', 'CZE', 'SVK', 'HUN', 'SVN', 'ITA', 'HRV', 'BIH', 'SRB', 'MNE', 'KOS', 'MKD', 'ALB',
                'GRC', 'ROU', 'BGR', 'TUR', 'BEL', 'NLD', 'LUX', 'CHE', 'DNK'],
  'owner': europe_owner,
  'factions': ['mavi', 'siyah', 'buz', 'sari', 'yesil', 'kirmizi', 'turuncu', 'bordo', 'mor', 'turkuaz', 'kahve'],
  'caps': {'sari': 'Madrid', 'mavi': 'Paris', 'buz': 'Londra', 'siyah': 'Berlin', 'turuncu': 'Varşova', 'bordo': 'Viyana', 'yesil': 'Roma',
           'mor': 'Belgrad', 'turkuaz': 'Atina', 'kahve': 'Bükreş', 'kirmizi': 'Ankara'},
  'places': [
    ('Madrid', -3.70, 40.42, 3, 'city'), ('Paris', 2.35, 48.86, 3, 'city'), ('Londra', -0.13, 51.51, 3, 'city'), ('Berlin', 13.40, 52.52, 3, 'city'),
    ('Varşova', 21.01, 52.23, 3, 'city'), ('Viyana', 16.37, 48.21, 3, 'city'), ('Roma', 12.50, 41.90, 3, 'city'), ('Belgrad', 20.46, 44.82, 3, 'city'),
    ('Atina', 23.73, 37.98, 3, 'city'), ('Bükreş', 26.10, 44.43, 3, 'city'), ('Ankara', 32.85, 39.93, 3, 'city'),
    ('Barselona', 2.17, 41.39, 2, 'city'), ('Sevilla', -5.98, 37.39, 1, 'city'), ('Lizbon', -9.14, 38.72, 2, 'city'), ('Bilbao', -2.93, 43.26, 1, 'city'), ('Valensiya', -0.38, 39.47, 1, 'city'),
    ('Lyon', 4.84, 45.76, 2, 'city'), ('Marsilya', 5.37, 43.30, 2, 'city'), ('Bordeaux', -0.58, 44.84, 1, 'city'), ('Nantes', -1.55, 47.22, 1, 'city'), ('Strazburg', 7.75, 48.58, 1, 'city', 'mavi'),
    ('Manchester', -2.24, 53.48, 2, 'city'), ('Dublin', -6.26, 53.35, 2, 'city'), ('Glasgow', -4.25, 55.86, 1, 'city', 'buz'), ('Bristol', -2.59, 51.45, 1, 'city'),
    ('Hamburg', 9.99, 53.55, 2, 'city'), ('Münih', 11.58, 48.14, 2, 'city'), ('Köln', 6.96, 50.94, 2, 'city'), ('Frankfurt', 8.68, 50.11, 1, 'city'), ('Dresden', 13.74, 51.05, 1, 'city'),
    ('Krakov', 19.94, 50.06, 2, 'city'), ('Gdańsk', 18.65, 54.35, 2, 'city'), ('Poznań', 16.93, 52.41, 1, 'city'), ('Wrocław', 17.04, 51.11, 1, 'city'),
    ('Prag', 14.42, 50.08, 2, 'city'), ('Budapeşte', 19.04, 47.50, 2, 'city'), ('Graz', 15.44, 47.07, 1, 'city'),
    ('Milano', 9.19, 45.46, 2, 'city', 'yesil'), ('Napoli', 14.25, 40.85, 2, 'city'), ('Torino', 7.69, 45.07, 1, 'city'), ('Venedik', 12.33, 45.44, 1, 'city'), ('Palermo', 13.36, 38.12, 1, 'city'), ('Bari', 16.87, 41.12, 1, 'city', 'yesil'),
    ('Zagreb', 15.98, 45.81, 2, 'city'), ('Saraybosna', 18.41, 43.86, 1, 'city'), ('Üsküp', 21.43, 42.00, 1, 'city'), ('Tiran', 19.82, 41.33, 1, 'city'),
    ('Selanik', 22.94, 40.64, 2, 'city'), ('Kandiye', 25.13, 35.34, 1, 'city'),
    ('Sofya', 23.32, 42.70, 2, 'city'), ('Kluj', 23.60, 46.77, 1, 'city'), ('Yaş', 27.60, 47.16, 1, 'city'), ('Varna', 27.91, 43.21, 1, 'city'),
    ('İstanbul', 28.97, 41.01, 3, 'city'), ('İzmir', 27.14, 38.42, 2, 'city'), ('Bursa', 29.06, 40.19, 1, 'city'), ('Antalya', 30.71, 36.89, 1, 'city'), ('Adana', 35.32, 37.00, 1, 'city'),
    ('Amsterdam', 4.90, 52.37, 2, 'city'), ('Brüksel', 4.35, 50.85, 2, 'city', 'n'), ('Kopenhag', 12.57, 55.68, 2, 'city'), ('Zürih', 8.54, 47.37, 2, 'city'),
    ('Zaragoza', -0.88, 41.65, 1, 'castle'), ('Portsmouth', -1.09, 50.80, 1, 'castle'), ('Hannover', 9.73, 52.37, 1, 'castle'),
    ('Lublin', 22.57, 51.25, 1, 'castle'), ('Brno', 16.61, 49.20, 1, 'castle'), ('Floransa', 11.25, 43.77, 1, 'castle'), ('Split', 16.44, 43.51, 1, 'castle'),
    ('Yanya', 20.85, 39.66, 1, 'castle'), ('Plovdiv', 24.75, 42.14, 1, 'castle'), ('Çanakkale', 26.40, 40.15, 1, 'castle'), ('Erzurum', 41.27, 39.90, 1, 'castle'),
  ]}
def north_owner(c, lon, lat):
    if c == 'GBR':
        if lon < -5.3 and lat < 55.4: return 'yesil'                  # Kuzey İrlanda
        if lat > 55.3: return 'buz'                                   # İskoçya
        if lon < -2.9 and 51.3 < lat < 53.45: return 'n'               # Galler tarafsız
        return 'kirmizi'
    if c == 'IRL': return 'yesil'
    if c == 'NOR': return 'turkuaz'
    if c == 'SWE': return 'sari' if lat < 57.2 else 'turkuaz'
    if c == 'DNK': return 'sari'
    if c == 'DEU': return 'siyah' if lat > 52.6 else 'n'                # iç Almanya tarafsız
    if c in ('NLD', 'BEL', 'FRA'): return 'turuncu'
    return 'n'
NORTH = {
  'name': 'Britanya ve Kuzey Denizleri', 'navy': True, 'box': (-10.8, 50.6, 13.6, 61.2), 'klat': 56, 'target': 140, 'seed': 7, 'island_min': 1, 'foreign_void': True,
  'sea_at': [(-5.38, 55.95), (-4.7, 55.29), (10.89, 57.26), (11.57, 55.29)],
  'links': [((-6.06, 55.29), (-4.02, 55.95)), ((10.21, 55.29), (12.24, 55.95))],   # Kuzey Kanalı ve Büyük Belt geçitleri
  'countries': ['GBR', 'IRL', 'NOR', 'SWE', 'DNK', 'DEU', 'NLD', 'BEL', 'FRA'],
  'mt': [(-5.5, 56.5, -3.0, 58.5), (6.0, 59.5, 9.5, 61.2), (-4.2, 52.5, -3.3, 53.3)],
  'owner': north_owner,
  'factions': ['kirmizi', 'buz', 'yesil', 'turkuaz', 'sari', 'siyah', 'turuncu'],
  'titles': {'siyah': 'Hansa Birliği', 'turuncu': 'Kontluk'},
  'caps': {'kirmizi': 'Londra', 'buz': 'Edinburgh', 'yesil': 'Dublin', 'turkuaz': 'Bergen', 'sari': 'Roskilde', 'siyah': 'Lübeck', 'turuncu': 'Brugge'},
  'places': [
    ('Londra', -0.13, 51.51, 3, 'city'), ('Edinburgh', -3.19, 55.95, 3, 'city'), ('Dublin', -6.26, 53.35, 3, 'city'), ('Bergen', 5.32, 60.39, 3, 'city'),
    ('Roskilde', 12.08, 55.64, 3, 'city'), ('Lübeck', 10.69, 53.87, 3, 'city'), ('Brugge', 3.22, 51.21, 3, 'city'),
    ('York', -1.08, 53.96, 2, 'city'), ('Norwich', 1.30, 52.63, 1, 'city'), ('Bristol', -2.59, 51.45, 1, 'city'), ('Lincoln', -0.54, 53.23, 1, 'city'),
    ('Aberdeen', -2.09, 57.15, 1, 'city'), ('Glasgow', -4.25, 55.86, 1, 'city', 'buz'), ('Inverness', -4.22, 57.48, 1, 'city'),
    ('Cork', -8.47, 51.90, 1, 'city'), ('Galway', -9.05, 53.27, 1, 'city'), ('Armagh', -6.65, 54.35, 1, 'city'),
    ('Oslo', 10.75, 59.91, 2, 'city'), ('Stavanger', 5.73, 58.97, 1, 'city'), ('Kristiansand', 7.99, 58.15, 1, 'city'),
    ('Aarhus', 10.20, 56.16, 2, 'city'), ('Ribe', 8.76, 55.33, 1, 'city'), ('Lund', 13.19, 55.70, 1, 'city'), ('Aalborg', 9.92, 57.05, 1, 'city'),
    ('Hamburg', 9.99, 53.55, 2, 'city'), ('Bremen', 8.80, 53.08, 1, 'city'), ('Rostock', 12.10, 54.09, 1, 'city'),
    ('Gent', 3.72, 51.05, 2, 'city'), ('Utrecht', 5.12, 52.09, 1, 'city'), ('Amsterdam', 4.90, 52.37, 1, 'city'),
    ('Cardiff', -3.18, 51.48, 1, 'city'),
    ('Dover', 1.31, 51.13, 1, 'castle'), ('Nottingham', -1.15, 52.95, 1, 'castle'), ('Stirling', -3.94, 56.12, 2, 'castle'), ('Limerick', -8.63, 52.66, 1, 'castle'),
    ('Caernarfon', -4.27, 53.14, 1, 'castle'), ('Tønsberg', 10.41, 59.27, 1, 'castle'), ('Bohus', 11.97, 57.71, 1, 'castle'), ('Schleswig', 9.57, 54.52, 1, 'castle'),
    ('Calais', 1.86, 50.95, 1, 'castle'), ('Durham', -1.57, 54.78, 1, 'castle'),
  ]}
def africa_owner(c, lon, lat):
    if c == 'TUR': return 'kirmizi' if lon < 33.2 else 'n'
    if c in ('SYR', 'LBN', 'JOR', 'ISR', 'PSE'): return 'yesil'
    if c == 'EGY': return 'sari'
    if c == 'LBY': return 'turuncu'
    if c == 'TUN': return 'mavi'
    if c == 'GRC': return 'turkuaz'
    if c == 'ITA': return 'mor'
    return 'n'                                   # Kıbrıs, Malta tarafsız
AFRICA = {
  'name': 'Kuzey Afrika ve Doğu Akdeniz', 'navy': True, 'box': (8.5, 29.4, 37.5, 41.4), 'klat': 35, 'target': 165, 'seed': 8, 'island_min': 1, 'foreign_void': True,
  'countries': ['TUN', 'LBY', 'EGY', 'ISR', 'PSE', 'LBN', 'SYR', 'JOR', 'TUR', 'CYP', 'GRC', 'ITA', 'MLT'],
  'mt': [(35.5, 33.0, 36.6, 34.6), (30.0, 36.5, 34.0, 37.6), (21.0, 38.5, 22.6, 40.2), (15.6, 39.2, 16.6, 40.6)],
  'owner': africa_owner, 'styles': {'kirmizi': 'turk'},
  'factions': ['kirmizi', 'yesil', 'sari', 'turuncu', 'mavi', 'turkuaz', 'mor'],
  'titles': {'kirmizi': 'Saltanat', 'yesil': 'Emirlik', 'sari': 'Hidivlik', 'turuncu': 'Paşalık', 'mavi': 'Beylik', 'turkuaz': 'Krallık', 'mor': 'Krallık'},
  'caps': {'kirmizi': 'İstanbul', 'yesil': 'Şam', 'sari': 'Kahire', 'turuncu': 'Trablus', 'mavi': 'Tunus', 'turkuaz': 'Atina', 'mor': 'Napoli'},
  'places': [
    ('İstanbul', 28.97, 41.01, 3, 'city'), ('Şam', 36.29, 33.51, 3, 'city'), ('Kahire', 31.24, 30.04, 3, 'city'), ('Trablus', 13.19, 32.89, 3, 'city'),
    ('Tunus', 10.18, 36.81, 3, 'city'), ('Atina', 23.73, 37.98, 3, 'city'), ('Napoli', 14.25, 40.85, 3, 'city'),
    ('Bursa', 29.06, 40.19, 2, 'city'), ('İzmir', 27.14, 38.42, 2, 'city'), ('Konya', 32.49, 37.87, 1, 'city'), ('Antalya', 30.71, 36.89, 1, 'city'),
    ('Halep', 37.16, 36.20, 2, 'city'), ('Beyrut', 35.50, 33.89, 1, 'city'), ('Kudüs', 35.21, 31.77, 2, 'city'), ('Humus', 36.72, 34.73, 1, 'city'),
    ('İskenderiye', 29.92, 31.20, 2, 'city'), ('Dimyat', 31.81, 31.42, 1, 'city'),
    ('Bingazi', 20.07, 32.12, 2, 'city'), ('Derne', 22.64, 32.77, 1, 'city'), ('Misrata', 15.09, 32.38, 1, 'city'),
    ('Sfaks', 10.76, 34.74, 1, 'city'), ('Kayrevan', 10.10, 35.68, 1, 'city'),
    ('Selanik', 22.94, 40.64, 2, 'city'), ('Patras', 21.73, 38.25, 1, 'city'), ('Kandiye', 25.13, 35.34, 1, 'city'),
    ('Palermo', 13.36, 38.12, 2, 'city'), ('Bari', 16.87, 41.12, 1, 'city'), ('Reggio', 15.65, 38.11, 1, 'city'),
    ('Adana', 35.32, 37.00, 1, 'city'), ('Kayseri', 35.49, 38.73, 1, 'city'), ('Lefkoşa', 33.36, 35.17, 1, 'city'),
    ('Çanakkale', 26.40, 40.15, 1, 'castle'), ('Kütahya', 29.98, 39.42, 1, 'castle'), ('Akka', 35.07, 32.93, 2, 'castle'), ('Antakya', 36.16, 36.20, 1, 'castle'),
    ('Süveyş', 32.55, 29.97, 1, 'castle'), ('Tobruk', 23.96, 32.08, 1, 'castle'), ('Bizerte', 9.87, 37.27, 1, 'castle'), ('Mistra', 22.37, 37.07, 1, 'castle'),
    ('Siraküza', 15.29, 37.07, 1, 'castle'), ('Valletta', 14.51, 35.90, 1, 'castle'), ('Rodos', 28.22, 36.43, 1, 'castle'),
  ]}
def nordic_owner(c, lon, lat):
    return {'NOR': 'turkuaz', 'SWE': 'sari', 'FIN': 'buz', 'DNK': 'kirmizi', 'DEU': 'siyah', 'POL': 'turuncu',
            'EST': 'yesil', 'LVA': 'yesil', 'LTU': 'yesil'}.get(c, 'n')
NORDIC = {
  'name': 'İskandinavya ve Baltık', 'navy': True, 'box': (4.4, 51.9, 31.0, 63.6), 'klat': 57, 'target': 185, 'seed': 9, 'island_min': 1, 'foreign_void': True,
  'sea_at': [(12.43, 56.03)], 'links': [((11.7, 55.34), (13.15, 56.72))],          # Øresund
  'countries': ['NOR', 'SWE', 'FIN', 'DNK', 'DEU', 'POL', 'EST', 'LVA', 'LTU'],
  'mt': [(6.0, 59.5, 12.5, 65.6), (12.5, 62.0, 14.5, 65.6)],
  'owner': nordic_owner,
  'factions': ['turkuaz', 'sari', 'buz', 'kirmizi', 'siyah', 'turuncu', 'yesil'],
  'titles': {'turkuaz': 'Krallık', 'sari': 'Krallık', 'kirmizi': 'Krallık', 'yesil': 'Birlik'},
  'caps': {'turkuaz': 'Oslo', 'sari': 'Stokholm', 'buz': 'Helsinki', 'kirmizi': 'Kopenhag', 'siyah': 'Berlin', 'turuncu': 'Varşova', 'yesil': 'Riga'},
  'places': [
    ('Oslo', 10.75, 59.91, 3, 'city'), ('Stokholm', 18.07, 59.33, 3, 'city'), ('Helsinki', 24.94, 60.17, 3, 'city'), ('Kopenhag', 12.57, 55.68, 3, 'city'),
    ('Berlin', 13.40, 52.52, 3, 'city'), ('Varşova', 21.01, 52.23, 3, 'city'), ('Hamburg', 9.99, 53.55, 2, 'city'), ('Gdańsk', 18.65, 54.35, 2, 'city'), ('Hannover', 9.73, 52.37, 1, 'city'), ('Riga', 24.10, 56.95, 3, 'city'),
    ('Bergen', 5.32, 60.39, 2, 'city'), ('Trondheim', 10.40, 63.43, 2, 'city'), ('Stavanger', 5.73, 58.97, 1, 'city'),
    ('Göteborg', 11.97, 57.71, 2, 'city'), ('Malmö', 13.00, 55.60, 1, 'city'), ('Sundsvall', 17.31, 62.39, 1, 'city'), ('Örebro', 15.21, 59.27, 1, 'city'),
    ('Turku', 22.27, 60.45, 2, 'city'), ('Tampere', 23.76, 61.50, 1, 'city'), ('Kuopio', 27.68, 62.89, 1, 'city'),
    ('Aarhus', 10.20, 56.16, 2, 'city'), ('Aalborg', 9.92, 57.05, 1, 'city'), ('Odense', 10.39, 55.40, 1, 'city', 'kirmizi'),
    ('Kiel', 10.13, 54.32, 1, 'city'), ('Rostock', 12.10, 54.09, 1, 'city'), ('Bremen', 8.80, 53.08, 1, 'city'),
    ('Szczecin', 14.55, 53.43, 2, 'city'), ('Olsztyn', 20.49, 53.78, 1, 'city'),
    ('Tallinn', 24.75, 59.44, 2, 'city'), ('Vilnius', 25.28, 54.69, 2, 'city'), ('Kaunas', 23.90, 54.90, 1, 'city'), ('Tartu', 26.72, 58.38, 1, 'city'),
    ('Kristiansand', 7.99, 58.15, 1, 'castle'), ('Linköping', 15.62, 58.41, 1, 'castle'), ('Visby', 18.29, 57.64, 1, 'castle'), ('Vaasa', 21.62, 63.10, 1, 'castle'),
    ('Esbjerg', 8.45, 55.47, 1, 'castle'), ('Schwerin', 11.41, 53.63, 1, 'castle'), ('Koszalin', 16.18, 54.19, 1, 'castle'), ('Klaipėda', 21.14, 55.71, 1, 'castle'),
    ('Lahti', 25.66, 60.98, 1, 'castle'), ('Białystok', 23.16, 53.13, 1, 'castle'), ('Magdeburg', 11.63, 52.12, 1, 'castle'),
  ]}
def med_owner(c, lon, lat):
    return {'ESP': 'sari', 'PRT': 'sari', 'FRA': 'mavi', 'ITA': 'yesil', 'GRC': 'turkuaz', 'ALB': 'turkuaz', 'MKD': 'turkuaz', 'TUR': 'kirmizi',
            'MAR': 'turuncu', 'DZA': 'kahve', 'TUN': 'mor', 'LBY': 'mor' if lon < 18.5 else 'siyah', 'EGY': 'siyah'}.get(c, 'n')
MED = {
  'name': 'Akdeniz', 'navy': True, 'box': (-10.2, 29.8, 36.2, 45.6), 'klat': 38, 'target': 225, 'seed': 10, 'island_min': 1, 'foreign_void': True,
  'straits': ['İstanbul'], 'sea_at': [(-5.24, 36.57), (-4.41, 35.44), (28.66, 39.96), (27.01, 39.96)], 'links': [((-3.59, 36.57), (-6.07, 35.44))],   # Cebelitarık
  'countries': ['ESP', 'PRT', 'FRA', 'ITA', 'GRC', 'ALB', 'MKD', 'TUR', 'MAR', 'DZA', 'TUN', 'LBY', 'EGY', 'HRV', 'BIH', 'MNE', 'CYP', 'MLT', 'BGR'],
  'mt': [(-5.5, 30.5, -2.0, 33.5), (2.5, 35.2, 7.5, 36.6), (-1.5, 42.4, 2.8, 43.0), (7.0, 44.0, 8.0, 45.6), (30.0, 36.6, 34.0, 37.6)],
  'owner': med_owner, 'styles': {'kirmizi': 'turk'},
  'factions': ['sari', 'mavi', 'yesil', 'turkuaz', 'kirmizi', 'turuncu', 'kahve', 'mor', 'siyah'],
  'caps': {'sari': 'Madrid', 'mavi': 'Marsilya', 'yesil': 'Roma', 'turkuaz': 'Atina', 'kirmizi': 'Ankara', 'turuncu': 'Rabat', 'kahve': 'Cezayir', 'mor': 'Tunus', 'siyah': 'Kahire'},
  'places': [
    ('Madrid', -3.70, 40.42, 3, 'city'), ('Marsilya', 5.37, 43.30, 3, 'city'), ('Roma', 12.50, 41.90, 3, 'city'), ('Atina', 23.73, 37.98, 3, 'city'),
    ('Ankara', 32.85, 39.93, 3, 'city'), ('Rabat', -6.84, 34.02, 3, 'city'), ('Cezayir', 3.06, 36.75, 3, 'city'), ('Tunus', 10.18, 36.81, 3, 'city'), ('Kahire', 31.24, 30.04, 3, 'city'),
    ('Barselona', 2.17, 41.39, 2, 'city'), ('Sevilla', -5.98, 37.39, 2, 'city'), ('Valensiya', -0.38, 39.47, 1, 'city'), ('Lizbon', -9.14, 38.72, 2, 'city'), ('Bilbao', -2.93, 43.26, 1, 'city'),
    ('Lyon', 4.84, 45.76, 2, 'city'), ('Bordeaux', -0.58, 44.84, 1, 'city'), ('Toulouse', 1.44, 43.60, 1, 'city'), ('Ajaccio', 8.74, 41.92, 1, 'city'),
    ('Milano', 9.19, 45.46, 2, 'city'), ('Napoli', 14.25, 40.85, 2, 'city'), ('Palermo', 13.36, 38.12, 1, 'city'), ('Bari', 16.87, 41.12, 1, 'city'), ('Cagliari', 9.11, 39.22, 1, 'city'), ('Venedik', 12.33, 45.44, 1, 'city'),
    ('Selanik', 22.94, 40.64, 2, 'city'), ('Kandiye', 25.13, 35.34, 1, 'city'), ('Patras', 21.73, 38.25, 1, 'city'), ('Tiran', 19.82, 41.33, 1, 'city'),
    ('İstanbul', 28.97, 41.01, 3, 'city'), ('İzmir', 27.14, 38.42, 2, 'city'), ('Antalya', 30.71, 36.89, 1, 'city'), ('Adana', 35.32, 37.00, 1, 'city'), ('Samsun', 36.33, 41.29, 1, 'city'),
    ('Kazablanka', -7.59, 33.57, 2, 'city'), ('Fes', -5.00, 34.03, 2, 'city'), ('Marakeş', -7.99, 31.63, 1, 'city'),
    ('Oran', -0.63, 35.70, 2, 'city'), ('Konstantin', 6.61, 36.36, 1, 'city'), ('Biskra', 5.73, 34.85, 1, 'city'),
    ('Trablus', 13.19, 32.89, 2, 'city'), ('Sfaks', 10.76, 34.74, 1, 'city'), ('Bingazi', 20.07, 32.12, 1, 'city'),
    ('İskenderiye', 29.92, 31.20, 2, 'city'), ('Port Said', 32.30, 31.26, 1, 'city'),
    ('Zagreb', 15.98, 45.81, 1, 'city'), ('Lefkoşa', 33.36, 35.17, 1, 'city'), ('Sofya', 23.32, 42.70, 1, 'city'),
    ('Cebelitarık', -5.35, 36.14, 1, 'castle'), ('Nice', 7.27, 43.70, 1, 'castle'), ('Messina', 15.55, 38.19, 1, 'castle'), ('Rodos', 28.22, 36.43, 1, 'castle'),
    ('Çanakkale', 26.40, 40.15, 1, 'castle', 'kirmizi'), ('Tanca', -5.81, 35.76, 1, 'castle'), ('Annaba', 7.77, 36.90, 1, 'castle'), ('Bizerte', 9.87, 37.27, 1, 'castle'),
    ('Mersa Matruh', 27.24, 31.35, 1, 'castle'), ('Split', 16.44, 43.51, 1, 'castle'), ('Valletta', 14.51, 35.90, 1, 'castle'), ('Zaragoza', -0.88, 41.65, 1, 'castle'),
  ]}
maps = [build(IBER), build(ITALY), build(BALKAN), build(WEST), build(EAST), build(EUROPE), build(NORTH), build(AFRICA), build(NORDIC), build(MED)]
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'maps.json')
json.dump(maps, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('wrote', out, os.path.getsize(out), file=sys.stderr)
