// --- Data State ---
let currentEventItems = [];
let loadedEventsCache = {}; 
let salesChartInstance = null;
let costChartInstance = null;
let currentEditingEventId = null;
let pendingModalAction = null; 

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    injectAnalyticsView();
    injectCustomModal(); 
    injectEventStyles();      // NEW: Injects CSS to hide spinners
    adjustPriceColumnWidth(); // NEW: Fixes the column width via JS
    setTimeout(() => {
        loadEvents();
    }, 1000); 
});

// --- UI Fixes (Styles & Layout) ---

// 1. Inject CSS to hide number spinners (Arrows)
function injectEventStyles() {
    if (document.getElementById('event-calc-styles')) return;

    const style = document.createElement('style');
    style.id = 'event-calc-styles';
    style.textContent = `
        /* Hide spinners for Chrome, Safari, Edge, Opera */
        #eventDetailView input[type=number]::-webkit-inner-spin-button, 
        #eventDetailView input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        /* Hide spinners for Firefox */
        #eventDetailView input[type=number] {
          -moz-appearance: textfield; 
        }
    `;
    document.head.appendChild(style);
}

// 2. Programmatically widen the Price column header
function adjustPriceColumnWidth() {
    // We look for the "Price" header and force it to be wider
    const headers = document.querySelectorAll('#eventDetailView th');
    headers.forEach(th => {
        if(th.innerText.includes('Price')) {
            th.classList.remove('w-28'); // Remove old width
            th.classList.add('w-32');    // Add wider width
        }
    });
}

// --- Navigation ---

function openEventCalculator() {
  currentEditingEventId = null;
  const saveBtn = document.querySelector('#eventDetailView button[onclick="saveEvent()"]');
  if(saveBtn) saveBtn.innerHTML = `<i data-feather="save"></i> Save Event`;

  document.getElementById('eventsListView').classList.add('hidden');
  document.getElementById('eventDetailView').classList.remove('hidden');
  document.getElementById('eventAnalyticsView').classList.add('hidden');
  
  document.getElementById('eventDateInput').valueAsDate = new Date();
  
  // Clear previous data
  document.getElementById('eventNameInput').value = '';
  document.getElementById('eventTableBody').innerHTML = '';
  document.getElementById('eventRent').value = '';
  document.getElementById('eventTransport').value = '';
  document.getElementById('eventStaff').value = '';
  currentEventItems = [];
  
  addEventRow();
  calculateEventTotals();
  feather.replace();
}

function editEvent(eventId) {
    const data = loadedEventsCache[eventId];
    if (!data) return;

    currentEditingEventId = eventId; 

    document.getElementById('eventsListView').classList.add('hidden');
    document.getElementById('eventDetailView').classList.remove('hidden');
    document.getElementById('eventAnalyticsView').classList.add('hidden');

    document.getElementById('eventNameInput').value = data.name;
    document.getElementById('eventDateInput').value = data.date;
    document.getElementById('eventRent').value = data.expenses.rent || '';
    document.getElementById('eventTransport').value = data.expenses.transport || '';
    document.getElementById('eventStaff').value = data.expenses.staff || '';

    const tbody = document.getElementById('eventTableBody');
    tbody.innerHTML = ''; 

    data.items.forEach(item => {
        addEventRow(); 
        const rows = tbody.querySelectorAll('tr');
        const lastRow = rows[rows.length - 1];
        const rowId = lastRow.id.replace('row-', '');

        lastRow.querySelector('.item-name').value = item.name;
        lastRow.querySelector('.item-cost').value = item.cost;
        lastRow.querySelector('.item-open').value = item.open;
        lastRow.querySelector('.item-close').value = item.close;
        lastRow.querySelector('.item-price').value = item.price;

        updateRowCalc(rowId);
    });

    calculateEventTotals();
    
    const saveBtn = document.querySelector('#eventDetailView button[onclick="saveEvent()"]');
    if(saveBtn) saveBtn.innerHTML = `<i data-feather="refresh-cw"></i> Update Event`;
    feather.replace();
}

