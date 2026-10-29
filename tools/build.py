"""Tek dosyalık oyun: src/* -> dist/index.html (+ PWA için docs kopyası)"""
import os, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
t = rd('src/index.html')
for k, v in [('/*CSS*/', rd('src/style.css')), ('/*MAPS*/', rd('src/maps.json')), ('/*ENGINE*/', rd('src/engine.js')), ('/*ART*/', rd('src/art.js')), ('/*UI*/', rd('src/ui.js'))]:
    assert t.count(k) == 1, k
    t = t.replace(k, v)
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)
# artifact sürümü (iskelet yayın sırasında eklenir)
open(os.path.join(R, 'dist', 'sancak.html'), 'w', encoding='utf-8').write(t)
# web sürümü: tam belge + PWA bağlantıları
head = ('<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Sancak">\n'
        '<meta name="description" content="Avrupa haritasında sıra tabanlı strateji oyunu.">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box;height:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n')
i = t.index('<div id="app">')
web = head + t[:i] + '\n<script>if("serviceWorker" in navigator)addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});</script>\n</head>\n<body>\n' + t[i:] + '\n</body>\n</html>\n'
os.makedirs(os.path.join(R, 'web'), exist_ok=True)
open(os.path.join(R, 'web', 'index.html'), 'w', encoding='utf-8').write(web)
import shutil, hashlib
h = hashlib.sha1(web.encode()).hexdigest()[:10]
for f in ['manifest.webmanifest']:
    shutil.copy(os.path.join(R, 'public', f), os.path.join(R, 'web', f))
open(os.path.join(R, 'web', 'sw.js'), 'w').write(open(os.path.join(R, 'public', 'sw.js')).read().replace('__BUILD__', h))
shutil.copytree(os.path.join(R, 'public', 'icons'), os.path.join(R, 'web', 'icons'), dirs_exist_ok=True)
print('dist/sancak.html', len(t), 'web/index.html', len(web))
