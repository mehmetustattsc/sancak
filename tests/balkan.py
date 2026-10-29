"""Balkanlar ve Anadolu: kurulum (hikâye, beylik adı), büyük harita açılış ekranı, birkaç tur bot."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'): kw['executable_path'] = os.environ['CHROME']
        br = await p.chromium.launch(**kw)
        pg = await (await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.add_init_script('window.__sancakNoOffers = true')
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        # kilit: önceki sefer kazanılmadan açılmaz
        await pg.evaluate('()=>{const s=__sancak.save();s.tut=true;s.stars={};__sancak.openEra(0)}'); await pg.wait_for_timeout(300)
        assert await pg.locator('.lvl[data-l="2"].locked').count() == 1, 'üçüncü sefer kilitli olmalı'
        await pg.evaluate('()=>{const s=__sancak.save();s.stars={"0-0":2,"0-1":1};__sancak.openEra(0)}'); await pg.wait_for_timeout(300)
        assert await pg.locator('.lvl[data-l="2"]:not(.locked)').count() == 1, 'üçüncü sefer açılmalı'
        await shot('B0-era')
        await pg.click('.lvl[data-l="2"]'); await pg.wait_for_timeout(300)
        txt = await pg.evaluate('()=>document.querySelector("#modal").textContent')
        assert 'Kızıl Beylik' in txt and 'Boğaz' in txt, 'beylik adı ve hikâye görünmeli'
        await pg.click('[data-f="kirmizi"]'); await pg.wait_for_timeout(200); await shot('B1-setup')
        await pg.click('#sGo'); await pg.wait_for_timeout(1200); await shot('B2-start')
        await pg.click('#hFit'); await pg.wait_for_timeout(300); await shot('B3-fit')
        await pg.click('#hFit'); await pg.wait_for_timeout(300)
        # 3 tur: bot oyuncu yerine oynar, hata yok
        for t in range(3):
            await pg.evaluate('()=>__sancak.endPlayerTurn()')
            if await pg.locator('#aiSkip').count(): await pg.click('#aiSkip')
            for i in range(120):
                await pg.wait_for_timeout(150)
                if await pg.evaluate('()=>__sancak.B().phase') == 'player': break
        st = await pg.evaluate('()=>{const G=__sancak.B().G;return [G.turn,G.cells.filter(c=>c.t).length,G.factions.length]}')
        print('durum', st); assert st[0] >= 4 and st[1] > 120 and st[2] == 8
        await shot('B4-turn4')
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
