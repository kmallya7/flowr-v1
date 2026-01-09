// js/dashboard.js

// 1. Register Chart.js Plugins
if (window.ChartDataLabels && window.Chart) {
  Chart.register(window.ChartDataLabels);
  console.log("ChartDataLabels plugin registered successfully!"); 
} else {
  console.warn("ChartDataLabels not found. Ensure the correct script tag is in index.html");
}

// 2. Global Chart Styling
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = '#64748b'; // slate-500
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)'; // faint slate border

// --- Utility Functions ---
console.log("dashboard.js loaded (Interactive Version)");

function $(id) { return document.getElementById(id); }

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

// --- Loading & Error State ---

function setLoading(isLoading) {
  const loader = $("dashboard-loading");
  const error = $("dashboard-error");
  const dashboardContent = document.querySelector("#dashboard > section");
  
  if (isLoading) {
    if (loader) show(loader);
    if (error) hide(error);
    if (dashboardContent) dashboardContent.classList.add("opacity-50", "pointer-events-none", "blur-sm");
  } else {
    if (loader) hide(loader);
    if (dashboardContent) dashboardContent.classList.remove("opacity-50", "pointer-events-none", "blur-sm");
  }
}

function setError(msg) {
  const error = $("dashboard-error");
  if (error) {
    error.innerText = msg;
    show(error);
  }
}

// --- Main Dashboard Loader ---

