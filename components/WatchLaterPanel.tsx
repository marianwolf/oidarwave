'use client';

import { useState, useEffect, useCallback } from 'react';

interface WatchLaterItem {
  url: string;
  name: string;
  type: 'radio' | 'video';
}

export default function WatchLaterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlater' | 'queue'>('watchlater');
  const [watchLaterList, setWatchLaterList] = useState<WatchLaterItem[]>([]);
  const [queueList, setQueueList] = useState<WatchLaterItem[]>([]);

  useEffect(() => {
    const savedWatchLater = localStorage.getItem('watchLaterList');
    const savedQueue = localStorage.getItem('queueList');

    if (savedWatchLater) {
      setWatchLaterList(JSON.parse(savedWatchLater));
    }
    if (savedQueue) {
      setQueueList(JSON.parse(savedQueue));
    }
  }, []);

  const saveWatchLater = useCallback((list: WatchLaterItem[]) => {
    localStorage.setItem('watchLaterList', JSON.stringify(list));
    setWatchLaterList(list);
  }, []);

  const saveQueue = useCallback((list: WatchLaterItem[]) => {
    localStorage.setItem('queueList', JSON.stringify(list));
    setQueueList(list);
  }, []);

  const addToWatchLater = useCallback((item: WatchLaterItem) => {
    const exists = watchLaterList.some(i => i.url === item.url);
    if (!exists) {
      saveWatchLater([...watchLaterList, item]);
    }
  }, [watchLaterList, saveWatchLater]);

  const addToQueue = useCallback((item: WatchLaterItem) => {
    const exists = queueList.some(i => i.url === item.url);
    if (!exists) {
      saveQueue([...queueList, item]);
    }
  }, [queueList, saveQueue]);

  const removeFromWatchLater = useCallback((url: string) => {
    saveWatchLater(watchLaterList.filter(i => i.url !== url));
  }, [watchLaterList, saveWatchLater]);

  const removeFromQueue = useCallback((url: string) => {
    saveQueue(queueList.filter(i => i.url !== url));
  }, [queueList, saveQueue]);

  const playItem = useCallback((item: WatchLaterItem) => {
    console.log('Playing:', item);
  }, []);

  return (
    <>
      <button
        className="watchlater-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Watch Later Panel öffnen"
      >
        📋
      </button>

      <section className={`watchlater-panel ${isOpen ? 'open' : ''}`}>
        <div className="watchlater-tabs">
          <button
            className={`watchlater-tab ${activeTab === 'watchlater' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlater')}
          >
            📋 Watch Later
          </button>
          <button
            className={`watchlater-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            ▶️ Auto-Play Queue
          </button>
        </div>

        <div id="watchlaterTab" className={`tab-content ${activeTab === 'watchlater' ? 'active' : ''}`}>
          {watchLaterList.length === 0 ? (
            <p className="empty-message">Keine Videos/Sender in Watch Later</p>
          ) : (
            <ul className="watchlater-list">
              {watchLaterList.map((item) => (
                <li key={item.url}>
                  <button onClick={() => playItem(item)}>
                    {item.name}
                  </button>
                  <button onClick={() => removeFromWatchLater(item.url)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="queueTab" className={`tab-content ${activeTab === 'queue' ? 'active' : ''}`}>
          {queueList.length === 0 ? (
            <p className="empty-message">Keine Sender in der Queue</p>
          ) : (
            <ul className="queue-list">
              {queueList.map((item) => (
                <li key={item.url}>
                  <button onClick={() => playItem(item)}>
                    {item.name}
                  </button>
                  <button onClick={() => removeFromQueue(item.url)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <style jsx>{`
        .watchlater-toggle {
          position: fixed;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 999;
        }

        .watchlater-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 300px;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          padding: 1rem;
          overflow-y: auto;
          z-index: 1000;
        }

        .watchlater-panel.open {
          transform: translateX(0);
        }

        .watchlater-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .watchlater-tab {
          flex: 1;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          color: #eaeaea;
          cursor: pointer;
        }

        .watchlater-tab.active {
          background: #e94560;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .watchlater-list,
        .queue-list {
          list-style: none;
        }

        .watchlater-list li,
        .queue-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 0.5rem;
          border-radius: 4px;
        }

        .watchlater-list li button,
        .queue-list li button {
          background: none;
          border: none;
          color: #eaeaea;
          cursor: pointer;
        }

        .empty-message {
          color: #888;
          font-style: italic;
        }
      `}</style>
    </>
  );
}
