"""Tarayıcı: kule inşaatı, ticaret, atlı takibi göstergesi, general bonusu kartı."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'): kw['executable_path'] = os.environ['CHROME']
        br = await p.chromium.launch(**kw)
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.add_init_script('window.__sancakNoOffers = true')
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.startGame(0,0,"sari")}'); await pg.wait_for_timeout(900)
        # başkent: ticaret
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;const f=G.factions[G.player];f.gold=300;f.food=40;f.iron=4;const c=G.cells.find(c=>c.cap&&c.f===G.player);__sancak.tapCell(c.i)}')
        await pg.wait_for_timeout(200)
        if await pg.locator('#uCell').count(): await pg.click('#uCell'); await pg.wait_for_timeout(200)
        g0 = await pg.evaluate('()=>__sancak.B().G.factions[__sancak.B().G.player].gold')
        await pg.click('[data-tr="sellFood"]'); await pg.wait_for_timeout(200)
        g1 = await pg.evaluate('()=>__sancak.B().G.factions[__sancak.B().G.player].gold')
        assert g1 == g0 + 12, (g0, g1)
        await shot('t1-trade')
        # geri al: ticareti geri al
        await pg.click('#pUndo'); await pg.wait_for_timeout(200)
        g2 = await pg.evaluate('()=>__sancak.B().G.factions[__sancak.B().G.player].gold')
        assert g2 == g0, ('geri alma çalışmadı', g0, g2)
        # yürüyüşü geri al
        mv = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G;const u=G.units.find(u=>u.f===G.player&&u.mp>0&&u.type!=="kule");const c0=u.c;__sancak.tapCell(u.c);
          const k=Object.keys(B.reach).map(Number).find(k=>k!==u.c&&!G.units.some(x=>x.c===k)&&G.cells[k].t);__sancak.tapCell(k);return [u.id,c0,k]}''')
        await pg.wait_for_timeout(800)
        await pg.click('#pUndo'); await pg.wait_for_timeout(200)
        back = await pg.evaluate(f'()=>__sancak.B().G.units.find(u=>u.id=={mv[0]}).c')
        assert back == mv[1], ('yürüyüş geri alınmadı', mv, back)
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;const c=G.cells.find(c=>c.cap&&c.f===G.player);__sancak.tapCell(c.i)}')
        await pg.wait_for_timeout(200)
        if await pg.locator('#uCell').count(): await pg.click('#uCell'); await pg.wait_for_timeout(200)
        await pg.click('[data-tr="sellFood"]'); await pg.wait_for_timeout(200)
        # boş araziye kule
        ci = await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;const c=G.cells.find(c=>c.t===1&&c.f===G.player&&!G.units.some(u=>u.c===c.i));__sancak.tapCell(c.i);return c.i}')
        await pg.wait_for_timeout(200); await shot('t2-land')
        await pg.click('[data-tower]'); await pg.wait_for_timeout(400)
        b = await pg.evaluate(f'()=>{{const u=__sancak.B().G.units.find(u=>u.c=={ci});return u&&[u.type,u.build]}}')
        assert b == ['kule', 2], b
        await pg.evaluate(f'()=>__sancak.tapCell({ci})'); await pg.wait_for_timeout(300); await shot('t3-site')
        # general ata ve kartı gör
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;const u=G.units.find(u=>u.f===G.player&&u.type==="kilic");__sancak.tapCell(u.c)}'); await pg.wait_for_timeout(200)
        if await pg.locator('#uAssign').count():
            await pg.click('#uAssign'); await pg.wait_for_timeout(200); await pg.click('[data-g]'); await pg.wait_for_timeout(300)
        await shot('t4-general')
        # iki tur geç: kule tamam
        for k in range(2):
            await pg.evaluate('()=>__sancak.endPlayerTurn()'); await pg.click('#aiSkip')
            for i in range(80):
                await pg.wait_for_timeout(150)
                if await pg.evaluate('()=>__sancak.B().phase') != 'ai': break
        b = await pg.evaluate(f'()=>{{const u=__sancak.B().G.units.find(u=>u.c=={ci});return u&&[u.type,u.build]}}')
        print('kule durumu', b)
        # tur başında kamera son hamleye döner
        await pg.wait_for_timeout(900)
        far = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G;const c=G.cells[B.lastAct];const t={x:B.cam.x,y:B.cam.y};B.cam.x=c.x;B.cam.y=c.y;__sancak.clamp();const d=Math.hypot(t.x-B.cam.x,t.y-B.cam.y);B.cam.x=t.x;B.cam.y=t.y;return d}''')
        print('kamera uzaklığı', round(far, 2)); assert far < 1.5, 'kamera son hamleye dönmedi'
        await pg.evaluate(f'()=>{{const B=__sancak.B(),G=B.G,c=G.cells[{ci}];B.cam.x=c.x;B.cam.y=c.y;__sancak.tapCell({ci})}}'); await pg.wait_for_timeout(400); await shot('t5-tower')
        print('HATALAR', errs); assert not errs
        assert b is None or b[1] == 0, 'kule 2 turda bitmedi'
        await br.close()
asyncio.run(main())