window.loadDashboard = async function () {
  const container = $("dashboard");
  if (!container) return;

  // Inject HTML Structure
  container.innerHTML = `
    <div id="dashboard-loading" class="hidden flex flex-col items-center justify-center py-20">
      <div class="relative w-16 h-16 mb-4">
         <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
         <img src="assets/Flowr Logo Big.png" class="relative w-full h-full rounded-full animate-breath shadow-lg">
      </div>
      <p class="text-sm text-slate-500 font-semibold animate-pulse tracking-wide">Crunching the numbers...</p>
    </div>
    
    <div id="dashboard-error" class="hidden p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center text-sm font-medium border border-red-100 dark:border-red-800"></div>

    <section class="max-w-[1400px] mx-auto space-y-6 animate-fade-in pb-12 transition-all duration-300">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i data-feather="bar-chart-2" class="w-5 h-5 text-blue-500"></i> Monthly Overview
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Financial & Operational Performance</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
           <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
             <button id="prev-month" class="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition shadow-sm"><i data-feather="chevron-left" class="w-4 h-4"></i></button>
             
             <div class="flex items-center gap-2 px-2 border-x border-slate-200 dark:border-slate-700 mx-1">
                <i data-feather="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                <select id="filter-month" class="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-center appearance-none hover:text-blue-600 transition"></select>
                <input id="filter-year" type="number" class="w-14 bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none text-center hover:text-blue-600 transition" value="${new Date().getFullYear()}" />
             </div>

             <button id="next-month" class="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition shadow-sm"><i data-feather="chevron-right" class="w-4 h-4"></i></button>
           </div>
           
           <button id="apply-filters" class="flex items-center gap-2 bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-slate-200 dark:shadow-none">Refresh</button>
           <button id="export-csv" class="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition"><i data-feather="download" class="w-4 h-4"></i></button>
        </div>
      </div>
      
      <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <button id="toggle-edit-mode" class="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
          <i data-feather="move" class="w-3 h-3"></i> <span>Customize Layout</span>
        </button>

        <label class="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none">
          <input type="checkbox" id="partial-toggle" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Compare against same period last month
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all" id="summary-cards"></div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-6">Revenue Trend</h3>
          <div class="h-72 w-full"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-6">Cost Breakdown</h3>
          <div class="h-64 flex items-center justify-center relative"><canvas id="costChart"></canvas></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wide">Best Selling Items</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
               <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <tr><th class="p-2">Item</th><th class="p-2">Qty</th><th class="p-2 text-right">Rev</th></tr>
               </thead>
               <tbody id="top-sellers-tbody" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
            </table>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wide">Top Clients</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
               <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <tr><th class="p-2">Client</th><th class="p-2">Orders</th><th class="p-2 text-right">Rev</th></tr>
               </thead>
               <tbody id="top-clients-tbody" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
         <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wide">Monthly Revenue Trend & Difference</h4>
         <div class="h-80 w-full"><canvas id="monthlyRevenueComboChart"></canvas></div>
      </div>
      
      <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
         <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wide">Daily Order Volume</h4>
         <div class="h-72 w-full"><canvas id="dailyOrdersAreaChart"></canvas></div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
         <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 uppercase tracking-wide">Profitability Analysis</h4>
         <div class="h-96 w-full"><canvas id="lineChart"></canvas></div>
      </div>

    </section>
  `;
  
  if (feather) feather.replace();

  // Populate Month Dropdown
  const monthSelect = $("filter-month");
  monthSelect.innerHTML = [...Array(12).keys()].map(m => 
    `<option value="${m+1}" class="dark:bg-slate-800">${new Date(0, m).toLocaleString('default', { month: 'long' })}</option>`
  ).join('');
  monthSelect.value = new Date().getMonth() + 1;

  // --- UPDATED EVENT LISTENERS (RENAMED FUNCTION) ---
  
  // 1. Arrows (Now calling changeDashboardMonth)
  $("prev-month").addEventListener("click", () => changeDashboardMonth(-1));
  $("next-month").addEventListener("click", () => changeDashboardMonth(1));
  
  // 2. Dropdown & Input Changes
  $("filter-month").addEventListener("change", () => applyFilters());
  $("filter-year").addEventListener("change", () => applyFilters());
  $("filter-year").addEventListener("keyup", (e) => {
    if(e.key === 'Enter') applyFilters(); 
  });

  // 3. Other Controls
  $("apply-filters").addEventListener("click", () => applyFilters());
  $("partial-toggle").addEventListener("change", () => applyFilters());
  $("export-csv").addEventListener("click", () => exportDashboardCSV());
  
  // --- DRAG AND DROP TOGGLE LOGIC ---
  const toggleEditBtn = $("toggle-edit-mode");
  let isEditMode = false;
  let sortableInstance = null;

  toggleEditBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    const cardsContainer = $("summary-cards");

    if (isEditMode) {
      // ENTER EDIT MODE
      toggleEditBtn.innerHTML = `<i data-feather="check" class="w-3 h-3 text-green-500"></i> <span class="text-green-600">Save Layout</span>`;
      feather.replace();
      
      // Initialize Sortable
      if (typeof Sortable !== 'undefined') {
        sortableInstance = Sortable.create(cardsContainer, {
          animation: 150,
          ghostClass: 'bg-blue-50', // Placeholder style
          onEnd: function (evt) {
            // Save order to LocalStorage
            const order = sortableInstance.toArray();
            localStorage.setItem('dashboardCardOrder', JSON.stringify(order));
          }
        });
      } else {
        alert("SortableJS library not found. Please ensure <script> tag is in index.html");
      }
      
      // Add visual cues
      cardsContainer.classList.add("ring-2", "ring-blue-100", "ring-offset-4", "rounded-xl");
      Array.from(cardsContainer.children).forEach(card => {
        card.classList.add("cursor-move", "ring-1", "ring-blue-500", "animate-pulse-slow");
        card.classList.remove("hover:shadow-md");
      });

    } else {
      // EXIT EDIT MODE (SAVE)
      toggleEditBtn.innerHTML = `<i data-feather="move" class="w-3 h-3"></i> <span>Customize Layout</span>`;
      feather.replace();
      
      // Destroy Sortable
      if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }

      // Remove visual cues
      cardsContainer.classList.remove("ring-2", "ring-blue-100", "ring-offset-4", "rounded-xl");
      Array.from(cardsContainer.children).forEach(card => {
        card.classList.remove("cursor-move", "ring-1", "ring-blue-500", "animate-pulse-slow");
        card.classList.add("hover:shadow-md");
      });
    }
  });

  // Initial Data Load
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  await loadDashboardData(m, y, null);
  await renderDailyOrdersAreaChart(m, y, null);
  await renderMonthlyRevenueComboChart();
};

// --- Helper Functions ---

// RENAMED FUNCTION TO AVOID CONFLICT WITH PAYMENTS.JS
function changeDashboardMonth(delta) {
  const monthSelect = $("filter-month");
  const yearInput = $("filter-year");

  // Safety check
  if (!monthSelect || !yearInput) return;

  // 1. Force values to be Numbers
  let m = parseInt(monthSelect.value, 10);
  let y = parseInt(yearInput.value, 10);

  // 2. Add or Subtract
  m += delta;

  // 3. Handle Rollover (Endless scrolling)
  if (m < 1) { 
    m = 12; 
    y--; 
  } else if (m > 12) { 
    m = 1; 
    y++; 
  }

  // 4. Update UI Controls Immediately
  monthSelect.value = m; 
  yearInput.value = y;

  // 5. Refresh Data
  applyFilters();
}

