// Share Target Handler
async function handleShare(formData) {
  const shareData = {
    title: formData.get('name'),
    text: formData.get('description'),
    url: formData.get('link')
  };

  try {
    // Speichere geteilte Daten
    await saveSharedData(shareData);
    
    // Zeige Erfolgsbenachrichtigung
    showNotification('Inhalt erfolgreich geteilt!');
    
    // Leite zur Hauptseite weiter
    window.location.href = '/?shared=success';
  } catch (error) {
    console.error('Share handling failed:', error);
    showNotification('Fehler beim Teilen des Inhalts', 'error');
  }
}

// Protocol Handler
function handleRadioProtocol(url) {
  const radioUrl = new URL(url);
  if (radioUrl.protocol === 'web+radio:') {
    const stationId = radioUrl.pathname.slice(2);
    loadRadioStation(stationId);
  }
}

// Hilfsfunktionen
async function saveSharedData(data) {
  const db = await openDB('shared-content', 1);
  await db.add('shares', {
    ...data,
    timestamp: Date.now()
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function loadRadioStation(stationId) {
  const select = document.getElementById('radio-station');
  if (select) {
    select.value = stationId;
    select.dispatchEvent(new Event('change'));
  }
}

// Registriere Protocol Handler
if ('registerProtocolHandler' in navigator) {
  navigator.registerProtocolHandler(
    'web+radio',
    `${window.location.origin}/handle-protocol?url=%s`,
    'Oidarwave Radio Handler'
  );
}
