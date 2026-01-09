// js/payments.js
/**
 * payments.js
 * Logic: Monthly Statement + Calibration + Smart Arrears Breakdown (FIFO)
 * Updated: FIFO Logic added to "Total Pending" column
 */

// Global state
let paymentsState = {
  clients: [],
  payments: [],
  dailyLogs: [], 
  ledger: [],
  // Default sort by Pending Amount (High to Low)
  sortConfig: { column: 'totalPending', direction: 'desc' }
};

// ==========================================
// 1. Initialization & Rendering
// ==========================================

window.renderPaymentsTable = async function() {
  // Cleanup existing modals
  const existingModal = document.getElementById('paymentModal');
  if (existingModal) existingModal.remove();

  const container = document.getElementById('payments');
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  container.innerHTML = `
    <style>
      .dark #ledgerMonthFilter::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .dark #ledgerMonthFilter::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
      }
      /* Hide number input spinners */
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
    </style>

    <div id="payment-loading" class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md hidden transition-opacity duration-300">
      <div class="relative mb-4">
         <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
         <div class="relative bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl shadow-blue-500/20 border border-slate-100 dark:border-slate-700">
            <i data-feather="loader" class="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin"></i>
         </div>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 font-semibold animate-pulse tracking-wide">Syncing Ledger...</p>
    </div>

    <div class="max-w-7xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-8 animate-fade-in">
      
      <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <i data-feather="book" class="w-6 h-6 text-blue-600 dark:text-blue-500"></i> Financial Ledger
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Monthly Statement & Carry-over Tracking.</p>
        </div>
        
        <div class="flex items-center gap-3">
          
          <div class="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm p-1 transition hover:border-blue-400 dark:hover:border-blue-500">
            <button onclick="changeMonth(-1)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition active:scale-95" title="Previous Month">
              <i data-feather="chevron-left" class="w-4 h-4"></i>
            </button>
            
            <input type="month" id="ledgerMonthFilter" value="${currentMonth}" 
                   class="border-none bg-transparent py-1 px-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-0 cursor-pointer outline-none w-40 text-center uppercase tracking-wide"
                   onchange="refreshLedgerData()">

            <button onclick="changeMonth(1)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition active:scale-95" title="Next Month">
              <i data-feather="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
          <button onclick="openPaymentModal()" class="group bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-slate-200 dark:shadow-none flex items-center gap-2 transition-all text-sm font-medium hover:-translate-y-0.5 active:translate-y-0">
            <i data-feather="plus-circle" class="w-4 h-4 text-slate-300 group-hover:text-white transition"></i>
            Record Payment
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <i data-feather="file-text" class="w-3 h-3"></i> Total Billed (Month)
          </p>
          <div class="mt-2 flex items-baseline gap-2">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white" id="statMonthlyBilled">₹0.00</h2>
            <span class="text-xs text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">Daily Logs</span>
          </div>
        </div>
        
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <i data-feather="check-circle" class="w-3 h-3"></i> Collected (Month)
          </p>
          <div class="mt-2 flex items-baseline gap-2">
            <h2 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400" id="statMonthlyCollected">₹0.00</h2>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Received</span>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <i data-feather="alert-circle" class="w-3 h-3"></i> Total Pending (All Time)
          </p>
          <div class="mt-2 flex items-baseline gap-2">
            <h2 class="text-2xl font-bold text-rose-600 dark:text-rose-400" id="statTotalOutstanding">₹0.00</h2>
            <span class="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">To Collect</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm min-h-[500px] flex flex-col">
        
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
          <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl gap-1">
            <button id="tabBalances" onclick="switchPaymentTab('balances')" class="px-5 py-2 text-sm font-bold rounded-lg shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white transition-all border border-slate-100 dark:border-slate-600 ring-1 ring-black/5">
              Monthly Statement
            </button>
            <button id="tabHistory" onclick="switchPaymentTab('history')" class="px-5 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all">
              Payment Log
            </button>
          </div>

          <div class="text-xs text-slate-400 dark:text-slate-500 italic hidden sm:flex items-center gap-1">
            <i data-feather="info" class="w-3 h-3"></i> Click "Previous Due" amounts for history breakdown
          </div>
        </div>

        <div id="paymentTabContent" class="flex-1 overflow-x-auto p-0 transition-all duration-300 ease-in-out">
        </div>
      </div>
    </div>

    ${getModalsHTML()}
  `;

  if(window.feather) feather.replace();
  await refreshLedgerData(true);
};

