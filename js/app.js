(function () {
  'use strict';

  var fmtCurrency = function (n) {
    return Number(n).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  var ordinal = function (n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  var dom = {};
  var latestData = null;
  var lastFetchedAt = null;

  function init() {
    dom.dateDisplay = document.getElementById('dateDisplay');
    dom.calendarProgress = document.getElementById('calendarProgress');
    dom.syncBtn = document.getElementById('syncBtn');
    dom.syncStatus = document.getElementById('syncStatus');
    dom.threeContainer = document.getElementById('three-container');
    dom.expensesList = document.getElementById('expenses-list');
    dom.footerTimestamp = document.getElementById('footerTimestamp');
    dom.metricEls = {
      currentBalance: document.getElementById('val-currentBalance'),
      savingsBalance: document.getElementById('val-savingsBalance'),
      currentAmexBalance: document.getElementById('val-currentAmexBalance'),
      totalOutgoings: document.getElementById('val-totalOutgoings'),
      remainingOutgoings: document.getElementById('val-remainingOutgoings'),
      balanceAfterExpenses: document.getElementById('val-balanceAfterExpenses')
    };
    dom.simCost = document.getElementById('sim-cost');
    dom.simAmexToggle = document.getElementById('sim-amex-toggle');
    dom.simNetBalance = document.getElementById('sim-net-balance');
    dom.simAmexLine = document.getElementById('sim-amex-line');
    dom.simAmexResult = document.getElementById('sim-amex-result');
    dom.simVerdict = document.getElementById('sim-verdict');
    dom.tabBtns = document.querySelectorAll('.tab-btn');
    dom.tabPanels = {
      balances: document.getElementById('tab-balances'),
      pipeline: document.getElementById('tab-pipeline'),
      simulator: document.getElementById('tab-simulator')
    };

    updateDateDisplay();

    var meta = FinanceAPI.getCacheMeta();
    if (meta) {
      lastFetchedAt = meta.fetchedAt;
      updateFooterTimestamp();
    }

    bindEvents();

    try {
      FinanceScene.init(dom.threeContainer);
    } catch (e) {
      console.warn('Three.js init failed:', e);
    }

    // Instant render from cache, then refresh from network
    var cached = FinanceAPI.getCached();
    if (cached) renderDashboard(cached);

    setStatus('Refreshing data\u2026');
    FinanceAPI.fetchLive()
      .then(function (data) {
        clearStatus();
        renderDashboard(data);
      })
      .catch(function () {
        if (!cached) fallbackEmpty();
        setStatus('Unable to reach Google, showing cached data');
        setTimeout(clearStatus, 5000);
      });

    // Debounced resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { FinanceScene.resize(); }, 150);
    });
  }

  function updateDateDisplay() {
    var now = new Date();
    dom.dateDisplay.textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    var today = now.getDate();
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    dom.calendarProgress.style.width = (today / daysInMonth * 100) + '%';
  }

  function setStatus(msg) {
    if (!dom.syncStatus) return;
    dom.syncStatus.textContent = msg;
    dom.syncStatus.classList.remove('hidden');
  }

  function clearStatus() {
    if (!dom.syncStatus) return;
    dom.syncStatus.textContent = '';
    dom.syncStatus.classList.add('hidden');
  }

  function updateFooterTimestamp() {
    if (lastFetchedAt) {
      dom.footerTimestamp.textContent = 'Last updated: ' + new Date(lastFetchedAt).toLocaleString('en-GB');
    }
  }

  function bindEvents() {
    dom.syncBtn.addEventListener('click', function () {
      dom.syncBtn.classList.add('sync-spinning');
      setStatus('Refreshing data\u2026');
      FinanceAPI.fetchLive()
        .then(function (data) {
          clearStatus();
          renderDashboard(data);
        })
        .catch(function () {
          setStatus('Unable to reach Google, showing cached data');
          setTimeout(clearStatus, 5000);
        })
        .finally(function () { dom.syncBtn.classList.remove('sync-spinning'); });
    });

    dom.simCost.addEventListener('input', runSimulator);
    dom.simAmexToggle.addEventListener('click', function () {
      var isOn = dom.simAmexToggle.classList.contains('on');
      dom.simAmexToggle.classList.toggle('on', !isOn);
      dom.simAmexToggle.classList.toggle('off', isOn);
      dom.simAmexToggle.querySelector('.toggle-label').textContent = isOn ? 'OFF' : 'ON';
      runSimulator();
    });

    dom.tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        dom.tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.dataset.tab;
        Object.keys(dom.tabPanels).forEach(function (key) {
          dom.tabPanels[key].classList.toggle('hidden', key !== tab);
        });
        setTimeout(function () { FinanceScene.resize(); }, 50);
      });
    });
  }

  function renderDashboard(data) {
    var balance = Number(data.balanceAfterExpenses) || 0;

    dom.metricEls.currentBalance.textContent = fmtCurrency(data.currentBalance);
    dom.metricEls.savingsBalance.textContent = fmtCurrency(data.savingsBalance);
    dom.metricEls.totalOutgoings.textContent = fmtCurrency(data.totalOutgoings);
    dom.metricEls.remainingOutgoings.textContent = fmtCurrency(data.remainingOutgoings);

    var amex = Number(data.currentAmexBalance) || 0;
    dom.metricEls.currentAmexBalance.textContent = fmtCurrency(amex);
    var amexColor = amex < 850 ? '#22c55e' : amex < 1200 ? '#f59e0b' : '#ef4444';
    dom.metricEls.currentAmexBalance.style.color = amexColor;
    dom.metricEls.currentAmexBalance.parentElement.style.setProperty('--glow-color', amexColor);
    var amexWarn = document.getElementById('amex-warning');
    if (amexWarn) amexWarn.classList.toggle('hidden', amex < 1500);

    var cashRemaining = Number(data.balanceAfterExpenses) || 0;
    dom.metricEls.balanceAfterExpenses.textContent = fmtCurrency(cashRemaining);
    var cashColor = cashRemaining >= 125 ? '#818cf8' : cashRemaining >= 75 ? '#f59e0b' : '#ef4444';
    dom.metricEls.balanceAfterExpenses.style.color = cashColor;
    dom.metricEls.balanceAfterExpenses.parentElement.style.setProperty('--glow-color', cashColor);

    FinanceScene.setBalanceState(balance);

    renderExpenses(data.expenses || []);

    lastFetchedAt = Date.now();
    updateFooterTimestamp();
    latestData = data;
  }

  function runSimulator() {
    if (!latestData) return;
    var cost = parseFloat(dom.simCost.value) || 0;
    var toggleOn = dom.simAmexToggle.classList.contains('on');

    var safeToSpend = Number(latestData.balanceAfterExpenses) || 0;
    var amexBalance = Number(latestData.currentAmexBalance) || 0;

    var netBalance = toggleOn ? safeToSpend : safeToSpend - cost;
    var simAmex = toggleOn ? amexBalance + cost : 0;

    dom.simNetBalance.textContent = cost > 0 ? fmtCurrency(netBalance) : '\u2014';

    if (toggleOn && cost > 0) {
      dom.simAmexLine.classList.remove('hidden');
      dom.simAmexResult.textContent = fmtCurrency(simAmex);
    } else {
      dom.simAmexLine.classList.add('hidden');
    }

    if (cost > 0) {
      var verdictText, verdictClass, flashClass;
      if (toggleOn) {
        if (simAmex <= 850) {
          verdictText = 'VERDICT: TRANSACTION APPROVED (Safe Threshold Maintained)';
          verdictClass = 'text-emerald-400';
          flashClass = '';
        } else if (simAmex <= 1250) {
          verdictText = 'VERDICT: CAUTION ADVISED (Approaching Capital Floor)';
          verdictClass = 'text-amber-400';
          flashClass = '';
        } else {
          verdictText = 'WARNING: TRANSACTION DENIED (Liquidity Deficit Risk)';
          verdictClass = 'text-rose-500';
          flashClass = 'verdict-flash';
        }
      } else {
        if (netBalance >= 300) {
          verdictText = 'VERDICT: TRANSACTION APPROVED (Safe Threshold Maintained)';
          verdictClass = 'text-emerald-400';
          flashClass = '';
        } else if (netBalance >= 100) {
          verdictText = 'VERDICT: CAUTION ADVISED (Approaching Capital Floor)';
          verdictClass = 'text-amber-400';
          flashClass = '';
        } else {
          verdictText = 'WARNING: TRANSACTION DENIED (Liquidity Deficit Risk)';
          verdictClass = 'text-rose-500';
          flashClass = 'verdict-flash';
        }
      }
      dom.simVerdict.textContent = verdictText;
      dom.simVerdict.className = 'simulator-verdict ' + verdictClass + ' ' + flashClass;
      FinanceScene.setSimulatedState(netBalance);
    } else {
      dom.simVerdict.textContent = '';
      dom.simVerdict.className = 'simulator-verdict';
      FinanceScene.clearSimulation();
    }
  }

  function renderExpenses(expenses) {
    var today = new Date().getDate();
    var html = '';
    expenses.forEach(function (exp) {
      var isSettled = exp.dueDay <= today;
      var amt = fmtCurrency(exp.amount);
      html += '<div class="expense-row" style="opacity:' + (isSettled ? 0.4 : 1) + '">'
        + '<span class="expense-name">' + escapeHtml(exp.name) + '</span>'
        + '<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">'
        + '<span class="expense-day">' + ordinal(exp.dueDay) + '</span>'
        + '<span class="badge ' + (isSettled ? 'badge-settled' : 'badge-pending') + '">' + (isSettled ? 'SETTLED' : 'PENDING') + '</span>'
        + '<span class="expense-amount' + (isSettled ? ' line-through' : '') + '">' + amt + '</span>'
        + '</div></div>';
    });
    dom.expensesList.innerHTML = html;
  }

  function fallbackEmpty() {
    var vals = ['currentBalance', 'savingsBalance', 'currentAmexBalance', 'totalOutgoings', 'remainingOutgoings', 'balanceAfterExpenses'];
    vals.forEach(function (id) {
      if (dom.metricEls[id]) dom.metricEls[id].textContent = '\u2014';
    });
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
