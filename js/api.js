const FinanceAPI = (() => {
  const STORAGE_KEY = 'financeDashboardData';
  const API_URL = 'https://script.google.com/macros/s/AKfycbzCMODsiA9V_uHwpKX8JhnJl3LpmXNU3g1XfnXnuEnIRFSLY_BlfjyIkJQnKr4WXBbT/exec';

  function getCached() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setCached(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async function fetchLive() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    setCached(data);
    return data;
  }

  return { getCached, setCached, fetchLive };
})();