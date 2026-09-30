"""Integration-Tests mit Playwright (python -m playwright install chromium)."""

import pytest
from playwright.sync_api import Page

pytestmark = pytest.mark.integration

CHECKS = {
    "index": [".logo", "nav", ".station-btn"],
    "video": ["#videoPlayer", ".station-btn"],
    "impressum": ["h1"],
}


@pytest.mark.parametrize("name", ["index", "video", "impressum"])
def test_pages_load_with_elements(page: Page, page_urls: dict[str, str], name: str):
    """Jede Seite laedt genau einmal und enthaelt ihre Kern-Elemente."""
    page.goto(page_urls[name])
    assert "Oidarwave" in page.title() or "Impressum" in page.title()
    for selector in CHECKS[name]:
        assert page.locator(selector).count() > 0, f"{name}: {selector} fehlt"
    if name == "video":
        assert page.locator(".station-btn").count() >= 4


def test_index_elements(page: Page, page_urls: dict[str, str]):
    """Index-Seite: ein Seitenaufruf, alle Player-/Nav-/Banner-Checks."""
    page.goto(page_urls["index"])
    texts = [page.locator("nav a").nth(i).inner_text() for i in range(page.locator("nav a").count())]
    assert page.locator("nav a").count() >= 3 and "Radio" in texts and "Video" in texts
    assert page.locator("#audioPlayer").is_visible()
    assert page.locator("#audioPlayer").get_attribute("controls") is not None
    for selector in ("#cookieBanner", "#acceptCookies", "#declineCookies"):
        assert page.locator(selector).is_visible(), f"{selector} nicht sichtbar"
    assert page.locator("#statusIndicator").count() > 0
    assert page.locator("#currentSongTitle").count() > 0
