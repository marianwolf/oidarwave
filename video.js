document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const localStorageKey = 'dataSaveMode';

    if (dataModeToggle) {
        const savedState = localStorage.getItem(localStorageKey);
        if (savedState !== null) {
            dataModeToggle.setAttribute('aria-pressed', savedState);
        }

        dataModeToggle.addEventListener('click', () => {
            dataModeToggle.disabled = true;

            const isPressed = dataModeToggle.getAttribute('aria-pressed') === 'true';
            const newState = !isPressed;

            setTimeout(() => {
                dataModeToggle.setAttribute('aria-pressed', newState);
                
                localStorage.setItem(localStorageKey, newState);

                dataModeToggle.disabled = false;
            });
        });
    }
});