function applyFilters() {
  const m = parseInt($("filter-month").value);
  const y = parseInt($("filter-year").value);
  const usePartial = $("partial-toggle").checked;
  const dayLimit = usePartial ? new Date().getDate() : null;
  
  // Reload all data
  loadDashboardData(m, y, dayLimit);
  renderDailyOrdersAreaChart(m, y, dayLimit);
}

// --- Data Fetching and Logic ---

async function loadDashboardData(month, year, dayLimit = null) {
  setLoading(true);
  try {
    const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
    const endDay = dayLimit || new Date(year, month, 0).getDate();
    const endDate = `${datePrefix}-${String(endDay).padStart(2, '0')}`;
    
    // Fetch Current Month Data
    const logsSnap = await window.db.collection("dailyLogs")
      .where("date", ">=", `${datePrefix}-01`)
      .where("date", "<=", endDate)
      .get();

    if (logsSnap.empty) {
      renderEmptyState();
      setLoading(false);
      return;
    }

    let totalRevenue = 0, totalIngredients = 0, totalPackaging = 0;
    let allItems = [], clientMap = {};
    const uniqueDates = new Set();
    
    logsSnap.forEach(doc => {
      const d = doc.data();
      if (d.date) uniqueDates.add(d.date);
      if (d.items && Array.isArray(d.items)) {
        d.items.forEach(item => {
          allItems.push({ ...item, date: d.date, client: d.client });
          totalRevenue += item.revenue || 0;
          totalIngredients += item.ingredients || 0;
          totalPackaging += item.packaging || 0;
        });
      }
      if (d.client) {
        if (!clientMap[d.client]) clientMap[d.client] = { orders: 0, revenue: 0 };
        clientMap[d.client].orders += 1;
        if (d.items && Array.isArray(d.items)) {
          d.items.forEach(item => {
            clientMap[d.client].revenue += item.revenue || 0;
          });
        }
      }
    });

    // --- Metrics Calculation ---
    const orderCount = logsSnap.size;
    const totalCost = totalIngredients + totalPackaging; // Calculate Total Cost
    const grossProfit = totalRevenue - totalCost;
    const profitPercent = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;
    const clientCount = Object.keys(clientMap).length;
    const profitPerClient = clientCount ? grossProfit / clientCount : 0;
    const repeatCustomers = Object.values(clientMap).filter(c => c.orders > 1).length;

    // Item Stats
    const itemMap = {};
    allItems.forEach(item => {
      if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0, profit: 0 };
      itemMap[item.name].qty += item.qty || 0;
      itemMap[item.name].revenue += item.revenue || 0;
      itemMap[item.name].profit += (item.revenue || 0) - ((item.ingredients || 0) + (item.packaging || 0));
    });
    const itemsArr = Object.entries(itemMap).map(([name, stats]) => ({ name, ...stats }));
    const bestSelling = itemsArr.length ? [...itemsArr].sort((a, b) => b.qty - a.qty)[0] : null;
    const worstSelling = itemsArr.length ? [...itemsArr].sort((a, b) => a.qty - b.qty)[0] : null;
    const mostProfitable = itemsArr.length ? [...itemsArr].sort((a, b) => b.profit - a.profit)[0] : null;

    // Streak Logic
    const sortedDates = Array.from(uniqueDates).sort();
    const orderDays = sortedDates.length;
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = dayLimit ? dayLimit : (month === (new Date().getMonth()+1) ? new Date().getDate() : daysInMonth);
    const noOrderDays = Math.max(0, daysPassed - orderDays);

    let maxStreak = 0, currentStreak = 0, prevDate = null;
    sortedDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.ceil(Math.abs(currentDate - prevDate) / (1000 * 60 * 60 * 24)); 
        currentStreak = (diffDays === 1) ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      prevDate = currentDate;
    });
    if (sortedDates.length > 0 && maxStreak === 0) maxStreak = 1;

    // --- Comparison Logic (Previous Month) ---
    let prevMonth = month - 1, prevYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevEndDay = dayLimit || new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevPrefix}-${String(prevEndDay).padStart(2, '0')}`;
    
    const prevSnap = await window.db.collection("dailyLogs")
      .where("date", ">=", `${prevPrefix}-01`)
      .where("date", "<=", prevEndDate)
      .get();
      
    let prevRevenue = 0, prevCost = 0, prevProfit = 0;
    const prevClientSet = new Set();

    prevSnap.forEach(doc => {
      const d = doc.data();
      if(d.client) prevClientSet.add(d.client);
      if (d.items) d.items.forEach(i => {
        prevRevenue += i.revenue || 0;
        prevCost += (i.ingredients || 0) + (i.packaging || 0); // Accumulate Previous Cost
        prevProfit += (i.revenue || 0) - ((i.ingredients || 0) + (i.packaging || 0));
      });
    });
    
    const prevClientCount = prevClientSet.size;
    const prevProfitPerClient = prevClientCount ? prevProfit / prevClientCount : 0;
    const prevProfitPercent = prevRevenue ? (prevProfit / prevRevenue) * 100 : 0;
    
    // Render Everything
    renderSummaryCards({
      totalRevenue, totalCost, grossProfit, profitPercent, profitPerClient,
      orderCount, avgOrderValue, repeatCustomers,
      bestSelling, worstSelling, mostProfitable,
      orderDays, maxStreak, noOrderDays,
      prevRevenue, prevCost, prevProfit, prevProfitPercent, prevProfitPerClient
    });

    renderTopItems(itemsArr);
    renderTopClients(clientMap);
    renderTrendChart(logsSnap);
    renderCostChart(totalIngredients, totalPackaging, grossProfit);
    renderLineChart(allItems);

    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Failed to load data. Please try again.");
    setLoading(false);
  }
}

function renderEmptyState() {
  $("summary-cards").innerHTML = "";
  $("top-sellers-tbody").innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400">No data found</td></tr>`;
  $("top-clients-tbody").innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400">No data found</td></tr>`;
  setError("No records found for this month.");
}

