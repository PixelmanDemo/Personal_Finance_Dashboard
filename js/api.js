const FinanceAPI = (() => {
  const STORAGE_KEY = 'financeDashboardData';
  const API_URL = 'https://script.google.com/macros/s/AKfycbzCMODsiA9V_uHwpKX8JhnJl3LpmXNU3g1XfnXnuEnIRFSLY_BlfjyIkJQnKr4WXBbT/exec';
  const FRESH_MS = 60000;

  function getRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getCached() {
    var wrapper = getRaw();
    return wrapper ? wrapper.data : null;
  }

  function getCacheMeta() {
    var wrapper = getRaw();
    return wrapper ? { fetchedAt: wrapper.fetchedAt } : null;
  }

  function setCached(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: data, fetchedAt: Date.now() }));
    } catch {}
  }

  async function fetchLive() {
    var wrapper = getRaw();
    if (wrapper && Date.now() - wrapper.fetchedAt < FRESH_MS) {
      return wrapper.data;
    }
    var res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    setCached(data);
    return data;
  }

  return { getCached: getCached, getCacheMeta: getCacheMeta, setCached: setCached, fetchLive: fetchLive };
})();
