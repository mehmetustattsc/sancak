"""Diplomasi ekranı: ittifak teklifi, şehir satın alma, müttefik işaretleri, ihanet onayı, bot teklifi."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'): kw['executable_path'] = os.environ['CHROME']
        br = await p.chromium.launch(**kw)
        pg = await (await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True)).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.add_init_script('window.__sancakNoOffers = true')
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.startGame(0,0,"sari")}'); await pg.wait_for_timeout(800)
        await pg.evaluate('()=>{const G=__sancak.B().G;G.factions[G.player].gold=900}')
        await pg.click('#hDip'); await pg.wait_for_timeout(300); await shot('D1-list')
        # en zayıf ülkeyle masa
        fi = await pg.evaluate('''()=>{const G=__sancak.B().G;let b=-1,m=1e9;G.factions.forEach((f,i)=>{if(i!==G.player&&f.alive){const n=G.cells.filter(c=>c.t===3&&c.f===i).length;if(n<m){m=n;b=i}}});return b}''')
        await pg.click(f'[data-fi="{fi}"]'); await pg.wait_for_timeout(300); await shot('D2-table')
        # ittifak + altın artır, kabul edene kadar
        for i in range(30):
            if await pg.locator('#tGo:not([disabled])').count(): break
            await pg.click('[data-k="give"][data-r="gold"][data-d="1"]'); await pg.wait_for_timeout(40)
        await shot('D3-ready')
        await pg.click('#tGo'); await pg.wait_for_timeout(1200)
        al = await pg.evaluate(f'()=>__sancak.B().G.ally[__sancak.B().G.player][{fi}]>=__sancak.B().G.turn')
        print('ittifak', al); assert al
        await shot('D4-allied')
        # başka ülkeden şehir satın al
        f2 = await pg.evaluate(f'''()=>{{const G=__sancak.B().G;return G.factions.findIndex((f,i)=>i!==G.player&&i!=={fi}&&f.alive&&G.cells.some(c=>c.t===3&&c.f===i&&!c.cap))}}''')
        await pg.click('#hDip'); await pg.wait_for_timeout(200); await pg.click(f'[data-fi="{f2}"]'); await pg.wait_for_timeout(200)
        await pg.click('#tAlly'); await pg.wait_for_timeout(100)
        await pg.click('[data-k="get"].cchip'); await pg.wait_for_timeout(100)
        for i in range(60):
            if await pg.locator('#tGo:not([disabled])').count(): break
            await pg.click('[data-k="give"][data-r="gold"][data-d="1"]'); await pg.wait_for_timeout(30)
        n0 = await pg.evaluate('()=>__sancak.B().G.cells.filter(c=>c.t===3&&c.f===__sancak.B().G.player).length')
        await pg.click('#tGo'); await pg.wait_for_timeout(1200)
        n1 = await pg.evaluate('()=>__sancak.B().G.cells.filter(c=>c.t===3&&c.f===__sancak.B().G.player).length')
        print('şehir', n0, '->', n1); assert n1 == n0 + 1
        # ihanet onayı: müttefik boş şehrine komşu birlik koy
        r = await pg.evaluate(f'''()=>{{const B=__sancak.B(),G=B.G,P=G.player;const c=G.cells.find(x=>(x.t===3||x.t===4)&&x.f==={fi});if(!c)return null;
          G.units=G.units.filter(u=>u.c!==c.i);const nb=c.nb.find(j=>G.cells[j].t);G.units=G.units.filter(u=>u.c!==nb);
          const u={{id:G.nextId++,f:P,type:"kilic",c:nb,hp:100,lvl:1,mp:1,acted:false,kills:0,gen:0,emb:0}};G.units.push(u);
          __sancak.tapCell(nb);__sancak.tapCell(c.i);return c.i}}''')
        await pg.wait_for_timeout(300); await shot('D5-betray')
        if r is not None:
            assert await pg.locator('#bYes').count(), 'ihanet onayı çıkmadı'
            await pg.click('#bYes'); await pg.wait_for_timeout(900)
            st = await pg.evaluate(f'()=>{{const G=__sancak.B().G;return [G.cells[{r}].f===G.player, G.ally[G.player][{fi}]>=G.turn]}}')
            print('ihanet', st); assert st == [True, False]
        # bağlı krallık: bir ülkeyi zayıflat, ilhak et
        w = await pg.evaluate(f'''()=>{{const B=__sancak.B(),G=B.G,P=G.player;const t=G.factions.findIndex((f,i)=>i!==P&&f.alive&&i!=={fi}&&i!=={f2});
          G.cells.forEach(c=>{{if(c.f===t&&c.t===3&&!c.cap)c.f=P}});G.units=G.units.filter(u=>u.f!==t||G.cells[u.c].cap);G.recentLoss=G.recentLoss||[];G.recentLoss[t]=G.turn;G.factions[P].gold=999;return t}}''')
        await pg.click('#hDip'); await pg.wait_for_timeout(200); await pg.click(f'[data-fi="{w}"]'); await pg.wait_for_timeout(200); await shot('D6-annex')
        await pg.click('#tAnnex'); await pg.wait_for_timeout(1000)
        gone = await pg.evaluate(f'()=>!__sancak.B().G.factions[{w}].alive'); print('ilhak', gone); assert gone
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
