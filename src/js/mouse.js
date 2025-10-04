document.addEventListener('mousemove', (e) => {
    const normalizedX = e.clientX / window.innerWidth;
    const normalizedY = e.clientY / window.innerHeight;
    document.body.style.backgroundPosition = `${normalizedX * 100}% ${normalizedY * 100}%`;
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});