function closeEventCalculator() {
  document.getElementById('eventDetailView').classList.add('hidden');
  document.getElementById('eventAnalyticsView').classList.add('hidden');
  document.getElementById('eventsListView').classList.remove('hidden');
  
  currentEditingEventId = null;
  const saveBtn = document.querySelector('#eventDetailView button[onclick="saveEvent()"]');
  if(saveBtn) saveBtn.innerHTML = `<i data-feather="save"></i> Save Event`;
  
  loadEvents(); 
}

// --- Custom Modal System ---

function injectCustomModal() {
    if (!document.getElementById('appModal')) {
        const modalHtml = `
        <div id="appModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="closeModal()"></div>
            
            <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 p-6 border border-slate-100 dark:border-slate-800">
                <div class="mb-4">
                    <div id="modalIconContainer" class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                        <i data-feather="info" class="w-6 h-6"></i>
                    </div>
                    <h3 id="modalTitle" class="text-xl font-bold text-slate-800 dark:text-white mb-2">Title</h3>
                    <p id="modalMessage" class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Message goes here.</p>
                </div>
                
                <div class="flex space-x-3">
                    <button id="modalCancelBtn" onclick="closeModal()" class="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button id="modalConfirmBtn" onclick="executeModalAction()" class="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        Confirm
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        feather.replace();
    }
}

function showModal(title, message, action = null, isDestructive = false) {
    const modal = document.getElementById('appModal');
    const titleEl = document.getElementById('modalTitle');
    const msgEl = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const iconContainer = document.getElementById('modalIconContainer');

    titleEl.innerText = title;
    msgEl.innerText = message;
    pendingModalAction = action;

    if (isDestructive) {
        confirmBtn.className = "flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20";
        confirmBtn.innerText = "Delete";
        iconContainer.className = "w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400";
        iconContainer.innerHTML = `<i data-feather="trash-2" class="w-6 h-6"></i>`;
        cancelBtn.classList.remove('hidden');
    } else if (action === null) {
        confirmBtn.innerText = "Okay";
        confirmBtn.className = "flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors";
        iconContainer.className = "w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400";
        iconContainer.innerHTML = `<i data-feather="info" class="w-6 h-6"></i>`;
        cancelBtn.classList.add('hidden'); 
    } else {
        confirmBtn.innerText = "Confirm";
        confirmBtn.className = "flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20";
        iconContainer.className = "w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400";
        iconContainer.innerHTML = `<i data-feather="check-circle" class="w-6 h-6"></i>`;
        cancelBtn.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
    feather.replace();
}

function closeModal() {
    document.getElementById('appModal').classList.add('hidden');
    pendingModalAction = null;
}

function executeModalAction() {
    if (pendingModalAction) {
        pendingModalAction();
    }
    closeModal();
}

// --- Analytics View ---
function injectAnalyticsView() {
    if (!document.getElementById('eventAnalyticsView')) {
        const viewHtml = `
        <div id="eventAnalyticsView" class="hidden space-y-6 max-w-7xl mx-auto">
            <div class="flex items-center space-x-4 mb-6">
                <button onclick="closeEventCalculator()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <i data-feather="arrow-left" class="w-6 h-6 text-slate-600 dark:text-slate-300"></i>
                </button>
                <h2 id="analyticsTitle" class="text-2xl font-bold text-slate-800 dark:text-white">Event Analysis</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 class="font-bold text-slate-700 dark:text-slate-200 mb-4">Sales Performance</h3>
                    <div class="relative h-64"><canvas id="salesChart"></canvas></div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 class="font-bold text-slate-700 dark:text-slate-200 mb-4">Profit & Cost Breakdown</h3>
                    <div class="relative h-64"><canvas id="costChart"></canvas></div>
                </div>
            </div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div class="p-6 border-b border-slate-100 dark:border-slate-800">
                     <h3 class="font-bold text-lg text-slate-800 dark:text-white">Item Details</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Item Name</th>
                                <th class="p-4 text-center">Sold</th>
                                <th class="p-4 text-right">Price</th>
                                <th class="p-4 text-right">Revenue</th>
                                <th class="p-4 text-right rounded-tr-lg">Profit Contribution</th>
                            </tr>
                        </thead>
                        <tbody id="analyticsTableBody" class="text-sm"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
        const detailView = document.getElementById('eventDetailView');
        detailView.insertAdjacentHTML('afterend', viewHtml);
        feather.replace();
    }
}