// --- UI Rendering Functions (Cards & Sorting) ---

function pctChange(c, p) {
  if (!p && !c) return "";
  if (!p) return "+100%";
  if (!c) return "-100%";
  const val = ((c - p) / Math.abs(p)) * 100;
  return (val >= 0 ? "+" : "") + val.toFixed(1) + "%";
}

function createCardHTML(id, title, value, subValue, trend, trendGood, iconSvg, colorClass) {
  const trendColor = trendGood ? 'text-emerald-600' : 'text-red-500';
  const hasTrend = trend && trend !== "0%" && trend !== "";
  
  return `
    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition hover:shadow-md flex flex-col justify-between h-full group" data-id="${id}">
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">${title}</p>
          <h3 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mt-1 break-words">${value}</h3>
        </div>
        <div class="p-2 rounded-xl ${colorClass} shrink-0">
           ${iconSvg}
        </div>
      </div>
      <div class="mt-2 flex flex-col">
        ${hasTrend ? `<div class="text-xs font-bold ${trendColor} mb-0.5">${trend} vs last month</div>` : ''}
        <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">${subValue}</div>
      </div>
    </div>
  `;
}

function renderSummaryCards(data) {
  const cardsContainer = $("summary-cards");
  
  // Calculate Changes
  const revenueChg = pctChange(data.totalRevenue, data.prevRevenue);
  const costChg = pctChange(data.totalCost, data.prevCost);
  const profitChg = pctChange(data.grossProfit, data.prevProfit);
  const profitPctChg = pctChange(data.profitPercent, data.prevProfitPercent);
  const ppcChg = pctChange(data.profitPerClient, data.prevProfitPerClient);

  // SVG Icons
  const iDollar = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
  const iRupee = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M11.5 21L6 13h6c2.8 0 5-2.2 5-5s-2.2-5-5-5H6"/></svg>`;
  const iUsers = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  const iBag = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
  const iPie = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`;
  const iStar = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  const iAlert = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  const iZap = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
  const iCal = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  const iTag = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`;
  const iTrend = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;

  // 1. Define All Possible Cards
  const cardDefinitions = [
    {
      id: "total-cost",
      html: createCardHTML("total-cost", "Total Cost", "₹" + data.totalCost.toLocaleString('en-IN'), "Ingredients + Pkg", costChg, !costChg.startsWith("+"), iTag, "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")
    },
    {
      id: "gross-profit",
      html: createCardHTML("gross-profit", "Gross Profit", "₹" + data.grossProfit.toLocaleString('en-IN'), "Rev - Cost", profitChg, !profitChg.startsWith("-"), iTrend, "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
    },
    {
      id: "actual-profit",
      html: createCardHTML("actual-profit", "Actual Profit", "₹" + data.grossProfit.toLocaleString('en-IN'), "Gross - Fixed Exp", profitChg, !profitChg.startsWith("-"), iPie, "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400")
    },
    {
      id: "profit-client",
      html: createCardHTML("profit-client", "Profit per Client", "₹" + data.profitPerClient.toFixed(0), "Avg profit/customer", ppcChg, !ppcChg.startsWith("-"), iUsers, "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400")
    },
    {
      id: "profit-margin",
      html: createCardHTML("profit-margin", "Profit Margin", data.profitPercent.toFixed(1) + "%", "Of total revenue", profitPctChg, !profitPctChg.startsWith("-"), iPie, "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400")
    },
    {
      id: "total-orders",
      html: createCardHTML("total-orders", "Total Orders", data.orderCount, "Processed this month", "", true, iBag, "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400")
    },
    {
      id: "avg-order",
      html: createCardHTML("avg-order", "Avg Order Value", "₹" + data.avgOrderValue.toFixed(0), "Revenue per order", "", true, iRupee, "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400")
    },
    {
      id: "repeat-cust",
      html: createCardHTML("repeat-cust", "Repeat Customers", data.repeatCustomers, "Returning clients", "", true, iUsers, "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400")
    },
    {
      id: "best-seller",
      html: createCardHTML("best-seller", "Best Seller", data.bestSelling ? data.bestSelling.name : "N/A", data.bestSelling ? `Qty: ${data.bestSelling.qty}` : "-", "", true, iStar, "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")
    },
    {
      id: "worst-seller",
      html: createCardHTML("worst-seller", "Worst Seller", data.worstSelling ? data.worstSelling.name : "N/A", data.worstSelling ? `Qty: ${data.worstSelling.qty}` : "-", "", false, iAlert, "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400")
    },
    {
      id: "most-profitable",
      html: createCardHTML("most-profitable", "Most Profitable", data.mostProfitable ? data.mostProfitable.name : "N/A", data.mostProfitable ? `Profit: ₹${data.mostProfitable.profit.toFixed(0)}` : "-", "", true, iStar, "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400")
    },
    {
      id: "order-days",
      html: createCardHTML("order-days", "Order Days", data.orderDays, "Days with ≥ 1 order", "", true, iCal, "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400")
    },
    {
      id: "streak",
      html: createCardHTML("streak", "Order Streak", data.maxStreak, "Consecutive days", "", true, iZap, "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400")
    },
    {
      id: "no-order",
      html: createCardHTML("no-order", "No Order Days", data.noOrderDays, "Days with 0 orders", "", false, iCal, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500")
    },
    {
      id: "total-rev",
      html: createCardHTML("total-rev", "Total Revenue", "₹" + data.totalRevenue.toLocaleString('en-IN'), "Gross Income", revenueChg, !revenueChg.startsWith("-"), iRupee, "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")
    }
  ];

  // 2. Load Saved Order from LocalStorage
  const savedOrder = JSON.parse(localStorage.getItem('dashboardCardOrder'));
  
  // 3. Sort Definitions
  let sortedCards = [];
  if (savedOrder && savedOrder.length > 0) {
    sortedCards = savedOrder.map(id => cardDefinitions.find(c => c.id === id)).filter(Boolean);
    const savedIds = new Set(savedOrder);
    const newCards = cardDefinitions.filter(c => !savedIds.has(c.id));
    sortedCards = [...sortedCards, ...newCards];
  } else {
    // Default Order
    sortedCards = cardDefinitions;
  }

  // 4. Render
  cardsContainer.innerHTML = sortedCards.map(c => c.html).join('');
}


// --- Charts Rendering with Data Labels Enabled ---

function renderTrendChart(logsSnap) {
  const dailyTotals = {};
  logsSnap.forEach(doc => {
    const d = doc.data();
    if (!dailyTotals[d.date]) dailyTotals[d.date] = 0;
    (d.items || []).forEach(item => dailyTotals[d.date] += item.revenue || 0);
  });

  const rawDates = Object.keys(dailyTotals).sort();
  const labels = rawDates.map(d => new Date(d).getDate());
  const data = rawDates.map(d => dailyTotals[d]);

  const ctx = $("trendChart").getContext("2d");
  if (window.trendChartInstance) window.trendChartInstance.destroy();
  
  window.trendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: "Revenue",
        data,
        backgroundColor: "#3b82f6", // blue-500
        borderRadius: 4,
        hoverBackgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 30 // <--- ADDED PADDING TO FIX CLIPPING
        }
      },
      plugins: {
          legend: { display: false },
          datalabels: {
              display: 'auto',
              align: 'end',
              anchor: 'end',
              offset: -4,
              color: '#64748b',
              font: { weight: 'bold', size: 10 },
              formatter: (value) => '₹' + (value >= 1000 ? (value/1000).toFixed(1) + 'k' : value)
          }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { callback: v => '₹' + v } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderCostChart(ingredients, packaging, profit) {
  const ctx = $("costChart").getContext("2d");
  if (window.costChartInstance) window.costChartInstance.destroy();
  
  window.costChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ["Ingredients", "Packaging", "Profit"],
      datasets: [{
        data: [ingredients, packaging, profit],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"], // red, amber, green
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
          datalabels: {
              color: 'white',
              font: { weight: 'bold' },
              formatter: (value, ctx) => {
                  let sum = 0;
                  let dataArr = ctx.chart.data.datasets[0].data;
                  dataArr.map(data => { sum += data; });
                  let percentage = (value*100 / sum).toFixed(1)+"%";
                  return percentage;
              }
          }
      }
    }
  });
}

