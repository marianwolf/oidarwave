// Sprachumschaltung
const langToggle = document.getElementById('lang-toggle');
let lang = 'de';

const elementsToTranslate = {
  'headline': ['de', 'en'],
  'radio-title': ['de', 'en'],
  'label': ['de', 'en'],
  'footer': ['de', 'en']
};

function updateLanguage() {
  // Aktualisiere alle übersetzbaren Elemente
  Object.entries(elementsToTranslate).forEach(([base, langs]) => {
    langs.forEach(l => {
      const element = document.getElementById(`${base}-${l}`);
      if (element) {
        element.style.display = lang === l ? '' : 'none';
      }
    });
  });
  
  // Hamburger Menü Label
  const menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    const label = lang === 'de' ? 'Menü öffnen' : 'Open menu';
    menuToggle.setAttribute('aria-label', label);
  }
}

langToggle?.addEventListener('click', () => {
  lang = lang === 'de' ? 'en' : 'de';
  updateLanguage();
});

// Webradio-Player Logik
const radioAudio = document.getElementById('radio-audio');
const radioToggle = document.getElementById('radio-toggle');
const radioPause = document.getElementById('radio-pause');
const radioStop = document.getElementById('radio-stop');
const radioStation = document.getElementById('radio-station');
const radioTime = document.getElementById('radio-time');
const radioStatus = document.getElementById('radio-status');

let timeInterval = null;
let streamStartTimestamp = null;
let pausedAt = null;

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function createRadioIcon(type) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const btnSize = parseFloat(getCSSVar('--radio-btn-size')) || 44;
  svg.setAttribute('width', btnSize);
  svg.setAttribute('height', btnSize);
  svg.setAttribute('viewBox', '0 0 40 40');

  const colorPlay = getCSSVar('--primary') || '#1db954';
  const colorPause = getCSSVar('--accent-yellow') || '#f1c40f';
  const colorStop = getCSSVar('--accent-red') || '#e74c3c';

  if (type === 'play') {
    svg.innerHTML = `<circle cx="20" cy="20" r="20" fill="${colorPlay}"/><polygon points="15,10 32,20 15,30" fill="#fff"/>`;
  } else if (type === 'pause') {
    svg.innerHTML = `<circle cx="20" cy="20" r="20" fill="${colorPause}"/><rect x="13" y="10" width="5" height="20" rx="2" fill="#fff"/><rect x="22" y="10" width="5" height="20" rx="2" fill="#fff"/>`;
  } else if (type === 'stop') {
    svg.innerHTML = `<circle cx="20" cy="20" r="20" fill="${colorStop}"/><rect x="10" y="10" width="20" height="20" rx="5" fill="#fff"/>`;
  }
  return svg;
}

function showRadioPlay() {
  if (radioToggle) {
    radioToggle.classList.add('active');
    radioToggle.innerHTML = '';
    radioToggle.appendChild(createRadioIcon('play'));
    radioToggle.setAttribute('aria-label', 'Play');
  }
  if (radioPause) radioPause.classList.remove('active');
  if (radioStop) radioStop.classList.remove('active');
  if (radioStatus) radioStatus.classList.add('hidden');
}

function showRadioPauseStop() {
  if (radioToggle) radioToggle.classList.remove('active');
  if (radioPause) {
    radioPause.classList.add('active');
    radioPause.innerHTML = '';
    radioPause.appendChild(createRadioIcon('pause'));
    radioPause.setAttribute('aria-label', 'Pause');
  }
  if (radioStop) {
    radioStop.classList.add('active');
    radioStop.innerHTML = '';
    radioStop.appendChild(createRadioIcon('stop'));
    radioStop.setAttribute('aria-label', 'Stop');
  }
  if (radioStatus) radioStatus.classList.add('hidden');
}

function showRadioPlayStop() {
  if (radioToggle) {
    radioToggle.classList.add('active');
    radioToggle.innerHTML = '';
    radioToggle.appendChild(createRadioIcon('play'));
    radioToggle.setAttribute('aria-label', 'Play');
  }
  if (radioPause) radioPause.classList.remove('active');
  if (radioStop) {
    radioStop.classList.add('active');
    radioStop.innerHTML = '';
    radioStop.appendChild(createRadioIcon('stop'));
    radioStop.setAttribute('aria-label', 'Stop');
  }
  if (radioStatus) radioStatus.classList.add('hidden');
}

