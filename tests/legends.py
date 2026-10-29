"""Efsaneler: sefer sonu sürpriz ekranı, kurulumda en fazla 4 general, efsane savaşta; moral okları."""
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
        # yeni oyuncu: hiç efsane yok; bir zafer Selahaddin'i, 25 atlı zaferi Cengiz'i açar
        await pg.evaluate('()=>{const s=__sancak.save();s.tut=true;s.ls={cavK:24};s.leg={};__sancak.startGame(0,0,"sari")}'); await pg.wait_for_timeout(600)
        await pg.evaluate('()=>{const G=__sancak.B().G;G.stats.cavK=1;__sancak.finish(true,false,false)}'); await pg.wait_for_timeout(500)
        await shot('L1-reveal')
        t = await pg.evaluate('()=>document.querySelector(".mbox.reveal h2").textContent'); print('sürpriz', t)
        assert 'Selahaddin' in t or 'Cengiz' in t
        k = 0
        while await pg.locator('#rvOk').count():
            await pg.click('#rvOk'); await pg.wait_for_timeout(250); k += 1
            if k == 1: await shot('L2-reveal2')
        print('sürpriz sayısı', k)
        assert await pg.locator('.result').is_visible(), 'sonuç ekranı görünmeli'
        leg = await pg.evaluate('()=>__sancak.save().leg'); print('açılan', leg); assert leg.get('selahaddin') and leg.get('cengiz')
        # ikinci kez bitirince (fethe devam) sayaç iki kez eklenmemeli
        n = await pg.evaluate('()=>{const s=__sancak.save();const w=s.ls.wins;const G=__sancak.B().G;G.endless=true;G.stars0=3;G.cities0=0;G.kills0=0;__sancak.finish(true,false,true);return [w,s.ls.wins]}')
        print('zafer sayacı', n); assert n[0] == n[1]
        await pg.evaluate('()=>{document.querySelector("#modal").hidden=true;__sancak.show("home")}')
        # kurulum: 5 aday var, en fazla 4 seçilir
        await pg.evaluate('()=>{const s=__sancak.save();s.stars={"0-0":3,"0-1":3};s.gsel=null;__sancak.openEra(0);__sancak.openSetup(0,0)}'); await pg.wait_for_timeout(300)
        nsel = await pg.evaluate('()=>document.querySelectorAll("[data-gs].on").length'); print('seçili', nsel); assert nsel == 4
        await pg.evaluate('()=>document.querySelector("[data-gs].leg:not(.on)").click()'); await pg.wait_for_timeout(200)
        assert await pg.evaluate('()=>document.querySelectorAll("[data-gs].on").length') == 4, '4ten fazla seçilmemeli'
        await pg.evaluate('()=>document.querySelector("[data-gs]:not(.leg).on").click()'); await pg.wait_for_timeout(150)
        await pg.evaluate('()=>document.querySelector("[data-gs].leg:not(.on)").click()'); await pg.wait_for_timeout(150)
        await pg.evaluate('()=>document.querySelector("[data-gs].leg.on").scrollIntoView()'); await shot('L3-setup')
        await pg.click('#sGo'); await pg.wait_for_timeout(700)
        gs = await pg.evaluate('()=>__sancak.B().G.factions[__sancak.B().G.player].generals.map(g=>g.name+(g.legend?"*":""))'); print('generaller', gs)
        assert len(gs) == 4 and any(g.endswith('*') for g in gs)
        # efsaneyi bir birliğe ata, çevresine düşman koy: moral okları
        r = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;const L=G.factions[P].generals.find(g=>g.legend);
          const u=G.units.find(u=>u.f===P);u.gen=L.id;L.unit=u.id;const c=G.cells[u.c];
          const free=c.nb.filter(j=>G.cells[j].t&&!G.units.some(x=>x.c===j));
          const en=G.factions.findIndex((f,i)=>i!==P);
          free.slice(0,4).forEach(j=>G.units.push({id:G.nextId++,f:en,type:"kilic",c:j,hp:100,lvl:1,mp:1,acted:false,kills:0,gen:0,emb:0}));
          __sancak.tapCell(u.c);return [L.name,free.length]}''')
        print('efsane', r); await pg.wait_for_timeout(400); await shot('L4-battle')
        await pg.evaluate('()=>{__sancak.show("gen");}'); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{__sancak.renderGenerals();const e=[...document.querySelectorAll(".eyebrow")].find(x=>/Efsaneler/.test(x.textContent));e&&e.scrollIntoView()}'); await pg.wait_for_timeout(300)
        await shot('L5-gentab')
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