// ==========================================
// 2. MODAL HTML (UX FIX: HIDDEN INPUTS)
// ==========================================

function getModalsHTML() {
  return `
    <div id="paymentModal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900/70 backdrop-blur-sm transition-opacity duration-200">
      
      <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-95 opacity-0 border border-slate-200 dark:border-slate-800" id="paymentModalContent">
        
        <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Receiving Payment</p>
            
            <h2 id="modalClientNameDisplay" class="text-xl font-bold text-slate-800 dark:text-white hidden truncate max-w-[250px]">Client Name</h2>
            
            <div id="modalClientSelectWrapper">
                <select id="payClientSelect" class="bg-transparent text-lg font-bold text-slate-800 dark:text-white border-none focus:ring-0 p-0 cursor-pointer w-full">
                    <option value="">Select Client...</option>
                </select>
            </div>
          </div>
          <button onclick="closePaymentModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm hover:shadow-md">
            <i data-feather="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="paymentForm" onsubmit="handlePaymentSubmit(event)" class="p-6">
          <input type="hidden" id="payClientIdLocked" value="">
          <input type="hidden" id="payClientNameLocked" value="">

          <div class="mb-6 text-center relative">
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Amount Received</label>
            <div class="relative inline-block w-full">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-light">₹</span>
                <input type="number" id="payAmount" required min="1" step="0.01" 
                       class="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-0 text-center transition-colors placeholder-slate-200 dark:placeholder-slate-700 shadow-inner" 
                       placeholder="0">
            </div>
            <div id="paymentSuggestions" class="mt-3 flex flex-wrap justify-center gap-2 min-h-[24px]"></div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-5">
             <div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Date</label>
                <input type="date" id="payDate" required class="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white">
             </div>
             <div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Method</label>
                <div class="relative">
                    <select id="payMethod" class="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white appearance-none">
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / GPay</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <i data-feather="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
             </div>
          </div>

          <div class="mb-6">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Notes (Optional)</label>
            <textarea id="payNotes" rows="2" class="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-600 dark:text-white resize-none" placeholder="Reference ID, Remarks..."></textarea>
          </div>

          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-base font-bold shadow-lg shadow-blue-500/30 transition transform active:scale-95 flex items-center justify-center gap-2">
            <span>Confirm Payment</span>
            <i data-feather="arrow-right" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    </div>
    
    <div id="updateBilledModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-white/20 dark:border-slate-700">
        <div class="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <i data-feather="tool" class="w-5 h-5"></i>
            <h3 class="text-sm font-bold uppercase tracking-wide">Calibrate Ledger</h3>
        </div>
        
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed px-1">
          The system calculated <strong>₹<span id="modalCurrentCalc" class="text-slate-800 dark:text-white">0</span></strong> based on log history.
          Enter the <span class="text-indigo-600 dark:text-indigo-400 font-bold">True Amount</span> below if this is incorrect (e.g. older debts cleared).
        </p>
        
        <input type="hidden" id="editBilledClientId">
        <input type="hidden" id="editSystemHistory">
        
        <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">True Previous Due</label>
        <div class="relative mb-6">
            <span class="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
            <input type="number" id="editBilledAmount" class="w-full text-3xl font-bold text-slate-800 dark:text-white border-b-2 border-slate-200 dark:border-slate-600 pl-6 py-2 focus:border-indigo-500 focus:outline-none transition bg-transparent placeholder-slate-200 dark:placeholder-slate-700" placeholder="0.00">
        </div>
        
        <div class="flex gap-3">
          <button onclick="document.getElementById('updateBilledModal').classList.add('hidden');document.getElementById('updateBilledModal').classList.remove('flex')" class="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Cancel</button>
          <button onclick="saveManualBilled()" class="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition">Update</button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 3. Data Logic
// ==========================================

function showLoading(show = true) {
    const loader = document.getElementById("payment-loading");
    if (show) loader.classList.remove("hidden");
    else loader.classList.add("hidden");
}

async function refreshLedgerData(isInitialLoad = false) {
  try {
    if (isInitialLoad) showLoading(true);
    
    // Smooth Transition Effect
    const tableContainer = document.getElementById('paymentTabContent');
    if (tableContainer && !isInitialLoad) {
        tableContainer.classList.add('opacity-50', 'blur-sm', 'pointer-events-none');
    }

    const monthInput = document.getElementById('ledgerMonthFilter').value; 
    if(!monthInput) { showLoading(false); return; }

    const [yr, mo] = monthInput.split('-');
    const currentYear = parseInt(yr);
    const currentMonthIndex = parseInt(mo) - 1; 
    
    const startOfMonth = `${monthInput}-01`;
    const lastDay = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const endOfMonth = `${monthInput}-${String(lastDay).padStart(2, '0')}`;

    let pastYear = currentYear;
    let pastMonth = currentMonthIndex; 
    if(pastMonth === 0) { 
        pastMonth = 12; 
        pastYear -= 1;
    }
    const startOfPastMonth = `${pastYear}-${String(pastMonth).padStart(2, '0')}-01`;

    const [clientsSnap, paymentsSnap, logsSnap] = await Promise.all([
      db.collection('clients').get(),
      db.collection('payments').orderBy('date', 'desc').get(),
      db.collection('dailyLogs').get() 
    ]);

    paymentsState.clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    paymentsState.payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    paymentsState.dailyLogs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process Ledger
    let ledgerMap = {};

    paymentsState.clients.forEach(c => {
      ledgerMap[c.id] = { 
        id: c.id, 
        name: c.name || 'Unknown', 
        manualBilled: parseFloat(c.openingBalance) || 0,
        olderHistoryBalance: parseFloat(c.openingBalance) || 0, 
        lastMonthBilled: 0, 
        lastMonthPaid: 0,
        previousDue: parseFloat(c.openingBalance) || 0, 
        monthBilled: 0, 
        monthPaid: 0,
        totalPending: 0,
        pureHistory: 0, 
        isActive: false
      };
    });

    paymentsState.dailyLogs.forEach(log => {
      const rawName = (log.client || "Unknown Client").trim();
      if(!rawName) return;

      let clientObj = paymentsState.clients.find(c => 
        (c.name || "").trim().toLowerCase() === rawName.toLowerCase()
      );

      let cId;

      if (clientObj) {
        cId = clientObj.id;
      } else {
        // Handle Walk-ins/Temps
        cId = 'temp_' + rawName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        if (!ledgerMap[cId]) {
          ledgerMap[cId] = { 
            id: cId, 
            name: rawName + ' *', 
            manualBilled: 0,
            olderHistoryBalance: 0, 
            lastMonthBilled: 0, 
            lastMonthPaid: 0,
            previousDue: 0, 
            monthBilled: 0, 
            monthPaid: 0,
            totalPending: 0,
            pureHistory: 0, 
            isActive: false,
            isTemporary: true 
          };
        }
      }

      const amount = parseFloat(log.totalRevenue || 0);

      if (log.date < startOfPastMonth) {
         ledgerMap[cId].olderHistoryBalance += amount;
         ledgerMap[cId].previousDue += amount;
         ledgerMap[cId].pureHistory += amount;
      } 
      else if (log.date >= startOfPastMonth && log.date < startOfMonth) {
         ledgerMap[cId].lastMonthBilled += amount;
         ledgerMap[cId].previousDue += amount;
         ledgerMap[cId].pureHistory += amount;
      } 
      else if (log.date >= startOfMonth && log.date <= endOfMonth) {
         ledgerMap[cId].monthBilled += amount;
         ledgerMap[cId].isActive = true;
      }
    });

    paymentsState.payments.forEach(pay => {
      const cId = pay.clientId;
      const amount = parseFloat(pay.amount || 0);

      if (ledgerMap[cId]) {
        if (pay.date < startOfPastMonth) {
           ledgerMap[cId].olderHistoryBalance -= amount;
           ledgerMap[cId].previousDue -= amount;
           ledgerMap[cId].pureHistory -= amount;
        } 
        else if (pay.date >= startOfPastMonth && pay.date < startOfMonth) {
           ledgerMap[cId].lastMonthPaid += amount;
           ledgerMap[cId].previousDue -= amount;
           ledgerMap[cId].pureHistory -= amount;
        } 
        else if (pay.date >= startOfMonth && pay.date <= endOfMonth) {
           ledgerMap[cId].monthPaid += amount;
           ledgerMap[cId].isActive = true;
        }
      }
    });

    Object.values(ledgerMap).forEach(item => {
      item.totalPending = (item.previousDue + item.monthBilled) - item.monthPaid;
      if (Math.abs(item.previousDue) > 1 || Math.abs(item.totalPending) > 1 || item.monthBilled > 0 || item.monthPaid > 0) {
        item.isActive = true;
      }
    });

    paymentsState.ledger = Object.values(ledgerMap).filter(item => item.isActive);

    updatePaymentStats(Object.values(ledgerMap));
    
    const historyBtn = document.getElementById('tabHistory');
    if(historyBtn.classList.contains('shadow-sm')) {
       renderPaymentHistoryTable();
    } else {
       renderBalancesTable();
    }
    
    updatePaymentModalDropdown();
    if(window.feather) feather.replace();

    if (tableContainer && !isInitialLoad) {
        setTimeout(() => {
            tableContainer.classList.remove('opacity-50', 'blur-sm', 'pointer-events-none');
        }, 150); 
    }

  } catch (error) {
    console.error("Error loading ledger:", error);
  } finally {
    showLoading(false);
  }
}

function updatePaymentStats(fullLedgerList) {
  let monthBilled = 0;
  let monthPaid = 0;
  let totalOutstanding = 0;

  fullLedgerList.forEach(item => {
    monthBilled += item.monthBilled;
    monthPaid += item.monthPaid;
    totalOutstanding += item.totalPending;
  });

  document.getElementById('statMonthlyBilled').innerText = `₹${monthBilled.toLocaleString('en-IN')}`;
  document.getElementById('statMonthlyCollected').innerText = `₹${monthPaid.toLocaleString('en-IN')}`;
  document.getElementById('statTotalOutstanding').innerText = `₹${totalOutstanding.toLocaleString('en-IN')}`;
}

function getFormattedMonthLabel() {
  const val = document.getElementById('ledgerMonthFilter').value;
  if(!val) return "Current Month";
  const [y, m] = val.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleString('default', { month: 'short' }) + '-' + y;
}

window.changeMonth = function(offset) {
  const input = document.getElementById('ledgerMonthFilter');
  if (!input.value) return;

  const [year, month] = input.value.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');

  input.value = `${newYear}-${newMonth}`;
  refreshLedgerData();
};

window.switchPaymentTab = function(tabName) {
  const btnBalances = document.getElementById('tabBalances');
  const btnHistory = document.getElementById('tabHistory');
  
  const activeClass = "px-5 py-2 text-sm font-bold rounded-lg shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white transition-all border border-slate-100 dark:border-slate-600 ring-1 ring-black/5";
  const inactiveClass = "px-5 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all";

  if (tabName === 'balances') {
    btnBalances.className = activeClass;
    btnHistory.className = inactiveClass;
    renderBalancesTable();
  } else {
    btnHistory.className = activeClass;
    btnBalances.className = inactiveClass;
    renderPaymentHistoryTable();
  }
};

window.toggleSort = function(column) {
  const current = paymentsState.sortConfig;
  if (current.column === column) {
    current.direction = current.direction === 'desc' ? 'asc' : 'desc';
  } else {
    current.column = column;
    current.direction = 'desc';
  }
  renderBalancesTable();
};

// ==========================================
// 4. RENDER TABLE (UPDATED: FIFO LOGIC)
// ==========================================

function renderBalancesTable() {
  const content = document.getElementById('paymentTabContent');
  const monthLabel = getFormattedMonthLabel(); 
  
  const monthInput = document.getElementById('ledgerMonthFilter').value;
  const [yr, mo] = monthInput.split('-');
  const prevDate = new Date(parseInt(yr), parseInt(mo) - 2); 
  const prevMonthLabel = prevDate.toLocaleString('default', { month: 'short' }); 
  
  const { column, direction } = paymentsState.sortConfig;
  
  const sortedLedger = [...paymentsState.ledger].sort((a, b) => {
    let valA = a[column];
    let valB = b[column];
    if (column === 'name') {
       return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return direction === 'asc' ? valA - valB : valB - valA;
  });

  const getSortIcon = (colName) => {
    if (column !== colName) return `<i data-feather="minus" class="w-3 h-3 opacity-20 ml-1 inline-block"></i>`;
    return direction === 'asc' 
      ? `<i data-feather="arrow-up" class="w-3 h-3 text-blue-500 ml-1 inline-block"></i>`
      : `<i data-feather="arrow-down" class="w-3 h-3 text-blue-500 ml-1 inline-block"></i>`;
  };

  let html = `
    <table class="w-full text-left border-collapse min-w-[900px]">
      <thead>
        <tr class="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
          <th class="py-4 px-6 font-semibold w-1/4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition select-none" onclick="toggleSort('name')">
            Client ${getSortIcon('name')}
          </th>
          <th class="py-4 px-6 font-semibold text-right text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition select-none" onclick="toggleSort('previousDue')">
            Previous Due ${getSortIcon('previousDue')}
          </th>
          <th class="py-4 px-6 font-semibold text-right text-indigo-900 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/20 cursor-pointer hover:text-indigo-700 transition select-none" onclick="toggleSort('monthBilled')">
            + Billed (${monthLabel}) ${getSortIcon('monthBilled')}
          </th>
          <th class="py-4 px-6 font-semibold text-right text-emerald-900 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/20 cursor-pointer hover:text-emerald-700 transition select-none" onclick="toggleSort('monthPaid')">
            - Paid (${monthLabel}) ${getSortIcon('monthPaid')}
          </th>
          <th class="py-4 px-6 font-semibold text-right w-1/6 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition select-none" onclick="toggleSort('totalPending')">
            Total Pending ${getSortIcon('totalPending')}
          </th>
          <th class="py-4 px-6 font-semibold text-right">Action</th>
        </tr>
      </thead>
      <tbody class="text-slate-600 dark:text-slate-300 text-sm">
  `;

  if (sortedLedger.length === 0) {
    html += `<tr><td colspan="6" class="text-center py-10 text-slate-400">All balanced! No outstanding dues.</td></tr>`;
  } else {
    sortedLedger.forEach((c, index) => {
      // 1. DETERMINE IF SETTLED
      // We check if the absolute value is less than 1 (handles floating point 0.00 issues)
      const isSettled = Math.abs(c.totalPending) < 1;

      const prevDue = c.previousDue.toLocaleString('en-IN');
      const billed = c.monthBilled.toLocaleString('en-IN');
      const paid = c.monthPaid.toLocaleString('en-IN');
      const pending = c.totalPending.toLocaleString('en-IN');
      
      // 2. COLOR LOGIC
      let pendingClass = 'text-slate-600 dark:text-slate-300 font-bold';
      let rowOpacityClass = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'; // Default Hover

      if (isSettled) {
          // If Settled: Green Zero, Dimmed Row
          pendingClass = 'text-emerald-500 dark:text-emerald-400 font-bold';
          rowOpacityClass = 'opacity-60 grayscale-[0.5] hover:opacity-100 transition-opacity'; 
      } else if (c.totalPending > 1) {
          pendingClass = 'text-rose-600 dark:text-rose-400 font-bold'; 
      } else if (c.totalPending < -1) {
          pendingClass = 'text-indigo-600 dark:text-indigo-400 font-bold';
      }

      let pendingDisplay = `₹${pending}`;
      
      // --- SMART ARREARS LOGIC (FIFO) ---
      // We calculate if this month's payments covered the old arrears.
      // If remainingArrears <= 0, it means the old debt is cleared, so we don't show the tag.
      const remainingArrears = c.previousDue - c.monthPaid;

      if (c.previousDue > 0 && remainingArrears > 0 && c.totalPending > 0) {
        const arrearsDisp = remainingArrears.toLocaleString('en-IN');
        pendingDisplay += `<div class="text-[10px] font-medium text-amber-600 dark:text-amber-500 mt-0.5">Inc. ₹${arrearsDisp} Arrears</div>`;
      }
      // ----------------------------------

      const lastMonthBilledDisp = c.lastMonthBilled.toLocaleString('en-IN');
      const lastMonthPaidDisp = c.lastMonthPaid.toLocaleString('en-IN');
      const olderArrearsDisp = c.olderHistoryBalance.toLocaleString('en-IN');
      const olderRow = Math.abs(c.olderHistoryBalance) > 1 
        ? `<div class="flex justify-between mb-1 pt-1 border-t border-slate-600/50 text-slate-400">
             <span class="italic text-[10px]">Older Arrears:</span>
             <span class="font-mono text-[10px]">₹${olderArrearsDisp}</span>
           </div>` : '';

      const isFirstRow = index === 0;
      const tooltipPosClass = isFirstRow ? 'top-full mt-2' : 'bottom-full mb-2';
      const tooltipOriginClass = isFirstRow ? '-translate-y-2' : 'translate-y-2';

      // 3. ACTION COLUMN LOGIC (Button vs Badge)
      let actionHtml;
      if (isSettled) {
        actionHtml = `
            <div class="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-400 opacity-80 px-4 py-2">
                <i data-feather="check-circle" class="w-4 h-4"></i>
                <span class="text-xs font-bold uppercase tracking-wide">Settled</span>
            </div>
        `;
      } else {
        actionHtml = `
            <button onclick="openPaymentModal('${c.id}', ${c.previousDue}, ${c.totalPending}, event)" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-800 dark:hover:text-indigo-200 px-4 py-2 rounded-lg text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 shadow-sm">
              Pay
            </button>
        `;
      }
      
      html += `
        <tr class="border-b border-slate-50 dark:border-slate-800 transition group ${rowOpacityClass}">
          <td class="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">${c.name}</td>
          <td class="py-4 px-6 text-right relative group/tooltip">
             <div class="cursor-pointer border-b border-dashed border-slate-300 dark:border-slate-600 inline-block transition ${c.previousDue > 0 ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-400'}"
                  onclick="openCalibrationModal('${c.id}', ${c.previousDue}, ${c.pureHistory})">
               ₹${prevDue}
               ${c.previousDue > 0 ? '<span class="text-[10px] align-top ml-0.5">ℹ</span>' : ''}
             </div>
             <div class="absolute ${tooltipPosClass} left-1/2 -translate-x-1/2 w-48 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 ${tooltipOriginClass} group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 transition pointer-events-none z-[60] ring-1 ring-white/10">
                <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">Activity: ${prevMonthLabel}</div>
                <div class="flex justify-between mb-1"><span class="text-slate-300">Billed:</span><span class="font-mono">₹${lastMonthBilledDisp}</span></div>
                <div class="flex justify-between mb-2"><span class="text-slate-300">Paid:</span><span class="font-mono">₹${lastMonthPaidDisp}</span></div>
                ${olderRow}
             </div>
          </td>
          <td class="py-4 px-6 text-right bg-indigo-50/10 dark:bg-indigo-900/10 font-medium text-indigo-700 dark:text-indigo-400">₹${billed}</td>
          <td class="py-4 px-6 text-right bg-emerald-50/10 dark:bg-emerald-900/10 font-medium text-emerald-700 dark:text-emerald-400">₹${paid}</td>
          <td class="py-4 px-6 text-right text-lg ${pendingClass}">${pendingDisplay}</td>
          <td class="py-4 px-6 text-right">
            ${actionHtml}
          </td>
        </tr>
      `;
    });
  }
  html += `</tbody></table>`;
  content.innerHTML = html;
  if(window.feather) feather.replace();
}

function renderPaymentHistoryTable() {
  const content = document.getElementById('paymentTabContent');
  const monthInput = document.getElementById('ledgerMonthFilter').value;
  const monthLabel = getFormattedMonthLabel();
  
  const [yr, mo] = monthInput.split('-');
  const startOfMonth = `${monthInput}-01`;
  
  // Calculate end of month correctly
  const endOfMonth = new Date(parseInt(yr), parseInt(mo), 0).toISOString().split('T')[0];
  
  const filteredPayments = paymentsState.payments.filter(pay => {
    return pay.date >= startOfMonth && pay.date <= endOfMonth;
  });

  let html = `
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
          <th class="py-3 px-6 font-semibold">Date</th>
          <th class="py-3 px-6 font-semibold">Client & Remarks</th> <th class="py-3 px-6 font-semibold">Method</th>
          <th class="py-3 px-6 font-semibold text-right">Amount</th>
          <th class="py-3 px-6 font-semibold text-right">Action</th>
        </tr>
      </thead>
      <tbody class="text-slate-600 dark:text-slate-300 text-sm">
  `;

  if (filteredPayments.length === 0) {
    html += `<tr><td colspan="5" class="text-center py-10 text-slate-400">No payments recorded in ${monthLabel}.</td></tr>`;
  } else {
    filteredPayments.forEach(pay => {
      
      // 1. DATE FORMATTING LOGIC (YYYY-MM-DD -> 6-Jan-2026)
      const [pYear, pMonth, pDay] = pay.date.split('-');
      const dateObj = new Date(pYear, pMonth - 1, pDay);
      const monthName = dateObj.toLocaleString('default', { month: 'short' });
      const displayDate = `${parseInt(pDay)}-${monthName}-${pYear}`;

      // 2. NOTES LOGIC
      // We check if notes exist and create a small info block below the name
      const notesHtml = pay.notes 
        ? `<div class="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-start gap-1 max-w-[250px] leading-tight">
             <i data-feather="message-square" class="w-3 h-3 mt-0.5 flex-shrink-0"></i> 
             <span class="italic">"${pay.notes}"</span>
           </div>` 
        : '';

      html += `
        <tr class="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
          <td class="py-3 px-6 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            ${displayDate}
          </td>
          
          <td class="py-3 px-6">
            <div class="font-bold text-slate-800 dark:text-slate-200">${pay.clientName}</div>
            ${notesHtml}
          </td>

          <td class="py-3 px-6 align-top pt-4">
            <span class="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-300 shadow-sm whitespace-nowrap">
              ${pay.method}
            </span>
          </td>

          <td class="py-3 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-900/10 align-top pt-4">
            +₹${(parseFloat(pay.amount)||0).toLocaleString('en-IN')}
          </td>

          <td class="py-3 px-6 text-right align-top pt-3">
             <button onclick="deletePayment('${pay.id}')" class="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full" title="Delete Entry">
               <i data-feather="trash-2" class="w-4 h-4"></i>
             </button>
          </td>
        </tr>
      `;
    });
  }
  html += `</tbody></table>`;
  content.innerHTML = html;
  
  // Re-initialize icons for the new "message-square" icon in remarks
  if(window.feather) feather.replace();
}

function updatePaymentModalDropdown() {
  const select = document.getElementById('payClientSelect');
  if(!select) return;
  
  let html = `<option value="">Select client...</option>`;
  const sortedClients = [...paymentsState.clients].sort((a,b) => (a.name||'').localeCompare(b.name||''));
  sortedClients.forEach(c => { html += `<option value="${c.id}">${c.name}</option>`; });
  select.innerHTML = html;
}

window.deletePayment = async function(paymentId) {
  if (!confirm("Remove this payment entry? The client's balance will increase.")) return;
  try {
    showLoading(true);
    await db.collection('payments').doc(paymentId).delete();
    new Notyf().success("Entry deleted.");
    refreshLedgerData();
  } catch (error) {
    console.error(error);
    showLoading(false);
    new Notyf().error("Delete failed.");
  }
};

window.openCalibrationModal = function(clientId, currentVal, pureHistory) {
  document.getElementById('editBilledClientId').value = clientId;
  document.getElementById('editSystemHistory').value = pureHistory; 
  document.getElementById('modalCurrentCalc').innerText = currentVal.toLocaleString('en-IN');
  document.getElementById('editBilledAmount').value = currentVal;
  
  const modal = document.getElementById('updateBilledModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if(window.feather) feather.replace();
};

window.saveManualBilled = async function() {
  const clientId = document.getElementById('editBilledClientId').value;
  const targetValue = parseFloat(document.getElementById('editBilledAmount').value) || 0;
  const pureHistory = parseFloat(document.getElementById('editSystemHistory').value) || 0;
  
  const offsetToSave = targetValue - pureHistory;

  try {
    const btn = document.querySelector('#updateBilledModal button:last-child');
    const ogText = btn.innerText;
    btn.innerText = "Calibrating...";
    
    await db.collection('clients').doc(clientId).update({ openingBalance: offsetToSave });
    
    new Notyf().success("Ledger calibrated successfully.");
    document.getElementById('updateBilledModal').classList.add('hidden');
    document.getElementById('updateBilledModal').classList.remove('flex');
    btn.innerText = ogText;
    refreshLedgerData();
  } catch (err) {
    console.error(err);
    new Notyf().error("Update failed.");
  }
};

// ==========================================
// 5. MODAL LOGIC (FIXED)
// ==========================================

window.openPaymentModal = function(preselectId = '', prevDue = 0, totalDue = 0, event = null) {
  const modal = document.getElementById('paymentModal');
  const modalContent = document.getElementById('paymentModalContent');
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  // Reset Form
  document.getElementById('payDate').valueAsDate = new Date();
  document.getElementById('payAmount').value = '';
  document.getElementById('payNotes').value = '';
  document.getElementById('payMethod').value = 'Cash';
  document.getElementById('payClientSelect').value = ""; // Reset dropdown
  
  // FIX: Clear Hidden Inputs
  document.getElementById('payClientIdLocked').value = "";
  document.getElementById('payClientNameLocked').value = "";

  updatePaymentModalDropdown(); 
  
  const selectWrapper = document.getElementById('modalClientSelectWrapper');
  const displayTitle = document.getElementById('modalClientNameDisplay');

  if (preselectId) {
    // === MODE A: SPECIFIC CLIENT (LOCKED) ===
    // 1. Find Client Name safely
    const ledgerClient = paymentsState.ledger.find(c => c.id === preselectId);
    let clientName = ledgerClient ? ledgerClient.name : "Unknown Client";

    // 2. Set HIDDEN ID (Bypass Dropdown)
    document.getElementById('payClientIdLocked').value = preselectId;
    document.getElementById('payClientNameLocked').value = clientName;

    // 3. UI: Hide Dropdown, Show Name Header
    displayTitle.innerText = clientName;
    displayTitle.classList.remove('hidden');
    selectWrapper.classList.add('hidden');

  } else {
    // === MODE B: GENERIC (Use Dropdown) ===
    displayTitle.classList.add('hidden');
    selectWrapper.classList.remove('hidden');
  }

  // Quick Fill Chips
  const suggestionsDiv = document.getElementById('paymentSuggestions');
  suggestionsDiv.innerHTML = '';
  
  if (preselectId && (prevDue > 0 || totalDue > 0)) {
      if (prevDue > 0) {
        suggestionsDiv.innerHTML += `
          <button type="button" onclick="document.getElementById('payAmount').value = '${prevDue.toFixed(2)}'" 
             class="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition flex items-center gap-1">
             Arrears: ₹${prevDue.toLocaleString('en-IN')}
          </button>`;
      }
      if (totalDue > 0) {
        suggestionsDiv.innerHTML += `
          <button type="button" onclick="document.getElementById('payAmount').value = '${totalDue.toFixed(2)}'" 
             class="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center gap-1">
             Full Due: ₹${totalDue.toLocaleString('en-IN')}
          </button>`;
      }
  }

  // Show Modal (Flex Centered)
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  if(window.feather) feather.replace();

  setTimeout(() => {
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
    document.getElementById('payAmount').focus();
  }, 10);
};

window.closePaymentModal = function() {
  const modal = document.getElementById('paymentModal');
  const content = document.getElementById('paymentModalContent');
  content.classList.remove('scale-100', 'opacity-100');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }, 200);
};

window.handlePaymentSubmit = async function(e) {
  e.preventDefault();
  
  // FIX: Check Hidden Input FIRST (Locked Mode), then fallback to Dropdown (Generic Mode)
  const lockedId = document.getElementById('payClientIdLocked').value;
  const lockedName = document.getElementById('payClientNameLocked').value;
  const select = document.getElementById('payClientSelect');
  
  let clientId, clientName;

  if (lockedId) {
      clientId = lockedId;
      clientName = lockedName;
  } else {
      clientId = select.value;
      clientName = select.options[select.selectedIndex]?.text || "Unknown";
  }

  const amount = parseFloat(document.getElementById('payAmount').value);
  
  if (!clientId || isNaN(amount)) {
      new Notyf().error("Please select a client and enter amount.");
      return;
  }

  try {
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Saving...`;
    btn.disabled = true;
    
    await db.collection('payments').add({
      clientId, clientName, amount,
      date: document.getElementById('payDate').value,
      method: document.getElementById('payMethod').value,
      notes: document.getElementById('payNotes').value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    new Notyf().success("Payment Recorded!");
    closePaymentModal();
    btn.innerHTML = originalText;
    btn.disabled = false;
    refreshLedgerData();
  } catch (err) {
    new Notyf().error("Error saving.");
    console.error(err);
  }
};