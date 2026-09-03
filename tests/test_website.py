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


@pytest.fixture(scope="session")
def pages() -> tuple[tuple[str, str], ...]:
    return PAGES


@pytest.mark.integration
@pytest.mark.parametrize("name,url", PAGES, ids=[p[0] for p in PAGES])
class TestPages:
    """Tests für alle Seiten."""
    
    def test_page_loads(self, page: Page, name: str, url: str):
        """Seiten laden ohne kritische Fehler."""
        page.goto(url)
        title = page.title()
        assert "Oidarwave" in title or "Impressum" in title


@pytest.mark.integration
@pytest.mark.parametrize("name,url", PAGES, ids=[p[0] for p in PAGES])
class TestPageElements:
    """Tests für Seiten-Elemente (parametrisiert pro Seite)."""
    
    def test_elements_present(self, page: Page, name: str, url: str):
        """Erforderliche Elemente sind vorhanden."""
        page.goto(url)
        
        if name == "index":
            assert page.locator(".logo").is_visible()
            assert page.locator("nav").is_visible()
            assert page.locator(".station-btn").count() > 0
        elif name == "video":
            assert page.locator("#videoPlayer").is_visible()
            assert page.locator(".station-btn").count() >= 4
        elif name == "impressum":
            assert page.locator("h1").first.is_visible()


class TestIndexSpecific:
    """Spezifische Tests für die Index-Seite."""
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Lädt die Index-Seite für jeden Test."""
        page.goto(PAGES[0][1])
        self.page = page
    
    def test_navigation(self):
        """Navigation hat alle erforderlichen Links."""
        links = self.page.locator("nav a")
        assert links.count() >= 3
        
        texts = [links.nth(i).inner_text() for i in range(links.count())]
        assert "Radio" in texts
        assert "Video" in texts
    
    def test_player(self):
        """Audio-Player ist vorhanden und hat Controls."""
        audio = self.page.locator("#audioPlayer")
        assert audio.is_visible()
        assert audio.get_attribute("controls") is not None
    
    def test_cookie_banner(self):
        """Cookie-Banner ist vorhanden."""
        banner = self.page.locator("#cookieBanner")
        assert banner.is_visible()
        assert self.page.locator("#acceptCookies").is_visible()
        assert self.page.locator("#declineCookies").is_visible()
    
    def test_status_display(self):
        """Status und Song-Titel sind vorhanden."""
        assert self.page.locator("#statusIndicator").count() > 0
        assert self.page.locator("#currentSongTitle").count() > 0
