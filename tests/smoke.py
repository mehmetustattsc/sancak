"""Tarayıcı testi: menüler, sefer başlatma, seçim, hareket, saldırı, şehir paneli, tur sonu, rakip turu, kayıt."""
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
CHROME = os.environ.get('CHROME')
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if CHROME: kw['executable_path'] = CHROME
        br = await p.chromium.launch(**kw)
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(500)
        async def shot(n):
            if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, n + '.png'))
        await shot('01-home')
        await pg.click('.era[data-era="0"]'); await pg.wait_for_timeout(300); await shot('02-era')
        await pg.click('.lvl[data-l="0"]'); await pg.wait_for_timeout(300); await shot('03-setup')
        await pg.click('#sGo'); await pg.wait_for_timeout(1500); await shot('04-battle')
        # birlik seç
        info = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G;
          const u=G.units.filter(u=>u.f===G.player)[0];
          const r=B.cam,W=innerWidth;const c=G.cells[u.c];
          return {id:u.id,x:(c.x-r.x)*r.s+W/2,y:(c.y-r.y)*r.s+B.oy}}''')
        for i in range(5):
            if await pg.locator('#tipNext').is_visible(): await pg.click('#tipNext')
        await pg.mouse.click(info['x'], info['y']); await pg.wait_for_timeout(300); await shot('05-select')
        sel = await pg.evaluate('()=>__sancak.B().sel')
        assert sel == info['id'], ('seçim olmadı', sel, info)
        # ulaşılabilir bir hücreye yürü
        mv = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,u=G.units.find(x=>x.id===B.sel);
          const ks=Object.keys(B.reach).map(Number).filter(k=>k!==u.c&&!G.units.some(x=>x.c===k)&&G.cells[k].t);
          if(!ks.length) return null; const k=ks[0],c=G.cells[k],r=B.cam;
          return {k:k,x:(c.x-r.x)*r.s+innerWidth/2,y:(c.y-r.y)*r.s+B.oy}}''')
        if mv:
            await pg.mouse.click(mv['x'], mv['y']); await pg.wait_for_timeout(900); await shot('06-moved')
            pos = await pg.evaluate(f'()=>__sancak.B().G.units.find(u=>u.id=={info["id"]}).c')
            assert pos == mv['k'], ('hareket olmadı', pos, mv)
        # general ata
        if await pg.locator('#uAssign').count():
            await pg.click('#uAssign'); await pg.wait_for_timeout(200); await pg.click('[data-g]'); await pg.wait_for_timeout(300)
            g = await pg.evaluate(f'()=>__sancak.B().G.units.find(u=>u.id=={info["id"]}).gen')
            assert g, 'general atanmadı'
        await shot('07-general')
        # şehir paneli: başkenti aç, asker al
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;G.factions[G.player].gold=500;const c=G.cells.find(c=>c.cap&&c.f===G.player);__sancak.tapCell(c.i);const u=G.units.find(u=>u.c===c.i);if(u)__sancak.tapCell(c.i)}')
        await pg.wait_for_timeout(200)
        if await pg.locator('#uCell').count(): await pg.click('#uCell'); await pg.wait_for_timeout(200)
        await shot('08-city')
        n0 = await pg.evaluate('()=>__sancak.B().G.units.length')
        btn = pg.locator('[data-rec="kilic"]:not([disabled])')
        if await btn.count(): await btn.click(); await pg.wait_for_timeout(200)
        up = pg.locator('[data-up="city"]:not([disabled])')
        if await up.count(): await up.click(); await pg.wait_for_timeout(200)
        n1 = await pg.evaluate('()=>__sancak.B().G.units.length')
        print('birlik sayısı', n0, '->', n1)
        await shot('09-recruit')
        # saldırı: menzildeki bir hedefi zorla bul
        atk = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G;for(const u of G.units.filter(u=>u.f===G.player&&!u.acted)){
            for(const e of G.units){ if(canAttack(G,u,e)) return {u:u.id,e:e.id,uc:u.c,ec:e.c}; } } return null}''')
        print('saldırı adayı', atk)
        if atk:
            await pg.evaluate(f'()=>{{__sancak.tapCell({atk["uc"]});__sancak.tapCell({atk["ec"]});}}'); await pg.wait_for_timeout(300); await shot('10-preview')
            await pg.click('#pvGo'); await pg.wait_for_timeout(1200); await shot('11-attacked')
        # tur sonu ve rakip turu
        await pg.click('#pEnd'); await pg.wait_for_timeout(150)
        if await pg.locator('#pEnd.warn').count():
            await shot('12a-confirm'); await pg.click('#pEnd')
        await pg.wait_for_timeout(1200); await shot('12-ai')
        await pg.click('#aiSkip')
        for i in range(60):
            await pg.wait_for_timeout(250)
            ph = await pg.evaluate('()=>__sancak.B()&&__sancak.B().phase')
            if ph == 'player': break
        t = await pg.evaluate('()=>__sancak.B().G.turn'); print('tur', t, 'faz', ph)
        assert ph == 'player' and t == 2
        await shot('13-turn2')
        saved = await pg.evaluate('()=>!!localStorage.getItem("sancak-v2-game")')
        assert saved, 'kayıt yok'
        # 6 tur daha atla
        for k in range(6):
            await pg.evaluate('()=>__sancak.endPlayerTurn()')
            await pg.click('#aiSkip')
            for i in range(80):
                await pg.wait_for_timeout(150)
                ph = await pg.evaluate('()=>__sancak.B()?__sancak.B().phase:"none"')
                if ph != 'ai': break
            if ph != 'player': break
        print('son tur', await pg.evaluate('()=>__sancak.B()&&__sancak.B().G.turn'), ph)
        await shot('14-later')
        # menüler (sefer bittiyse sonuç ekranından çık)
        await pg.wait_for_timeout(900)
        if await pg.locator('#rMenu').count():
            await shot('15-result'); await pg.click('#rMenu'); await pg.wait_for_timeout(300)
        elif await pg.locator('#hPause').count():
            await pg.click('#hPause'); await pg.wait_for_timeout(200); await shot('15-menu'); await pg.click('#pQuit'); await pg.wait_for_timeout(300)
        await pg.click('#tabbar [data-go="home"]'); await pg.wait_for_timeout(300); await shot('16-home-resume')
        await pg.click('#tabbar [data-go="hq"]'); await pg.wait_for_timeout(200); await shot('17a-hq')
        await pg.evaluate('()=>{__sancak.save().medals=200}'); await pg.click('#tabbar [data-go="gen"]'); await pg.click('#tabbar [data-go="hq"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-hq="kilic"]'); await pg.wait_for_timeout(200)
        lv = await pg.evaluate('()=>__sancak.save().upg.kilic'); assert lv == 1, lv
        await shot('17b-hq-bought')
        await pg.click('#tabbar [data-go="gen"]'); await pg.wait_for_timeout(200); await shot('17-gen')
        await pg.click('#tabbar [data-go="help"]'); await pg.wait_for_timeout(200); await shot('18-help')
        print('HATALAR', errs)
        assert not errs
        await br.close()
asyncio.run(main())
