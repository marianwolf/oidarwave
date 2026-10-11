;(() => {
    'use strict'

    if (typeof window === 'undefined' || typeof document === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let pendingUpdate = false
    let lastX = 0
    let lastY = 0

    const flushPosition = () => {
        document.documentElement.style.setProperty('--mouse-x', `${lastX}px`)
        document.documentElement.style.setProperty('--mouse-y', `${lastY}px`)
        pendingUpdate = false
    }

    document.addEventListener(
        'mousemove',
        (e) => {
            lastX = e.clientX
            lastY = e.clientY
            if (pendingUpdate) return
            pendingUpdate = true
            requestAnimationFrame(flushPosition)
        },
        { passive: true }
    )
})()
