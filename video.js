// video.js

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoPlayer');
    const stationButtons = document.querySelectorAll('.station-btn');
    const currentStationSpan = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');

    let hls = null;

    function playStream(url, name) {
        if (hls) {
            hls.destroy();
            hls = null;
        }

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(error => {
                    console.error("Autoplay failed:", error);
                    alert("Wiedergabe starten. Autoplay wurde blockiert.");
                });
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            }, { once: true });
        } else {
            alert('Ihr Browser unterstützt die Wiedergabe von HLS-Streams nicht.');
            return;
        }

        currentStationSpan.textContent = name;
        statusIndicator.classList.remove('paused', 'playing', 'loading');
        statusIndicator.classList.add('loading');

        videoElement.onplaying = () => {
            statusIndicator.classList.remove('paused', 'loading');
            statusIndicator.classList.add('playing');
        };

        videoElement.onwaiting = () => {
            statusIndicator.classList.remove('playing', 'paused');
            statusIndicator.classList.add('loading');
        };

        videoElement.onpause = () => {
            statusIndicator.classList.remove('playing', 'loading');
            statusIndicator.classList.add('paused');
        };
    }

    stationButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const url = event.target.getAttribute('data-url');
            const name = event.target.getAttribute('data-name');
            playStream(url, name);
        });
    });

    statusIndicator.classList.add('paused');
});