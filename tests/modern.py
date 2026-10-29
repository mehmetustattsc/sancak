"""Modern Çağ: Avrupa haritası, çağ birlikleri (Piyade/Roketatar/Tank), hava saldırısı düğmesi ve etkisi, botların turları."""
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
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.show("home")}')
        await pg.click('.era[data-era="2"]'); await pg.wait_for_timeout(300); await shot('M1-era')
        names = await pg.evaluate('()=>[...document.querySelectorAll(".tcard .tn")].map(x=>x.textContent)'); print('birlikler', names)
        assert names == ['Piyade', 'Roketatar', 'Tank']
        await pg.click('.lvl[data-l="0"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-f="kirmizi"]'); await pg.click('#sGo'); await pg.wait_for_timeout(1200); await shot('M2-start')
        # düşman birliğini başkentin yanına koy, seç, hava saldırısı
        r = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;const cap=G.cells.find(c=>c.cap&&c.f===P);
          const j=cap.nb.find(j=>G.cells[j].t&&!G.units.some(u=>u.c===j));const en=G.factions.findIndex((f,i)=>i!==P);
          G.units.push({id:G.nextId++,f:en,type:"atli",c:j,hp:100,lvl:1,mp:0,acted:true,kills:0,gen:0,emb:0});__sancak.tapCell(j);return j}''')
        await pg.wait_for_timeout(300); await shot('M3-air')
        assert await pg.locator('#uAir').count() == 1, 'hava saldırısı düğmesi yok'
        await pg.click('#uAir'); await pg.wait_for_timeout(1800)
        hp = await pg.evaluate(f'()=>{{const u=__sancak.B().G.units.find(u=>u.c=={r});return u&&u.hp}}'); print('can', hp); assert hp is not None and hp < 100
        assert await pg.locator('#uAir').count() == 0, 'turda bir kez'
        await shot('M4-after')
        for t in range(2):
            await pg.evaluate('()=>__sancak.endPlayerTurn()')
            if await pg.locator('#aiSkip').count(): await pg.click('#aiSkip')
            for i in range(200):
                await pg.wait_for_timeout(150)
                if await pg.evaluate('()=>__sancak.B().phase') == 'player': break
        await shot('M5-turn3')
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