function updateRadioTime() {
  if (streamStartTimestamp !== null) {
    let elapsed;
    if (pausedAt !== null) {
      elapsed = pausedAt - streamStartTimestamp;
    } else {
      elapsed = Date.now() - streamStartTimestamp;
    }
    elapsed = Math.floor(elapsed / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const sec = String(elapsed % 60).padStart(2, '0');
    if (radioTime) radioTime.textContent = `${min}:${sec}`;
  } else {
    if (radioTime) radioTime.textContent = '00:00';
  }
}

function startRadioTimer() {
  if (streamStartTimestamp === null) streamStartTimestamp = Date.now();
  pausedAt = null;
  updateRadioTime();
  if (timeInterval) clearInterval(timeInterval);
  timeInterval = setInterval(updateRadioTime, 500);
}

function stopRadioTimer(reset = true) {
  if (timeInterval) clearInterval(timeInterval);
  if (reset) {
    if (radioTime) radioTime.textContent = '00:00';
    streamStartTimestamp = null;
    pausedAt = null;
  }
}

function initRadioUI() {
  stopRadioTimer();
  showRadioPlay();
  if (radioStatus) radioStatus.classList.add('hidden');
}

if (radioToggle) {
  radioToggle.onclick = function() {
    const selectedSrc = radioStation.value;
    if (radioAudio.src !== selectedSrc) {
      radioAudio.src = selectedSrc;
      radioAudio.load();
    }
    radioAudio.volume = 1.0;
    radioAudio.play();
  };
}

if (radioPause) {
  radioPause.onclick = function() {
    radioAudio.pause();
  };
}

if (radioStop) {
  radioStop.onclick = function() {
    radioAudio.pause();
    radioAudio.removeAttribute('src');
    radioAudio.load();
    stopRadioTimer();
    showRadioPlay();
  };
}

if (radioStation) {
  radioStation.addEventListener('change', () => {
    radioAudio.pause();
    radioAudio.removeAttribute('src');
    radioAudio.load();
    stopRadioTimer();
    showRadioPlay();
  });
}

// Radio Event Listeners
radioAudio.addEventListener('waiting', () => {
  if (radioStatus) {
    radioStatus.textContent = lang === 'de' ? 'Lädt...' : 'Loading...';
    radioStatus.classList.remove('hidden');
  }
});

radioAudio.addEventListener('playing', () => {
  if (radioStatus) radioStatus.classList.add('hidden');
});

radioAudio.addEventListener('error', () => {
  if (radioStatus) {
    radioStatus.textContent = lang === 'de' ? 'Fehler beim Laden.' : 'Error loading stream.';
    radioStatus.classList.remove('hidden');
    setTimeout(() => {
      if (radioStatus) radioStatus.classList.add('hidden');
    }, 5000);
  }
  stopRadioTimer();
  showRadioPlay();
});

radioAudio.addEventListener('play', () => {
  showRadioPauseStop();
  if (streamStartTimestamp === null) streamStartTimestamp = Date.now();
  if (pausedAt !== null) {
    streamStartTimestamp += (Date.now() - pausedAt);
    pausedAt = null;
  }
  startRadioTimer();
});

radioAudio.addEventListener('pause', () => {
  if (!radioAudio.src || radioAudio.currentTime === 0) {
    showRadioPlay();
    stopRadioTimer();
  } else {
    showRadioPlayStop();
    if (streamStartTimestamp !== null) pausedAt = Date.now();
    stopRadioTimer(false);
  }
});

radioAudio.addEventListener('ended', () => {
  stopRadioTimer();
  showRadioPlay();
});

function setRadioBtnSize() {
  const select = document.getElementById('radio-station');
  if (!select) return;

  const rect = select.getBoundingClientRect();
  const computed = window.getComputedStyle(select);
  let height = rect.height;

  if (height < 10) height = parseFloat(computed.height);
  height = Math.max(44, Math.min(height, 100));
  document.documentElement.style.setProperty('--radio-btn-size', `${height}px`);
}

// Hamburger Menü Logik
const menuToggle = document.getElementById('menu-toggle');
const mainMenu = document.getElementById('main-menu');

if (menuToggle && mainMenu) {
  let menuOpen = false;

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('open');
    mainMenu.classList.toggle('active');
    
    // Verbesserte Zugänglichkeit - Fokus im Menü halten wenn geöffnet
    if (!isExpanded) {
      const firstLink = mainMenu.querySelector('a');
      if (firstLink) firstLink.focus();
    }

    menuOpen = !menuOpen;
    // Aria-Label aktualisieren
    const closeLabel = lang === 'de' ? 'Menü schließen' : 'Close menu';
    const openLabel = lang === 'de' ? 'Menü öffnen' : 'Open menu';
    menuToggle.setAttribute('aria-label', menuOpen ? closeLabel : openLabel);
  });

  // Schließen des Menüs bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (menuOpen && !menuToggle.contains(e.target) && !mainMenu.contains(e.target)) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('open');
      mainMenu.classList.remove('active');
      menuOpen = false;
      menuToggle.setAttribute('aria-label', lang === 'de' ? 'Menü öffnen' : 'Open menu');
    }
  });

  // Menü-Links schließen das Menü
  const menuLinks = mainMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mainMenu.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('open');
      menuOpen = false;
      menuToggle.setAttribute('aria-label', lang === 'de' ? 'Menü öffnen' : 'Open menu');
    });
  });

  // Tastaturnavigation
  menuToggle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      menuToggle.click();
    }
  });

  // ESC zum Schließen
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menuOpen) {
      mainMenu.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('open');
      menuOpen = false;
      menuToggle.setAttribute('aria-label', lang === 'de' ? 'Menü öffnen' : 'Open menu');
      menuToggle.focus();
    }
  });
}

// Tastatursteuerung für Radio
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space' || e.key === ' ') {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.isContentEditable)) {
      return;
    }
    e.preventDefault();

    if (radioAudio.paused) {
      if (radioToggle) radioToggle.click();
    } else {
      if (radioPause) radioPause.click();
    }
  }
});

// Initialisierung
window.addEventListener('DOMContentLoaded', () => {
  setRadioBtnSize();
  initRadioUI();
});

window.addEventListener('resize', setRadioBtnSize);
setTimeout(setRadioBtnSize, 100);

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((error) => {
      console.error('Service Worker Registration failed:', error);
    });
  });
}