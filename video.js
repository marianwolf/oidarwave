document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const localStorageKey = 'dataSaveMode';

    if (!dataModeToggle) {
        console.error("Data mode toggle button not found.");
        return;
    }

    const savedState = localStorage.getItem(localStorageKey);
    const isDataModeOn = savedState === 'true'; 
    dataModeToggle.setAttribute('aria-pressed', isDataModeOn);

    dataModeToggle.addEventListener('click', () => {
        const currentState = dataModeToggle.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        
        dataModeToggle.setAttribute('aria-pressed', newState);
        
        localStorage.setItem(localStorageKey, newState);
    });
});