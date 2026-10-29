"""Yatay ekran: panel yanda, harita geniş; dikey: sade üst bilgi."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'): kw['executable_path'] = os.environ['CHROME']
        br = await p.chromium.launch(**kw)
        ctx = await br.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.startGame(0,0,"sari")}'); await pg.wait_for_timeout(900)
        await shot('L1-map')
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;G.factions[G.player].gold=400;const c=G.cells.find(c=>c.cap&&c.f===G.player);B.view=c.i;__sancak.tapCell(G.cells.find(x=>x.t===1&&x.f===G.player&&!G.units.some(u=>u.c===x.i)).i)}')
        await pg.wait_for_timeout(300); await shot('L2-land')
        side = await pg.evaluate('()=>{const r=document.getElementById("panel").getBoundingClientRect();return [r.left,r.width,innerWidth]}')
        print('panel', side)
        assert side[0] > side[2] * 0.5, 'yatayda panel sağda olmalı'
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;const u=G.units.find(u=>u.f===G.player);__sancak.tapCell(u.c)}'); await pg.wait_for_timeout(300); await shot('L3-unit')
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
