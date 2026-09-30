(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let pendingUpdate = false;
    document.addEventListener('mousemove', (e) => {
        const normalizedX = e.clientX / window.innerWidth;
        const normalizedY = e.clientY / window.innerHeight;
        if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
                document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
                pendingUpdate = false;
            });
        }
    }, { passive: true });
})();
