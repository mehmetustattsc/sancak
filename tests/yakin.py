"""Yakın Çağ: çağ açık, Batı Avrupa kurulumu, çağ birlikleri (Piyade/Topçu/Süvari), ikmal oku, birkaç tur."""
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
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.show("home")}'); await pg.wait_for_timeout(200)
        await pg.evaluate('()=>document.querySelector(".era[data-era=\\"1\\"]").scrollIntoView()'); await shot('Y0-home')
        await pg.click('.era[data-era="1"]'); await pg.wait_for_timeout(300); await shot('Y1-era')
        names = await pg.evaluate('()=>[...document.querySelectorAll(".tcard .tn")].map(x=>x.textContent)'); print('birlikler', names)
        assert names == ['Piyade', 'Topçu', 'Süvari']
        await pg.click('.lvl[data-l="0"]'); await pg.wait_for_timeout(300)
        txt = await pg.evaluate('()=>document.querySelector("#modal").textContent'); assert 'Batı Avrupa' in txt and 'ikmal' in txt
        await pg.click('[data-f="siyah"]'); await pg.wait_for_timeout(150); await shot('Y2-setup')
        await pg.click('#sGo'); await pg.wait_for_timeout(1200); await shot('Y3-start')
        gens = await pg.evaluate('()=>__sancak.B().G.factions[__sancak.B().G.player].generals.map(g=>g.name)'); print('generaller', gens)
        # bir piyadeyi şehirlerden uzağa koy: ikmalsiz (mavi ok)
        r = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;
          const far=G.cells.find(c=>c.t&&!G.units.some(u=>u.c===c.i)&&!G.cells.some(o=>(o.t===3||o.t===4)&&o.f===P&&Math.max(...[0])>=0&&__dist(o,c)<=3));
          return far?far.i:-1}'''.replace('__dist(o,c)', 'Math.max(Math.abs(((o.q-(o.r-(o.r&1))/2))-((c.q-(c.r-(c.r&1))/2))),Math.abs(o.r-c.r),Math.abs(((o.q-(o.r-(o.r&1))/2)+o.r)-((c.q-(c.r-(c.r&1))/2)+c.r)))'))
        print('uzak hücre', r)
        if r >= 0:
            mi = await pg.evaluate(f'''()=>{{const B=__sancak.B(),G=B.G,P=G.player;G.units.push({{id:G.nextId++,f:P,type:"kilic",c:{r},hp:100,lvl:1,mp:0,acted:true,kills:0,gen:0,emb:0}});
              const u=G.units[G.units.length-1];__sancak.tapCell({r});return moraleInfo(G,u).ups}}''')
            print('moral', mi); assert 'ikmal' in mi
            await pg.wait_for_timeout(300); await shot('Y4-supply')
        for t in range(2):
            await pg.evaluate('()=>__sancak.endPlayerTurn()')
            if await pg.locator('#aiSkip').count(): await pg.click('#aiSkip')
            for i in range(150):
                await pg.wait_for_timeout(150)
                if await pg.evaluate('()=>__sancak.B().phase') == 'player': break
        await shot('Y5-turn3')
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
