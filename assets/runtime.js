(function (root) {
  'use strict';

  function createStore(getStorage, onFailure = () => {}) {
    const session = new Map();
    let failed = false;
    function failure() {
      if (!failed) onFailure();
      failed = true;
    }
    return {
      getItem(key) {
        if (session.has(key)) return session.get(key);
        try { return getStorage().getItem(key); }
        catch { failure(); return null; }
      },
      setItem(key, value) {
        session.set(key, String(value));
        try { getStorage().setItem(key, String(value)); return true; }
        catch { failure(); return false; }
      },
      removeItem(key) {
        session.set(key, null);
        try { getStorage().removeItem(key); }
        catch { failure(); }
      }
    };
  }

  function readArray(store, key, limit, validate) {
    try {
      const raw = store.getItem(key);
      if (!raw || raw.length > 256000) return [];
      const items = JSON.parse(raw);
      return Array.isArray(items) ? items.filter(validate).slice(-limit) : [];
    } catch { return []; }
  }

  function createFrameLoop(draw, { request, cancel, fps = 30 }) {
    let frame = null, running = false, last = -Infinity;
    function tick(time) {
      if (!running) return;
      if (time - last >= 1000 / fps - 0.5) { last = time; draw(time); }
      if (running) frame = request(tick);
    }
    return {
      start() {
        if (running) return;
        running = true; last = -Infinity; frame = request(tick);
      },
      stop() {
        running = false;
        if (frame !== null) cancel(frame);
        frame = null;
      },
      get running() { return running; }
    };
  }

  const api = { createStore, readArray, createFrameLoop };
  if (typeof module !== 'undefined') module.exports = api;
  else root.FarmRuntime = api;
})(globalThis);