function renderTopItems(itemsArr) {
  const topItems = itemsArr.slice().sort((a, b) => b.qty - a.qty).slice(0, 5);
  $("top-sellers-tbody").innerHTML = topItems.map(item => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="p-2 font-medium text-slate-800 dark:text-slate-200">${item.name}</td>
      <td class="p-2 text-slate-500 dark:text-slate-400">${item.qty}</td>
      <td class="p-2 text-right font-medium text-slate-800 dark:text-slate-200">₹${item.revenue.toFixed(0)}</td>
    </tr>
  `).join('');
}

function renderTopClients(clientMap) {
  const topClients = Object.entries(clientMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  $("top-clients-tbody").innerHTML = topClients.map(([name, stats]) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="p-2 font-medium text-slate-800 dark:text-slate-200">${name}</td>
      <td class="p-2 text-slate-500 dark:text-slate-400">${stats.orders}</td>
      <td class="p-2 text-right font-medium text-slate-800 dark:text-slate-200">₹${stats.revenue.toFixed(0)}</td>
    </tr>
  `).join('');
}

async function renderDailyOrdersAreaChart(month, year, dayLimit) {
  const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
  const endDay = dayLimit || new Date(year, month, 0).getDate();
  const endDate = `${datePrefix}-${String(endDay).padStart(2, '0')}`;
  
  const logsSnap = await window.db.collection("dailyLogs")
    .where("date", ">=", `${datePrefix}-01`)
    .where("date", "<=", endDate)
    .get();

  const orderCountMap = {};
  for (let d = 1; d <= endDay; d++) {
    orderCountMap[`${datePrefix}-${String(d).padStart(2, '0')}`] = 0;
  }
  logsSnap.forEach(doc => {
    const d = doc.data();
    if (d.date && orderCountMap.hasOwnProperty(d.date)) orderCountMap[d.date]++;
  });

  const labels = Object.keys(orderCountMap).map(d => new Date(d).getDate());
  const data = Object.values(orderCountMap);

  const ctx = $("dailyOrdersAreaChart").getContext("2d");
  if (window.dailyOrdersAreaChartInstance) window.dailyOrdersAreaChartInstance.destroy();
  
  window.dailyOrdersAreaChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Orders",
        data,
        borderColor: "#8b5cf6", // violet
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
            top: 20 // Added small padding for labels here too
        }
      },
      plugins: {
          legend: { display: false },
          datalabels: {
              display: 'auto',
              align: 'top',
              color: '#8b5cf6',
              font: { weight: 'bold', size: 10 },
              formatter: (value) => value > 0 ? value : ''
          }
      },
      scales: { y: { display: false, beginAtZero: true }, x: { display: false } }
    }
  });
}

