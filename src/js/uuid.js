function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const values = new Uint8Array(16)
        crypto.getRandomValues(values)
        values[6] = (values[6] & 0x0f) | 0x40
        values[8] = (values[8] & 0x3f) | 0x80
        return [...values]
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}
