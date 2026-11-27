"""Browser integration checks for the recent-election index."""
import os
import sys
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8284'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox'])
    for width in (320,390,851,1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/')
        page.locator('.home-actions').get_by_role('link',name='Recent elections').click()
        expect(page.locator('h1')).to_have_text('Recent elections')
        expect(page.locator('#atlas-menu a[aria-current]')).to_have_text('Recent elections')
        all_cards=page.locator('.recent-entry:not([hidden])')
        count=all_cards.count()
        assert count>=25
        expect(page.locator('#recent-summary')).to_contain_text(str(count)+' elections')
        expect(all_cards.first.locator('h3')).to_have_text('Bolivia')
        assert all_cards.first.locator('.recent-date').text_content().endswith('Oct 19, 2025')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if width in (390,1280):
            page.screenshot(path=f'/tmp/atlas-recent-{width}.png')
        page.locator('[name=region]').select_option('mexico')
        expect(all_cards).to_have_count(3)
        page.locator('[name=type]').select_option('leg')
        expect(all_cards).to_have_count(2)
        page.locator('[name=year]').select_option('2021')
        expect(all_cards).to_have_count(1)
        page.reload()
        expect(all_cards).to_have_count(1)
        assert 'type=leg' in page.url
        all_cards.get_by_role('link',name='Explore results',exact=False).click()
        expect(page.locator('#districts h2')).to_have_text('Constituency strongholds')
        assert 'election=2278' in page.url
        expect(page.locator('#districts')).to_contain_text('2021')
        page.go_back()
        expect(all_cards).to_have_count(1)
        page.get_by_role('button',name='Clear filters').click()
        expect(all_cards).to_have_count(count)
        page.locator('[name=country]').select_option('CUB')
        expect(page.locator('#recent-empty')).to_be_visible()
        page.get_by_text('Coverage by country',exact=True).click()
        expect(page.locator('.recent-coverage li')).to_have_count(23)
        assert not errors,errors
        page.close()
    page=browser.new_page(java_script_enabled=False)
    page.goto(base+'/elections')
    assert page.locator('.recent-entry').count() == count
    expect(page.locator('#recent-filters')).to_be_hidden()
    browser.close()
print(f'Recent elections verified: {count} archive records, four widths, filter persistence, election-specific drill-down, coverage, and no-JS index.')