function openEventAnalytics(eventId) {
    const data = loadedEventsCache[eventId];
    if (!data) return;

    document.getElementById('eventsListView').classList.add('hidden');
    document.getElementById('eventAnalyticsView').classList.remove('hidden');
    document.getElementById('analyticsTitle').innerText = `${data.name} (${data.date})`;

    const tbody = document.getElementById('analyticsTableBody');
    tbody.innerHTML = '';
    
    const sortedItems = [...data.items].sort((a, b) => (b.sold * b.price) - (a.sold * a.price));

    sortedItems.forEach(item => {
        const revenue = item.sold * item.price;
        const profit = revenue - (item.sold * item.cost);
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
        tr.innerHTML = `
            <td class="p-4 font-medium text-slate-700 dark:text-slate-200">${item.name}</td>
            <td class="p-4 text-center text-slate-600 dark:text-slate-400 font-mono">${item.sold}</td>
            <td class="p-4 text-right text-slate-600 dark:text-slate-400">₹${item.price}</td>
            <td class="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">₹${revenue.toLocaleString()}</td>
            <td class="p-4 text-right text-slate-500">₹${profit.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    renderEventCharts(data);
}

function renderEventCharts(data) {
    const labels = data.items.map(i => i.name);
    const revenueData = data.items.map(i => i.sold * i.price);
    const totalCOGS = data.totals.totalCOGS;
    const rent = data.expenses.rent;
    const transport = data.expenses.transport;
    const staff = data.expenses.staff;
    const netProfit = data.totals.netProfit;

    const ctxSales = document.getElementById('salesChart').getContext('2d');
    if (salesChartInstance) salesChartInstance.destroy();

    salesChartInstance = new Chart(ctxSales, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(context) { return ' ₹ ' + context.raw.toLocaleString(); } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: function(value) { return '₹' + value; } } },
                x: { grid: { display: false } }
            }
        }
    });

    const ctxCost = document.getElementById('costChart').getContext('2d');
    if (costChartInstance) costChartInstance.destroy();
    const profitValue = netProfit > 0 ? netProfit : 0; 
    
    costChartInstance = new Chart(ctxCost, {
        type: 'doughnut',
        data: {
            labels: ['COGS', 'Rent', 'Transport', 'Staff', 'Net Profit'],
            datasets: [{
                data: [totalCOGS, rent, transport, staff, profitValue],
                backgroundColor: ['#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) label += ': '; if (context.parsed !== null) label += '₹' + context.parsed.toLocaleString(); return label; } } }
            }
        }
    });
}

// --- Row Management (Visual Update) ---
function addEventRow() {
  const tbody = document.getElementById('eventTableBody');
  const rowId = Date.now(); 
  
  const tr = document.createElement('tr');
  tr.className = "group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0";
  tr.id = `row-${rowId}`;
  
  // UPDATED HTML: Increased padding-right (pr-6) on item-price to fix cropping
  tr.innerHTML = `
    <td class="p-4 align-top">
      <input type="text" placeholder="Item Name (e.g. Brownie)" class="item-name w-full bg-transparent font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 outline-none mb-1">
      <div class="flex items-center gap-1 text-xs text-slate-400">
         <span>Cost: ₹</span>
         <input type="number" placeholder="0" class="item-cost bg-transparent outline-none w-16 hover:text-blue-500 focus:text-blue-500 transition-colors" oninput="calculateEventTotals()">
      </div>
    </td>
    <td class="p-4 align-top">
      <input type="number" min="0" placeholder="0" class="item-open w-full text-center bg-slate-100 dark:bg-slate-900/50 border-none rounded-lg p-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 ring-blue-500 outline-none transition-shadow" oninput="updateRowCalc(${rowId})">
    </td>
    <td class="p-4 align-top">
      <input type="number" min="0" placeholder="0" class="item-close w-full text-center bg-slate-100 dark:bg-slate-900/50 border-none rounded-lg p-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 ring-blue-500 outline-none transition-shadow" oninput="updateRowCalc(${rowId})">
    </td>
    <td class="p-4 align-top text-center">
      <div class="py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold row-sold">0</div>
    </td>
    <td class="p-4 align-top">
      <div class="relative">
        <span class="absolute left-3 top-2 text-slate-400">₹</span>
        <input type="number" placeholder="0" class="item-price w-full pl-6 pr-6 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded-lg text-right font-medium text-slate-700 dark:text-slate-200 focus:ring-2 ring-emerald-500 outline-none" oninput="updateRowCalc(${rowId})">
      </div>
    </td>
    <td class="p-4 align-top text-right">
      <span class="font-bold text-emerald-600 dark:text-emerald-400 row-revenue text-lg">₹0</span>
    </td>
    <td class="p-4 align-middle text-center">
      <button onclick="removeEventRow(${rowId})" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><i data-feather="trash-2" class="w-4 h-4"></i></button>
    </td>
  `;
  
  tbody.appendChild(tr);
  feather.replace();
}

function removeEventRow(id) {
  const row = document.getElementById(`row-${id}`);
  if(row) row.remove();
  calculateEventTotals();
}

function updateRowCalc(rowId) {
  const row = document.getElementById(`row-${rowId}`);
  const open = parseFloat(row.querySelector('.item-open').value) || 0;
  const close = parseFloat(row.querySelector('.item-close').value) || 0;
  const price = parseFloat(row.querySelector('.item-price').value) || 0;
  
  let sold = open - close;
  if(sold < 0) sold = 0;
  
  const revenue = sold * price;
  row.querySelector('.row-sold').innerText = sold;
  row.querySelector('.row-revenue').innerText = '₹' + revenue.toLocaleString();
  calculateEventTotals();
}

function calculateEventTotals() {
  let totalRevenue = 0;
  let totalCOGS = 0;
  
  const rows = document.querySelectorAll('#eventTableBody tr');
  rows.forEach(row => {
    const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
    const open = parseFloat(row.querySelector('.item-open').value) || 0;
    const close = parseFloat(row.querySelector('.item-close').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    
    let sold = open - close;
    if(sold < 0) sold = 0;
    
    totalRevenue += (sold * price);
    totalCOGS += (sold * cost);
  });
  
  const rent = parseFloat(document.getElementById('eventRent').value) || 0;
  const transport = parseFloat(document.getElementById('eventTransport').value) || 0;
  const staff = parseFloat(document.getElementById('eventStaff').value) || 0;
  
  const totalExpenses = rent + transport + staff;
  const netProfit = totalRevenue - totalCOGS - totalExpenses;
  
  document.getElementById('eventTotalRevenue').innerText = '₹' + totalRevenue.toLocaleString();
  document.getElementById('eventCOGS').innerText = '- ₹' + totalCOGS.toLocaleString();
  document.getElementById('eventTotalExpenses').innerText = '- ₹' + totalExpenses.toLocaleString();
  
  // Updating the "Profit Widget" elements
  const profitEl = document.getElementById('eventNetProfit');
  profitEl.innerText = '₹' + netProfit.toLocaleString();
  
  // Dynamic color for the big Profit Number
  if(netProfit >= 0) {
    profitEl.classList.remove('text-red-400');
    profitEl.classList.add('text-white'); 
    document.getElementById('profitMarginLabel').innerText = "Calculated after expenses";
    document.getElementById('profitMarginLabel').className = "text-sm font-medium text-emerald-400 mb-8";
  } else {
    profitEl.classList.add('text-red-400');
    profitEl.classList.remove('text-white');
    document.getElementById('profitMarginLabel').innerText = "Loss detected";
    document.getElementById('profitMarginLabel').className = "text-sm font-medium text-red-400 mb-8";
  }

  return { totalRevenue, totalCOGS, totalExpenses, netProfit };
}

// --- FIREBASE INTEGRATION ---

// 1. Save or Update Event
function saveEvent() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showModal("Sign In Required", "Please sign in to save your event data.", null);
    return;
  }

  const name = document.getElementById('eventNameInput').value;
  const date = document.getElementById('eventDateInput').value;
  
  if(!name || !date) {
    showModal("Missing Information", "Please enter both an Event Name and Date.", null);
    return;
  }

  const items = [];
  document.querySelectorAll('#eventTableBody tr').forEach(row => {
    const itemName = row.querySelector('.item-name').value;
    if(itemName) {
      items.push({
        name: itemName,
        cost: parseFloat(row.querySelector('.item-cost').value) || 0,
        open: parseFloat(row.querySelector('.item-open').value) || 0,
        close: parseFloat(row.querySelector('.item-close').value) || 0,
        price: parseFloat(row.querySelector('.item-price').value) || 0,
        sold: parseFloat(row.querySelector('.row-sold').innerText) || 0,
      });
    }
  });

  const totals = calculateEventTotals();
  const expenses = {
      rent: parseFloat(document.getElementById('eventRent').value) || 0,
      transport: parseFloat(document.getElementById('eventTransport').value) || 0,
      staff: parseFloat(document.getElementById('eventStaff').value) || 0
  };

  const eventData = {
    userId: user.uid,
    name: name,
    date: date,
    items: items,
    expenses: expenses,
    totals: totals,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  if (!currentEditingEventId) {
      eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  const btn = document.querySelector('button[onclick="saveEvent()"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = currentEditingEventId ? "Updating..." : "Saving...";

  if (typeof db === 'undefined') {
      showModal("Connection Error", "Database not connected. Please refresh the page.", null);
      btn.innerHTML = originalText;
      return;
  }

  let promise;
  if (currentEditingEventId) {
      promise = db.collection('events').doc(currentEditingEventId).update(eventData);
  } else {
      promise = db.collection('events').add(eventData);
  }

  promise.then(() => {
       btn.innerHTML = `<i data-feather="check"></i> ${currentEditingEventId ? "Updated" : "Saved"}`;
       btn.classList.add('bg-green-600');
       
       if(typeof Notyf !== 'undefined') {
           new Notyf().success(currentEditingEventId ? 'Event Updated!' : 'Event Saved!');
       }

       setTimeout(() => {
         btn.innerHTML = `<i data-feather="save"></i> Save Event`;
         btn.classList.remove('bg-green-600');
         feather.replace();
         closeEventCalculator(); 
       }, 1000);
    })
    .catch((error) => {
      console.error("Error saving document: ", error);
      showModal("Save Failed", "Error saving event: " + error.message, null);
      btn.innerHTML = originalText;
    });
}

// 2. Load Events (Visual Update: Stat Cards)
function loadEvents() {
  const user = firebase.auth().currentUser;
  
  if (!user) {
      setTimeout(loadEvents, 500);
      return; 
  }

  const grid = document.getElementById('eventsGrid');
  // Loading Skeleton
  grid.innerHTML = `
      <div class="col-span-full py-12 flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-slate-400 text-sm">Loading events...</p>
      </div>`;

  db.collection('events')
    .where('userId', '==', user.uid)
    .limit(20)
    .get()
    .then((snapshot) => {
      grid.innerHTML = '';
      loadedEventsCache = {}; 
      
      if (snapshot.empty) {
         grid.innerHTML = `
          <div class="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
            <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <i data-feather="map-pin" class="w-10 h-10 text-slate-400"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">No events found</h3>
            <p class="text-slate-400 text-sm max-w-xs mx-auto mt-2">Start by recording your first market, pop-up, or catering event.</p>
          </div>`;
         feather.replace();
         return;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id;
        
        loadedEventsCache[docId] = data;

        // Logic for colors based on profit
        const isProfitable = data.totals.netProfit > 0;
        const profitColor = isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500';
        const profitIcon = isProfitable ? 'trending-up' : 'trending-down';
        const profitBg = isProfitable ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20';
        
        // Calculate Profit Margin % for the badge
        const margin = data.totals.totalRevenue > 0 
            ? Math.round((data.totals.netProfit / data.totals.totalRevenue) * 100) 
            : 0;

        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 group cursor-pointer relative overflow-hidden";
        
        card.innerHTML = `
          <div class="h-2 w-full ${isProfitable ? 'bg-emerald-500' : 'bg-red-500'}"></div>
          
          <div class="p-6">
            <div class="flex justify-between items-start mb-6">
               <div>
                 <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${data.date}</span>
                 <h3 class="font-bold text-xl text-slate-800 dark:text-white mt-1 group-hover:text-blue-600 transition-colors line-clamp-1">${data.name}</h3>
               </div>
               <div class="flex gap-2 relative z-20">
                 <button onclick="event.stopPropagation(); editEvent('${docId}')" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                   <i data-feather="edit-2" class="w-4 h-4"></i>
                 </button>
                 <button onclick="event.stopPropagation(); deleteEvent('${docId}')" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                   <i data-feather="trash" class="w-4 h-4"></i>
                 </button>
               </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
               <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p class="text-xs text-slate-500 mb-1">Revenue</p>
                  <p class="font-bold text-slate-800 dark:text-white">₹${data.totals.totalRevenue.toLocaleString()}</p>
               </div>
               <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p class="text-xs text-slate-500 mb-1">Expenses</p>
                  <p class="font-bold text-slate-800 dark:text-white">₹${data.totals.totalExpenses.toLocaleString()}</p>
               </div>
            </div>
            
            <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
               <div>
                  <div class="flex items-center gap-2">
                      <div class="p-1.5 rounded-full ${profitBg}">
                          <i data-feather="${profitIcon}" class="w-3 h-3 ${profitColor}"></i>
                      </div>
                      <span class="text-xs font-bold ${profitColor}">${margin}% Margin</span>
                  </div>
               </div>
               <div class="text-right">
                  <p class="text-xs text-slate-400 font-bold uppercase">Net Profit</p>
                  <p class="text-xl font-black ${profitColor}">₹${data.totals.netProfit.toLocaleString()}</p>
               </div>
            </div>

            <div onclick="openEventAnalytics('${docId}')" class="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-2.5 rounded-full font-bold shadow-lg transform scale-95 group-hover:scale-100 transition-transform flex items-center gap-2">
                    <i data-feather="bar-chart-2" class="w-4 h-4"></i> View Analytics
                </span>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      feather.replace();
    })
    .catch((error) => {
      console.error("Error loading events: ", error);
      grid.innerHTML = '<p class="text-red-500 text-center col-span-full">Error loading events. Check console.</p>';
    });
}

function deleteEvent(docId) {
    showModal(
        "Delete Event?", 
        "Are you sure you want to permanently delete this event? This action cannot be undone.", 
        () => {
            db.collection('events').doc(docId).delete()
            .then(() => {
                loadEvents();
                if(typeof Notyf !== 'undefined') {
                    new Notyf().success("Event deleted");
                }
            })
            .catch(err => showModal("Error", err.message, null));
        },
        true 
    );
}