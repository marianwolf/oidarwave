document.addEventListener('mousemove', (e) => {
    const body = document.body;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    const bgBefore = document.querySelector('body::before');
    body.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    const posX = x * 200 - 50;
    const posY = y * 200 - 50;
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});