// --------------------------------------------------------------------------------
// UPDATED Monthly Revenue Trend & Difference Combo Chart
// --------------------------------------------------------------------------------
async function renderMonthlyRevenueComboChart() {
    // 1. Fetch Data
    const logsSnap = await window.db.collection("dailyLogs").get();
    const monthlyTotals = {};
    
    // Group Revenue by YYYY-MM
    logsSnap.forEach(doc => {
      const d = doc.data();
      if (!d.date) return;
      const k = d.date.substring(0, 7);
      if (!monthlyTotals[k]) monthlyTotals[k] = 0;
      (d.items || []).forEach(item => monthlyTotals[k] += item.revenue || 0);
    });

    const sortedKeys = Object.keys(monthlyTotals).sort();
    
    // Labels: 'May 2025', 'Jun 2025'
    const labels = sortedKeys.map(k => {
        const [y, m] = k.split('-');
        return new Date(y, m-1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    const revenueData = sortedKeys.map(k => monthlyTotals[k]);
    
    // Calculate Difference from Previous Month
    const diffData = revenueData.map((curr, index) => {
        if (index === 0) return 0;
        return curr - revenueData[index - 1];
    });

    // 2. Render Chart
    const ctx = $("monthlyRevenueComboChart").getContext("2d");
    if (window.monthlyRevenueComboChartInstance) window.monthlyRevenueComboChartInstance.destroy();

    window.monthlyRevenueComboChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Difference from Previous Month',
                    data: diffData,
                    type: 'line',
                    borderColor: '#10b981', // Emerald 500
                    backgroundColor: '#10b981',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    order: 1, // Draw on top
                    datalabels: {
                        align: 'top',
                        anchor: 'start',
                        offset: 10,
                        backgroundColor: (context) => context.dataset.borderColor,
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value) => {
                            const sign = value > 0 ? '+' : '';
                            return sign + '₹' + value.toLocaleString();
                        },
                        display: (context) => context.dataIndex > 0 // Hide first point 0
                    }
                },
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: '#6366f1', // Indigo 500 (Matches image)
                    hoverBackgroundColor: '#4f46e5',
                    borderRadius: 4,
                    order: 2,
                    datalabels: {
                        align: 'end',
                        anchor: 'start', // Position near bottom inside
                        offset: -20, // Push slightly up
                        color: 'white', // Text inside bar
                        font: { weight: 'bold', size: 11 },
                        formatter: (value) => '₹' + value.toLocaleString()
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30 // <--- ADDED PADDING TO FIX CLIPPING
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom', // Move legend to bottom
                    align: 'center',    // Center align legend
                    labels: { usePointStyle: true, boxWidth: 8 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { callback: v => '₹' + v.toLocaleString() }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderLineChart(allItems) {
  const dailyMap = {};
  allItems.forEach(item => {
    const d = item.date || "Unknown";
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, profit: 0 };
    dailyMap[d].revenue += item.revenue || 0;
    dailyMap[d].profit += (item.revenue || 0) - ((item.ingredients || 0) + (item.packaging || 0));
  });
  
  const dates = Object.keys(dailyMap).sort();
  const revenues = dates.map(d => dailyMap[d].revenue);
  const profits = dates.map(d => dailyMap[d].profit);
  const labels = dates.map(d => new Date(d).getDate());

  const ctx = $("lineChart").getContext("2d");
  if (window.lineChartInstance) window.lineChartInstance.destroy();
  
  window.lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenues,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: "Profit",
          data: profits,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', align: 'end' }, datalabels: { display: false } },
      scales: { y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { callback: v => '₹' + v } }, x: { grid: { display: false } } }
    }
  });
}

// --- CSV Export ---

async function exportDashboardCSV() {
  const month = parseInt($("filter-month").value);
  const year = parseInt($("filter-year").value);
  const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
  const logsSnap = await window.db.collection("dailyLogs")
    .where("date", ">=", `${datePrefix}-01`)
    .where("date", "<=", `${datePrefix}-31`)
    .get();

  let csv = "Date,Client,Item,Qty,Revenue,Ingredients,Packaging,Profit,Notes\n";
  logsSnap.forEach(doc => {
    const d = doc.data();
    (d.items || []).forEach(item => {
      const profit = (item.revenue || 0) - ((item.ingredients || 0) + (item.packaging || 0));
      csv += [
        d.date, `"${d.client || ""}"`, `"${d.client || ""}"`,
        item.qty || 0, item.revenue || 0, item.ingredients || 0,
        item.packaging || 0, profit, `"${d.notes || ""}"`
      ].join(",") + "\n";
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Lush_Dashboard_${year}_${month}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}