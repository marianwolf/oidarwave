/**
 * WatchLater UI - Rendert die Watch Later und Queue UI-Elemente
 */

import { WatchLaterItem, QueueItem, ProgressStatus } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WatchLater: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WatchLaterAny: any;

/**
 * WatchLater UI Module
 */
document.addEventListener('DOMContentLoaded', () => {
    const watchlaterList = document.getElementById('watchlaterList');
    const queueList = document.getElementById('queueList');
    
    if (!watchlaterList || !queueList) {
        console.warn('WatchLater UI: Required elements not found');
        return;
    }

    // WatchLater any referenzieren
    WatchLaterAny = (typeof WatchLater !== 'undefined') ? WatchLater : null;

    setupTabs();
    setupEventDelegation();
    render();

    // WatchLater setup
    if (WatchLaterAny && WatchLaterAny.setupPlayerListeners) {
        WatchLaterAny.setupPlayerListeners();
    }

    // Re-render when new station buttons are added
    const observer = new MutationObserver(() => {
        addStationButtons();
    });
    const stationGrid = document.querySelector('.station-grid');
    if (stationGrid) {
        observer.observe(stationGrid, { childList: true, subtree: true });
    }
});

let activeTab: 'watchlater' | 'queue' = 'watchlater';

/**
 * Richtet die Tabs ein
 */
function setupTabs(): void {
    const tabs = document.querySelectorAll('.watchlater-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabElement = tab as HTMLElement;
            switchTab(tabElement.dataset.tab as 'watchlater' | 'queue');
        });
    });
}

/**
 * Wechselt den aktiven Tab
 */
function switchTab(tabName: 'watchlater' | 'queue'): void {
    activeTab = tabName;
    const tabs = document.querySelectorAll('.watchlater-tab');
    tabs.forEach((tab) => {
        const tabElement = tab as HTMLElement;
        tabElement.classList.toggle('active', tabElement.dataset.tab === tabName);
    });
    const wlTab = document.getElementById('watchlaterTab');
    const qTab = document.getElementById('queueTab');
    if (wlTab) wlTab.classList.toggle('active', tabName === 'watchlater');
    if (qTab) qTab.classList.toggle('active', tabName === 'queue');
}

/**
 * Richtet Event-Delegation ein
 */
function setupEventDelegation(): void {
    const panel = document.getElementById('watchlaterPanel');
    if (!panel) return;

    panel.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const actionEl = target.closest('[data-action]') as HTMLElement | null;
        const urlEl = target.closest('[data-url]') as HTMLElement | null;

        if (!actionEl || !urlEl) return;

        const action = actionEl.dataset.action;
        const url = urlEl.dataset.url;

        if (!url) return;

        switch (action) {
            case 'play':
                playStation(url);
                break;
            case 'remove-wl':
                removeFromWatchLater(url);
                break;
            case 'add-queue':
                addToQueue(url);
                break;
            case 'remove-queue':
                removeFromQueue(url);
                break;
            case 'play-queue':
                playQueueItem(url);
                break;
        }
    });
}

/**
 * Spielt eine Station ab
 */
function playStation(url: string): void {
    const btn = document.querySelector(`.station-btn[data-url="${url}"]`) as HTMLElement | null;
    if (btn) btn.click();
}

/**
 * Spielt ein Queue-Item ab
 */
function playQueueItem(url: string): void {
    const queue = (WatchLaterAny && WatchLaterAny.getQueue) ? WatchLaterAny.getQueue() : [];
    let index = -1;
    for (let i = 0; i < queue.length; i++) {
        if ((queue[i] as QueueItem).url === url) {
            index = i;
            break;
        }
    }
    if (index === -1) return;

    // Remove items before the target
    for (let j = 0; j < index; j++) {
        if (WatchLaterAny && WatchLaterAny.removeFromQueue) {
            WatchLaterAny.removeFromQueue((queue[j] as QueueItem).url);
        }
    }

    const nextItem = queue[index] as QueueItem;
    if (WatchLaterAny && WatchLaterAny.removeFromQueue) {
        WatchLaterAny.removeFromQueue(nextItem.url);
    }
    playStation(nextItem.url);
    renderQueue();
}

/**
 * Fügt ein Element zur Queue hinzu
 */
function addToQueue(url: string): void {
    const items = (WatchLaterAny && WatchLaterAny.getWatchLaterList) ? WatchLaterAny.getWatchLaterList() : [];
    let item: WatchLaterItem | null = null;
    for (let i = 0; i < items.length; i++) {
        if ((items[i] as WatchLaterItem).url === url) {
            item = items[i] as WatchLaterItem;
            break;
        }
    }
    if (item && WatchLaterAny && WatchLaterAny.addToQueue) {
        WatchLaterAny.addToQueue(item.url, item.name, item.type);
        renderQueue();
    }
}

/**
 * Entfernt ein Element aus der Queue
 */
function removeFromQueue(url: string): void {
    if (WatchLaterAny && WatchLaterAny.removeFromQueue) {
        WatchLaterAny.removeFromQueue(url);
    }
    renderQueue();
}

/**
 * Entfernt ein Element aus Watch Later
 */
function removeFromWatchLater(url: string): void {
    if (WatchLaterAny && WatchLaterAny.removeFromWatchLater) {
        WatchLaterAny.removeFromWatchLater(url);
    }
    renderWatchLater();
    updateStationButtons();
}

/**
 * Aktualisiert die Station-Buttons
 */
