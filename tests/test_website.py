"""
Integration tests for Oidarwave website using Playwright.
Requires: pip install pytest playwright && playwright install chromium
"""
from pathlib import Path
from typing import Generator

import pytest
from playwright.sync_api import sync_playwright, Page, Browser


BASE_DIR = str(Path(__file__).resolve().parent.parent)

PAGES: tuple[tuple[str, str], ...] = (
    ("index", f"file://{BASE_DIR}/index.html"),
    ("video", f"file://{BASE_DIR}/video/index.html"),
    ("impressum", f"file://{BASE_DIR}/impressum/index.html"),
)


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page(browser: Browser) -> Generator[Page, None, None]:
    p = browser.new_page()
    yield p
    p.close()


@pytest.mark.integration
@pytest.mark.parametrize("name,url", PAGES, ids=[p[0] for p in PAGES])
class TestPages:
    """Seiten laden und enthalten ihre Kern-Elemente (ein Seitenaufruf pro Seite)."""

    def test_page_loads_with_elements(self, page: Page, name: str, url: str):
        page.goto(url)
        title = page.title()
        assert "Oidarwave" in title or "Impressum" in title

        if name == "index":
            assert page.locator(".logo").is_visible()
            assert page.locator("nav").is_visible()
            assert page.locator(".station-btn").count() > 0
        elif name == "video":
            assert page.locator("#videoPlayer").is_visible()
            assert page.locator(".station-btn").count() >= 4
        elif name == "impressum":
            assert page.locator("h1").first.is_visible()


@pytest.mark.integration
class TestIndexSpecific:
    """Spezifische Tests für die Index-Seite."""

    @pytest.fixture(autouse=True)
    def index_page(self, page: Page):
        """Lädt die Index-Seite für jeden Test."""
        page.goto(PAGES[0][1])
        return page

    def test_navigation(self, index_page: Page):
        """Navigation hat alle erforderlichen Links."""
        links = index_page.locator("nav a")
        assert links.count() >= 3

        texts = [links.nth(i).inner_text() for i in range(links.count())]
        assert "Radio" in texts
        assert "Video" in texts

    def test_player(self, index_page: Page):
        """Audio-Player ist vorhanden und hat Controls."""
        audio = index_page.locator("#audioPlayer")
        assert audio.is_visible()
        assert audio.get_attribute("controls") is not None

    def test_cookie_banner(self, index_page: Page):
        """Cookie-Banner ist vorhanden."""
        banner = index_page.locator("#cookieBanner")
        assert banner.is_visible()
        assert index_page.locator("#acceptCookies").is_visible()
        assert index_page.locator("#declineCookies").is_visible()

    def test_status_display(self, index_page: Page):
        """Status und Song-Titel sind vorhanden."""
        assert index_page.locator("#statusIndicator").count() > 0
        assert index_page.locator("#currentSongTitle").count() > 0
