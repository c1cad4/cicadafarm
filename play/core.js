(function (root) {
  "use strict";
  const api = {
    capacity: 20,
    duration: 180,
    deposit(cargo) {
      return Math.max(0, Math.min(20, Math.floor(Number(cargo) || 0)));
    },
    level(total) {
      return 1 + Math.floor(Math.sqrt(Math.max(0, Number(total) || 0) / 40));
    },
    readProgress(raw) {
      try {
        const v = JSON.parse(raw);
        return {
          total:
            Number.isSafeInteger(v?.total) && v.total >= 0 && v.total <= 1e9
              ? v.total
              : 0,
          best:
            Number.isSafeInteger(v?.best) && v.best >= 0 && v.best <= 10000
              ? v.best
              : 0,
        };
      } catch {
        return { total: 0, best: 0 };
      }
    },
    weather(elapsed) {
      return ["sun", "rain", "wind", "dry"][
        Math.floor(Math.max(0, elapsed) / 45) % 4
      ];
    },
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SwarmCore = api;
})(typeof globalThis === "object" ? globalThis : this);