function updateStationButtons(): void {
    const btns = document.querySelectorAll('.add-watchlater-btn');
    btns.forEach((btn) => {
        const button = btn as HTMLElement;
        const url = button.dataset.url;
        const inList = (WatchLaterAny && WatchLaterAny.isInWatchLater) ? WatchLaterAny.isInWatchLater(url) : false;
        button.textContent = inList ? '✓ Watch Later' : '+ Watch Later';
        button.classList.toggle('in-list', inList);
    });
}

/**
 * Erstellt eine leere Nachricht
 */
function createEmptyMessage(text: string): string {
    return `<li class="empty-message">${text}</li>`;
}

/**
 * Erstellt ein Watch Later Element
 */
function createWatchLaterItem(item: WatchLaterItem): string {
    let progress: ProgressStatus | null = null;
    if (WatchLaterAny && WatchLaterAny.getProgressStatus) {
        progress = WatchLaterAny.getProgressStatus(item.url);
    }
    const progressBar = progress
        ? `<div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress.percent}%"></div></div><div class="watchlater-item-progress">${progress.formatted}</div>`
        : '';

    return `<li class="watchlater-item" data-url="${item.url}">
        <div class="watchlater-item-info" data-action="play" data-url="${item.url}">
            <div class="watchlater-item-name">${item.name}</div>
            ${progressBar}
        </div>
        <div class="watchlater-actions">
            <button class="watchlater-btn queue-btn" data-action="add-queue" data-url="${item.url}" title="Zur Queue hinzufuegen">+</button>
            <button class="watchlater-btn remove" data-action="remove-wl" data-url="${item.url}" title="Entfernen">X</button>
        </div>
    </li>`;
}

/**
 * Erstellt ein Queue Element
 */
function createQueueItem(item: QueueItem, index: number): string {
    return `<li class="queue-item" data-url="${item.url}">
        <div class="queue-item-info" data-action="play-queue" data-url="${item.url}">
            <div class="queue-item-name">${index + 1}. ${item.name}</div>
            <div class="queue-item-progress">Wird als naechstes abgespielt</div>
        </div>
        <div class="queue-actions">
            <button class="queue-btn" data-action="remove-queue" data-url="${item.url}" title="Aus Queue entfernen">X</button>
        </div>
    </li>`;
}

/**
 * Rendert die Watch Later Liste
 */
function renderWatchLater(): void {
    const list = document.getElementById('watchlaterList');
    if (!list) return;

    const items = (WatchLaterAny && WatchLaterAny.getWatchLaterList) ? WatchLaterAny.getWatchLaterList() : [];
    if (items.length === 0) {
        list.innerHTML = createEmptyMessage('Keine Videos/Sender in Watch Later');
        return;
    }
    let html = '';
    items.forEach((item: WatchLaterItem) => {
        html += createWatchLaterItem(item);
    });
    list.innerHTML = html;
}

/**
 * Rendert die Queue Liste
 */
function renderQueue(): void {
    const list = document.getElementById('queueList');
    if (!list) return;

    const items = (WatchLaterAny && WatchLaterAny.getQueue) ? WatchLaterAny.getQueue() : [];
    if (items.length === 0) {
        list.innerHTML = createEmptyMessage('Keine Sender in der Queue');
        return;
    }
    let html = '';
    items.forEach((item: QueueItem, index: number) => {
        html += createQueueItem(item, index);
    });
    list.innerHTML = html;
}

/**
 * Rendert alle UI-Elemente
 */
function render(): void {
    renderWatchLater();
    renderQueue();
    addStationButtons();
}

/**
 * Fügt Watch Later Buttons zu Station-Buttons hinzu
 */
function addStationButtons(): void {
    const buttons = document.querySelectorAll('.station-btn:not(.processed)');

    buttons.forEach((button) => {
        const btn = button as HTMLElement;
        btn.classList.add('processed');

        const url = btn.dataset.url || '';
        const name = btn.dataset.name || '';
        const radioSection = btn.closest('#radio');
        const type = radioSection ? 'radio' : 'video';

        const wlBtn = document.createElement('button');
        wlBtn.className = 'add-watchlater-btn';
        wlBtn.dataset.url = url;
        updateWlButtonState(wlBtn, url);

        wlBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            const isInList = (WatchLaterAny && WatchLaterAny.isInWatchLater) ? WatchLaterAny.isInWatchLater(url) : false;
            if (isInList) {
                if (WatchLaterAny && WatchLaterAny.removeFromWatchLater) {
                    WatchLaterAny.removeFromWatchLater(url);
                }
                updateWlButtonState(wlBtn, url);
                renderWatchLater();
            } else {
                if (WatchLaterAny && WatchLaterAny.addToWatchLater) {
                    WatchLaterAny.addToWatchLater(url, name, type);
                }
                updateWlButtonState(wlBtn, url);
                renderWatchLater();
            }
        });

        btn.appendChild(wlBtn);
    });
}

/**
 * Aktualisiert den Watch Later Button-Status
 */
function updateWlButtonState(btn: HTMLElement, url: string): void {
    const inList = (WatchLaterAny && WatchLaterAny.isInWatchLater) ? WatchLaterAny.isInWatchLater(url) : false;
    btn.textContent = inList ? '✓ Watch Later' : '+ Watch Later';
    btn.classList.toggle('in-list', inList);
}

// Expose UI for external access
(window as unknown as { WatchLaterUI: { updateStationButtons: () => void; renderWatchLater: () => void; renderQueue: () => void; render: () => void; addStationButtons: () => void } }).WatchLaterUI = {
    updateStationButtons,
    renderWatchLater,
    renderQueue,
    render,
    addStationButtons
};
