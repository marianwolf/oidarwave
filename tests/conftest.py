import json
from collections.abc import Generator
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, sync_playwright


@pytest.fixture(scope="session")
def base_dir() -> Path:
    return Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Session-weiter Chromium (headless, CI-sicher via --no-sandbox).

    Browser einmalig installieren: ``python -m playwright install chromium``.
    """
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
        except Exception as e:
            pytest.skip(f"Chromium nicht installiert (python -m playwright install chromium): {e}")
        yield b
        b.close()


@pytest.fixture
def page(browser: Browser) -> Generator[Page, None, None]:
    p = browser.new_page()
    yield p
    p.close()


@pytest.fixture(scope="session")
def index_html(base_dir: Path) -> str:
    return (base_dir / "index.html").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def video_html(base_dir: Path) -> str:
    return (base_dir / "video" / "index.html").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def package_json(base_dir: Path) -> dict:
    return json.loads((base_dir / "package.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def main_css_content(base_dir: Path) -> str:
    return (base_dir / "src" / "css" / "style.css").read_text(encoding="utf-8")
