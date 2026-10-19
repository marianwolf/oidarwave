;(() => {
    'use strict'

    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const GLOW_CLASS = 'mouse-glow'
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')

    let glow = null
    let frameId = 0
    let pointerX = 0
    let pointerY = 0

    const isEnabled = () => !motionQuery.matches && !coarsePointerQuery.matches

    /**
     * Ein rAF pro Frame: mehrere pointermove-Events werden zusammengefasst.
     * Direktes transform-Setzen invalidert nur dieses Element – Custom
     * Properties auf :root wuerden den kompletten Baum neu berechnen.
     */
    const applyPosition = () => {
        frameId = 0
        if (glow) glow.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
    }

    const onPointerMove = (event) => {
        if (event.pointerType === 'touch') return
        pointerX = event.clientX
        pointerY = event.clientY
        if (!frameId) frameId = requestAnimationFrame(applyPosition)
    }

    const createGlow = () => {
        const element = document.createElement('div')
        element.className = GLOW_CLASS
        element.setAttribute('aria-hidden', 'true')
        document.body.appendChild(element)
        glow = element
    }

    const removeGlow = () => {
        if (frameId) cancelAnimationFrame(frameId)
        frameId = 0
        glow?.remove()
        glow = null
    }

    /** Reagiert auf Medien-Query-Wechsel (z. B. Reduced-Motion nachtraeglich aktiviert). */
    const sync = () => {
        document.removeEventListener('pointermove', onPointerMove)
        removeGlow()
        if (!isEnabled()) return
        createGlow()
        document.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    sync()
    motionQuery.addEventListener('change', sync)
    coarsePointerQuery.addEventListener('change', sync)
})()
