"""
Unit tests for stream URL formats.
No browser or network required - validates URL structure only.
"""
import pytest

STREAMS = (
    ("DLF", "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3"),
    ("DLF Nova", "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3"),
    ("NDR 1", "https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3"),
    ("NDR 2", "https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Info", "https://f131.rndfnk.com/ard/ndrinfo/niedersachsen/mp3/128/stream.mp3"),
    ("NDR Kultur", "https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3"),
    ("N-JOY", "https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3"),
    ("80s80s", "https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667"),
    ("90s90s", "https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761"),
    ("BBG", "https://radio.bbg-bew.de"),
)

VIDEO_STREAMS = (
    ("Das Erste", "https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8"),
    ("ZDF", "https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8"),
    ("ARTE", "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8"),
    ("Tagesschau24", "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8"),
)


@pytest.mark.unit
@pytest.mark.parametrize("name,url", STREAMS, ids=[s[0] for s in STREAMS])
class TestAudioStreams:
    def test_audio_stream_url_format(self, name: str, url: str):
        assert url.startswith(("http://", "https://"))
        assert len(url) > 10


@pytest.mark.unit
@pytest.mark.parametrize("name,url", VIDEO_STREAMS, ids=[v[0] for v in VIDEO_STREAMS])
class TestVideoStreams:
    def test_video_stream_url_format(self, name: str, url: str):
        assert url.endswith(".m3u8")
        assert url.startswith("https://")
