"""Gemeinsame Fixtures: Pfade, HTML/CSS/JSON-Inhalte, Stationen, Playwright."""

import json
import re
from collections.abc import Generator
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, sync_playwright

_DATA_URL_RE = re.compile(
    r'data-name="([^"]+)"[^>]*data-url="([^"]+)"|data-url="([^"]+)"[^>]*data-name="([^"]+)"'
)


def _parse_stations(html: str) -> list[tuple[str, str]]:
    return [
        (m.group(1), m.group(2)) if m.group(2) else (m.group(4), m.group(3))
        for m in _DATA_URL_RE.finditer(html)
    ]


@pytest.fixture(scope="session")
def base_dir() -> Path:
    return Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    """Session-weiter Chromium (headless). Setup: python -m playwright install chromium."""
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        except Exception as e:
            pytest.skip(f"Chromium nicht installiert: {e}")
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


@pytest.fixture(scope="session")
def page_urls(base_dir: Path) -> dict[str, str]:
    return {
        name: (base_dir / path).as_uri()
        for name, path in [
            ("index", "index.html"),
            ("video", "video/index.html"),
            ("impressum", "impressum/index.html"),
        ]
    }


@pytest.fixture(scope="session")
def audio_stations(index_html: str) -> list[tuple[str, str]]:
    stations = _parse_stations(index_html)
    assert stations, "Keine Sender in index.html gefunden"
    return stations


@pytest.fixture(scope="session")
def video_stations(video_html: str) -> list[tuple[str, str]]:
    stations = _parse_stations(video_html)
    assert stations, "Keine Sender in video/index.html gefunden"
    return stations
