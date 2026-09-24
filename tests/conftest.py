import json
from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def base_dir() -> Path:
    return Path(__file__).resolve().parent.parent


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
