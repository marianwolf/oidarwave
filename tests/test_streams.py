"""
Unit tests for stream URL formats.
No browser or network required - validates URL structure only.
Single source of truth: data-url attributes in index.html / video/index.html.
"""
import re
from urllib.parse import urlparse

import pytest

_DATA_URL_RE = re.compile(r'data-name="([^"]+)"[^>]*data-url="([^"]+)"|data-url="([^"]+)"[^>]*data-name="([^"]+)"')


def _parse_stations(html: str) -> list[tuple[str, str]]:
    stations = []
    for m in _DATA_URL_RE.finditer(html):
        name, url = (m.group(1), m.group(2)) if m.group(2) else (m.group(4), m.group(3))
        stations.append((name, url))
    return stations


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


def _assert_valid_http_url(url: str):
    parsed = urlparse(url)
    assert parsed.scheme in ("http", "https"), f"Ungültiges Schema: {url}"
    assert parsed.netloc, f"Keine Domain: {url}"


@pytest.mark.unit
def test_audio_stations_present(audio_stations):
    assert len(audio_stations) >= 5, f"Zu wenige Audio-Sender: {len(audio_stations)}"


@pytest.mark.unit
@pytest.mark.parametrize("name,url", [
    ("DLF", "st01.sslstream.dlf.de"),
    ("NDR", "rndfnk.com"),
    ("80s80s", "streamabc.net"),
])
def test_expected_audio_hosts_present(audio_stations, name: str, url: str):
    assert any(url in station_url for _, station_url in audio_stations), \
        f"Erwarteter Audio-Host {name} ({url}) fehlt"


@pytest.mark.unit
def test_audio_stream_url_format(audio_stations):
    for name, url in audio_stations:
        _assert_valid_http_url(url)


@pytest.mark.unit
def test_video_stream_url_format(video_stations):
    assert len(video_stations) >= 4, f"Zu wenige Video-Sender: {len(video_stations)}"
    for name, url in video_stations:
        _assert_valid_http_url(url)
        assert url.endswith(".m3u8"), f"{name}: erwartet .m3u8, erhalten {url}"


@pytest.mark.unit
def test_no_duplicate_station_urls(audio_stations, video_stations):
    urls = [url for _, url in audio_stations + video_stations]
    assert len(urls) == len(set(urls)), "Doppelte Stream-URLs gefunden"


@pytest.mark.unit
class TestNoSecretsInStationUrls:
    """Keine Session-Tokens in den Sender-URLs von index.html (Lieferanten-Redirects liefern frische Tokens)."""

    def test_index_has_no_stream_tokens(self):
        from pathlib import Path

        html = (Path(__file__).resolve().parent.parent / "index.html").read_text(encoding="utf-8")
        for param in ("token=", "sid=", "cid=", "tvf="):
            assert param not in html, f"Session-Parameter {param!r} in index.html gefunden"
