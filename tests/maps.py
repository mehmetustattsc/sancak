"""Her çağın her seferi: açılır, ilk ekran çizilir, bir bot turu hatasız oynanır. Yeni haritalar otomatik kapsanır."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'): kw['executable_path'] = os.environ['CHROME']
        br = await p.chromium.launch(**kw)
        pg = await (await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1)).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.add_init_script('window.__sancakNoOffers = true')
        await pg.goto('file://' + os.path.join(ROOT, 'web', 'index.html')); await pg.wait_for_timeout(300)
        lv = await pg.evaluate('()=>ERA_LEVELS.map(l=>l.length)')
        for e, n in enumerate(lv):
            for l in range(n):
                f = await pg.evaluate(f'()=>MAPS[ERA_LEVELS[{e}][{l}].map].factions[0]')
                await pg.evaluate(f'()=>{{__sancak.save().tut=true;__sancak.startGame({e},{l},"{f}")}}'); await pg.wait_for_timeout(500)
                if len(sys.argv) > 1: await pg.screenshot(path=os.path.join(sys.argv[1], f'map-{e}-{l}.png'))
                await pg.evaluate('()=>__sancak.endPlayerTurn()')
                if await pg.locator('#aiSkip').count(): await pg.click('#aiSkip')
                for i in range(200):
                    await pg.wait_for_timeout(100)
                    if await pg.evaluate('()=>__sancak.B().phase') == 'player': break
                name = await pg.evaluate(f'()=>MAPS[ERA_LEVELS[{e}][{l}].map].name')
                print('✓', e, l, name, await pg.evaluate('()=>__sancak.B().G.turn'))
        print('HATALAR', errs); assert not errs
        await br.close()
asyncio.run(main())
