"""%60 zaferinden sonra devam: tur sınırı kalkar, tam fetihte ikinci sonuç ekranı."""
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
        async def shot(n):
            if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], n + '.png'))
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{__sancak.save().tut=true;__sancak.startGame(0,0,"sari")}'); await pg.wait_for_timeout(700)
        # şehirlerin çoğunu oyuncuya ver, bir boş düşman şehrine yürüyerek %60'ı geç
        r = await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;
          const all=G.cells.filter(c=>c.t===3), need=Math.ceil(all.length*0.6);
          const t=all.find(c=>c.f!==P&&c.f>=0&&c.nb.some(j=>G.cells[j].t));
          G.units=G.units.filter(u=>u.c!==t.i);
          let mine=all.filter(c=>c.f===P).length;
          for(const c of all){ if(mine>=need-1) break; if(c.f!==P&&c!==t&&c.f!==t.f){c.f=P;mine++;} }
          for(const c of all){ if(mine>=need-1) break; if(c.f!==P&&c!==t){c.f=P;mine++;} }
          const nb=t.nb.find(j=>G.cells[j].t);G.units=G.units.filter(u=>u.c!==nb);G.cells[nb].f=P;
          const u={id:G.nextId++,f:P,type:"atli",c:nb,hp:100,lvl:1,mp:2,acted:false,kills:0,gen:0,emb:0};G.units.push(u);
          __sancak.tapCell(nb);__sancak.tapCell(t.i);return [mine,need,G.over]}''')
        print('kurulum', r)
        await pg.wait_for_timeout(2000); await shot('E1-win')
        assert await pg.locator('#rCont').count(), 'devam düğmesi yok'
        await pg.click('#rCont'); await pg.wait_for_timeout(400)
        st = await pg.evaluate('()=>{const G=__sancak.B().G;return [G.over,G.endless,__sancak.B().phase]}')
        print('devam', st); assert st == [0, True, 'player']
        # tur sınırını geçse de kaybetmemeli
        await pg.evaluate('()=>{__sancak.B().G.turn=__sancak.B().G.limit+2}')
        await pg.evaluate('()=>__sancak.endPlayerTurn()'); await pg.click('#aiSkip')
        for i in range(80):
            await pg.wait_for_timeout(150)
            if await pg.evaluate('()=>__sancak.B().phase') != 'ai': break
        ov = await pg.evaluate('()=>__sancak.B().G.over'); print('sınırdan sonra over', ov); assert ov in (0, 1)
        # bütün rakipleri yık
        await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;G.cells.forEach(c=>{if(c.t===3&&c.f!==P)c.f=P});G.units=G.units.filter(u=>u.f===P);
          const t=G.cells.find(c=>c.t===4&&c.f!==P)||G.cells.find(c=>c.t===1&&c.f!==P);G.factions.forEach((f,i)=>{if(i!==P)f.alive=true});
          const left=G.factions.findIndex((f,i)=>i!==P);G.cells.find(c=>c.cap&&c.t===3).f=left;}''')
        await pg.evaluate('''()=>{const B=__sancak.B(),G=B.G,P=G.player;const c=G.cells.find(c=>c.t===3&&c.f!==P);
          const nb=c.nb.find(j=>G.cells[j].t&&!G.units.some(u=>u.c===j));G.cells[nb].f=P;
          const u={id:G.nextId++,f:P,type:"atli",c:nb,hp:100,lvl:1,mp:2,acted:false,kills:0,gen:0,emb:0};G.units.push(u);
          G.factions.forEach((f,i)=>{if(i!==P&&i!==c.f)f.alive=false});__sancak.tapCell(nb);__sancak.tapCell(c.i);}''')
        await pg.wait_for_timeout(2000); await shot('E2-full')
        h = await pg.evaluate('()=>document.querySelector("#modal h2")&&document.querySelector("#modal h2").textContent')
        print('ikinci sonuç', h); assert h == 'TAM FETİH'
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
