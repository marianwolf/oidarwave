/**
 * WatchLater UI - Rendert die Watch Later und Queue UI-Elemente
 */
(function() {
    'use strict';

    var UI = {
        watchlaterList: null,
        queueList: null,
        activeTab: 'watchlater',

        init: function() {
            this.watchlaterList = document.getElementById('watchlaterList');
            this.queueList = document.getElementById('queueList');

            if (!this.watchlaterList || !this.queueList) {
                console.warn('WatchLater UI: Required elements not found');
                return;
            }

            this.setupTabs();
            this.setupEventDelegation();
            this.render();

            // WatchLater setup
            if (typeof WatchLater !== 'undefined' && WatchLater.setupPlayerListeners) {
                WatchLater.setupPlayerListeners();
            }
        },

        setupTabs: function() {
            var tabs = document.querySelectorAll('.watchlater-tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].addEventListener('click', (function(tab) {
                    return function() {
                        UI.switchTab(tab.dataset.tab);
                    };
                })(tabs[i]));
            }
        },

        switchTab: function(tabName) {
            this.activeTab = tabName;
            var tabs = document.querySelectorAll('.watchlater-tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.toggle('active', tabs[i].dataset.tab === tabName);
            }
            var wlTab = document.getElementById('watchlaterTab');
            var qTab = document.getElementById('queueTab');
            if (wlTab) wlTab.classList.toggle('active', tabName === 'watchlater');
            if (qTab) qTab.classList.toggle('active', tabName === 'queue');
        },

        setupEventDelegation: function() {
            var panel = document.getElementById('watchlaterPanel');
            if (!panel) return;

            panel.addEventListener('click', function(e) {
                var target = e.target;
                var actionEl = target.closest('[data-action]');
                var urlEl = target.closest('[data-url]');

                if (!actionEl || !urlEl) return;

                var action = actionEl.dataset.action;
                var url = urlEl.dataset.url;

                switch (action) {
                    case 'play':
                        UI.playStation(url);
                        break;
                    case 'remove-wl':
                        UI.removeFromWatchLater(url);
                        break;
                    case 'add-queue':
                        UI.addToQueue(url);
                        break;
                    case 'remove-queue':
                        UI.removeFromQueue(url);
                        break;
                    case 'play-queue':
                        UI.playQueueItem(url);
                        break;
                }
            });
        },

        playStation: function(url) {
            var btn = document.querySelector('.station-btn[data-url="' + url + '"]');
            if (btn) btn.click();
        },

        playQueueItem: function(url) {
            var queue = WatchLater && WatchLater.getQueue ? WatchLater.getQueue() : [];
            var index = -1;
            for (var i = 0; i < queue.length; i++) {
                if (queue[i].url === url) {
                    index = i;
                    break;
                }
            }
            if (index === -1) return;

            // Remove items before the target
            for (var j = 0; j < index; j++) {
                if (WatchLater && WatchLater.removeFromQueue) {
                    WatchLater.removeFromQueue(queue[j].url);
                }
            }

            var nextItem = queue[index];
            if (WatchLater && WatchLater.removeFromQueue) {
                WatchLater.removeFromQueue(nextItem.url);
            }
            this.playStation(nextItem.url);
            this.renderQueue();
        },

        addToQueue: function(url) {
            var items = WatchLater && WatchLater.getWatchLaterList ? WatchLater.getWatchLaterList() : [];
            var item = null;
            for (var i = 0; i < items.length; i++) {
                if (items[i].url === url) {
                    item = items[i];
                    break;
                }
            }
            if (item && WatchLater && WatchLater.addToQueue) {
                WatchLater.addToQueue(item.url, item.name, item.type);
                this.renderQueue();
            }
        },

        removeFromQueue: function(url) {
            if (WatchLater && WatchLater.removeFromQueue) {
                WatchLater.removeFromQueue(url);
            }
            this.renderQueue();
        },

        removeFromWatchLater: function(url) {
            if (WatchLater && WatchLater.removeFromWatchLater) {
                WatchLater.removeFromWatchLater(url);
            }
            this.renderWatchLater();
            this.updateStationButtons();
        },

        updateStationButtons: function() {
            var btns = document.querySelectorAll('.add-watchlater-btn');
            for (var i = 0; i < btns.length; i++) {
                var btn = btns[i];
                var url = btn.dataset.url;
                var inList = WatchLater && WatchLater.isInWatchLater ? WatchLater.isInWatchLater(url) : false;
                btn.textContent = inList ? '✓ Watch Later' : '+ Watch Later';
                btn.classList.toggle('in-list', inList);
            }
        },

        createEmptyMessage: function(text) {
            return '<li class="empty-message">' + text + '</li>';
        },

        createWatchLaterItem: function(item) {
            var progress = null;
            if (WatchLater && WatchLater.getProgressStatus) {
                progress = WatchLater.getProgressStatus(item.url);
            }
            var progressBar = progress
                ? '<div class="progress-bar"><div class="progress-bar-fill" style="width: ' + progress.percent + '%"></div></div><div class="watchlater-item-progress">' + progress.formatted + '</div>'
                : '';

            return '<li class="watchlater-item" data-url="' + item.url + '">' +
                '<div class="watchlater-item-info" data-action="play" data-url="' + item.url + '">' +
                '<div class="watchlater-item-name">' + item.name + '</div>' +
                progressBar +
                '</div>' +
                '<div class="watchlater-actions">' +
                '<button class="watchlater-btn queue-btn" data-action="add-queue" data-url="' + item.url + '" title="Zur Queue hinzufuegen">+</button>' +
                '<button class="watchlater-btn remove" data-action="remove-wl" data-url="' + item.url + '" title="Entfernen">X</button>' +
                '</div>' +
                '</li>';
        },

        createQueueItem: function(item, index) {
            return '<li class="queue-item" data-url="' + item.url + '">' +
                '<div class="queue-item-info" data-action="play-queue" data-url="' + item.url + '">' +
                '<div class="queue-item-name">' + (index + 1) + '. ' + item.name + '</div>' +
                '<div class="queue-item-progress">Wird als naechstes abgespielt</div>' +
                '</div>' +
                '<div class="queue-actions">' +
                '<button class="queue-btn" data-action="remove-queue" data-url="' + item.url + '" title="Aus Queue entfernen">X</button>' +
                '</div>' +
                '</li>';
        },

        renderWatchLater: function() {
            var items = WatchLater && WatchLater.getWatchLaterList ? WatchLater.getWatchLaterList() : [];
            if (items.length === 0) {
                this.watchlaterList.innerHTML = this.createEmptyMessage('Keine Videos/Sender in Watch Later');
                return;
            }
            var html = '';
            for (var i = 0; i < items.length; i++) {
                html += this.createWatchLaterItem(items[i]);
            }
            this.watchlaterList.innerHTML = html;
        },

        renderQueue: function() {
            var items = WatchLater && WatchLater.getQueue ? WatchLater.getQueue() : [];
            if (items.length === 0) {
                this.queueList.innerHTML = this.createEmptyMessage('Keine Sender in der Queue');
                return;
            }
            var html = '';
            for (var i = 0; i < items.length; i++) {
                html += this.createQueueItem(items[i], i);
            }
            this.queueList.innerHTML = html;
        },

        render: function() {
            this.renderWatchLater();
            this.renderQueue();
            this.addStationButtons();
        },

        addStationButtons: function() {
            var buttons = document.querySelectorAll('.station-btn:not(.processed)');

            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                btn.classList.add('processed');

                var url = btn.dataset.url;
                var name = btn.dataset.name;
                var radioSection = btn.closest('#radio');
                var type = radioSection ? 'radio' : 'video';

                var wlBtn = document.createElement('button');
                wlBtn.className = 'add-watchlater-btn';
                wlBtn.dataset.url = url;
                this.updateWlButtonState(wlBtn, url);

                wlBtn.addEventListener('click', (function(b, u, n, t) {
                    return function(e) {
                        e.stopPropagation();
                        var isInList = WatchLater && WatchLater.isInWatchLater ? WatchLater.isInWatchLater(u) : false;
                        if (isInList) {
                            if (WatchLater && WatchLater.removeFromWatchLater) {
                                WatchLater.removeFromWatchLater(u);
                            }
                            UI.updateWlButtonState(b, u);
                            UI.renderWatchLater();
                        } else {
                            if (WatchLater && WatchLater.addToWatchLater) {
                                WatchLater.addToWatchLater(u, n, t);
                            }
                            UI.updateWlButtonState(b, u);
                            UI.renderWatchLater();
                        }
                    };
                })(wlBtn, url, name, type));

                btn.appendChild(wlBtn);
            }
        },

        updateWlButtonState: function(btn, url) {
            var inList = WatchLater && WatchLater.isInWatchLater ? WatchLater.isInWatchLater(url) : false;
            btn.textContent = inList ? '✓ Watch Later' : '+ Watch Later';
            btn.classList.toggle('in-list', inList);
        }
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        UI.init();
    });

    // Re-render when new station buttons are added
    var observer = new MutationObserver(function() {
        UI.addStationButtons();
    });
    var stationGrid = document.querySelector('.station-grid');
    if (stationGrid) {
        observer.observe(stationGrid, { childList: true, subtree: true });
    }

    // Expose UI for external access
    window.WatchLaterUI = UI;
})();
