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
        pg.on('pageerror', lambda e: errs.append(str(e) + ' ' + (e.stack or '')[:600]))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.add_init_script('window.__sancakNoOffers = true')
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(400)
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.startGame(0,1,"turuncu")}'); await pg.wait_for_timeout(1200)
        await shot('i1')
        # Napoli limanından denize bin
        r = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G;const c=G.cells.find(c=>c.cap&&c.f===G.player);
          let u=G.units.find(u=>u.c===c.i); __sancak.tapCell(c.i);
          const sea=Object.keys(B.reach).map(Number).filter(k=>G.cells[k].t===0);
          if(sea.length){__sancak.tapCell(sea[0]);}
          return {port:c.port,sea:sea.length,u:u&&u.id}}''')
        print(r); await pg.wait_for_timeout(900)
        emb = await pg.evaluate(f'()=>{{const u=__sancak.B().G.units.find(u=>u.id=={r["u"]});return u&&u.emb}}')
        print('nakliyede', emb)
        await shot('i2')
        # kadırga al
        await pg.evaluate('()=>{const B=__sancak.B(),G=B.G;G.factions[G.player].gold=500;G.factions[G.player].iron=9;const c=G.cells.find(c=>c.cap&&c.f===G.player);__sancak.tapCell(c.i)}')
        await pg.wait_for_timeout(200)
        k = pg.locator('[data-rec="kadirga"]:not(.off)')
        print('kadırga alınabilir', await k.count())
        if await k.count(): await k.click(); await pg.wait_for_timeout(300)
        await shot('i3')
        print('HATALAR', errs)
        assert emb == 1, 'nakliyeye binilemedi'
        assert not errs
        await br.close()
asyncio.run(main())
