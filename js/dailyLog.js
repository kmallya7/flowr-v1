// js/dailyLog.js

/**
 * Modern Daily Logs Manager
 * Features:
 * 1. Skeleton Loading (Shimmers) for Table Transitions
 * 2. Toast Notification for Save Success
 * 3. Popover for Deletion
 * 4. Button-Level Loading State
 * 5. Smart Invoice Handoff (Create RJ-12)
 * 6. Visual Pending/Invoiced Status Indicators
 * 7. Hybrid Navigation (Month Arrows + Full Date Picker)
 */

// --- Global Font Injection ---
if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Helper: Format date ---
  function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${parseInt(day, 10)}-${months[parseInt(month, 10) - 1]}-${year}`;
  }

  // --- 1. Render UI ---
  const dailyLogSection = document.getElementById("dailyLog");
  if (!dailyLogSection) return;
  
  dailyLogSection.innerHTML = `
    <style>
      .font-inter { font-family: 'Inter', sans-serif; }
      
      /* Input Styling */
      .input-slate {
        background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem;
        color: #1e293b; font-weight: 500; transition: all 0.2s; width: 100%; outline: none;
      }
      .dark .input-slate { background-color: #0f172a; border-color: #334155; color: #f8fafc; }
      .input-slate:focus { background-color: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
      .dark .input-slate:focus { background-color: #1e293b; border-color: #3b82f6; }

      /* Popover Animation */
      .popover-enter { animation: popoverSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes popoverSlideIn {
        from { opacity: 0; transform: translateY(8px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .popover-arrow {
        position: absolute; width: 12px; height: 12px;
        background: inherit; bottom: -6px; right: 14px;
        transform: rotate(45deg);
        border-bottom: 1px solid inherit; border-right: 1px solid inherit; z-index: 0;
      }

      /* TOAST Animation */
      .toast-enter { animation: toastSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .toast-exit { animation: toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      @keyframes toastSlideUp {
        from { opacity: 0; transform: translateY(100%); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes toastSlideDown {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(100%); }
      }

      /* Button Spinner */
      .btn-spinner {
        border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 2px solid white;
        width: 16px; height: 16px; animation: spin 0.8s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      /* SKELETON SHIMMER EFFECT */
      .skeleton-box {
        position: relative; overflow: hidden;
        background-color: #e2e8f0; /* slate-200 */
        border-radius: 0.5rem;
      }
      .dark .skeleton-box { background-color: #334155; /* slate-700 */ }
      
      .skeleton-box::after {
        position: absolute; top: 0; right: 0; bottom: 0; left: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.4) 20%,
          rgba(255, 255, 255, 0.7) 60%,
          rgba(255, 255, 255, 0)
        );
        animation: shimmer 2s infinite;
        content: '';
      }
      .dark .skeleton-box::after {
        background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.05) 20%,
          rgba(255, 255, 255, 0.1) 60%,
          rgba(255, 255, 255, 0)
        );
      }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
    </style>

    <div id="daily-loading" class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md hidden transition-opacity duration-300">
      <div class="relative w-16 h-16 mb-4">
         <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
         <img src="assets/Flowr Logo.png" class="relative w-full h-full rounded-full animate-breath shadow-lg">
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 font-semibold animate-pulse tracking-wide">Syncing Daily Logs...</p>
    </div>

    <section class="font-inter max-w-[95%] xl:max-w-7xl mx-auto mt-10 mb-8 px-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-start transition hover:-translate-y-1 hover:shadow-md">
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Revenue</span>
          <span id="summary-revenue" class="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">₹0.00</span>
        </div>
        <div class="p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-start transition hover:-translate-y-1 hover:shadow-md">
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Cost</span>
          <span id="summary-cost" class="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">₹0.00</span>
        </div>
        <div class="p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col items-start transition hover:-translate-y-1 hover:shadow-md">
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Net Profit</span>
          <span id="summary-profit" class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">₹0.00</span>
        </div>
      </div>
    </section>

    <section class="font-inter max-w-[95%] xl:max-w-7xl mx-auto px-4 pb-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <div>
          <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Daily Logs</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium">Track your daily sales, costs, and margins.</p>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row gap-8">
        
        <div class="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <form id="daily-log-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="flex flex-col">
                <label for="log-date" class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Date</label>
                <input type="date" id="log-date" class="input-slate" required />
              </div>
              <div class="flex flex-col">
                <label for="client" class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Client Name</label>
                <input type="text" id="client" placeholder="e.g. John Doe" class="input-slate" required />
              </div>
              <div class="flex flex-col">
                <label for="invoice-number" class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Invoice # (Opt)</label>
                <input type="text" id="invoice-number" placeholder="e.g. RJ-12" class="input-slate" />
              </div>
            </div>

            <div>
              <div class="flex justify-between items-end mb-3">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-200">Line Items</span>
              </div>
              <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <table id="items-table" class="w-full text-sm text-left">
                  <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th class="px-4 py-3 w-1/3">Item Name</th>
                      <th class="px-4 py-3 w-20">Qty</th>
                      <th class="px-4 py-3">Revenue</th>
                      <th class="px-4 py-3">Cost (Ing)</th>
                      <th class="px-4 py-3">Cost (Pkg)</th>
                      <th class="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody id="items-tbody" class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900"></tbody>
                </table>
              </div>
              <button type="button" id="add-item-row" class="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Item Row
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <div>
                  <button type="button" id="toggle-notes" class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 transition mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span id="notes-label">Add Note</span>
                  </button>
                  <textarea id="notes" placeholder="Additional details..." class="input-slate hidden bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 focus:border-yellow-400 dark:text-yellow-100"></textarea>
               </div>
               <div>
                  <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Est. Profit</label>
                  <input type="number" id="calculatedProfit" class="input-slate bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold" readonly placeholder="0.00" />
               </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span id="form-state-indicator" class="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span id="form-state-text">Ready to save</span>
              </div>
              <div class="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:ml-auto w-full sm:w-auto">
                <button type="button" id="btn-new-entry" class="h-11 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl font-semibold transition-colors w-full sm:w-auto">
                  Reset
                </button>
                <button type="submit" id="btn-add-entry" data-action="add" class="h-11 min-w-[190px] px-6 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-700 dark:hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 w-full sm:w-auto">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Save Entry
                </button>
                <button type="submit" id="btn-update-entry" data-action="update" class="h-11 min-w-[190px] px-6 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:bg-emerald-700 hover:text-white hidden transition-all flex justify-center items-center gap-2 w-full sm:w-auto">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                  Update Entry
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section id="entries-layer" class="font-inter max-w-[95%] xl:max-w-7xl mx-auto mt-2 px-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        <div class="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div class="hidden xl:block">
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">History</h3>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
            
            <div class="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm p-1 gap-2">
                <button id="btn-prev-month" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition" title="Previous Month">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                
                <div class="flex items-center gap-2 px-2 cursor-pointer group relative">
                   <span id="log-date-display" class="font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm min-w-[140px] text-center select-none">
                     -- ----
                   </span>
                   
                   <input type="date" id="nav-date-picker" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20" title="Pick a specific date" />
                   
                   <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
    
                <button id="btn-next-month" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition" title="Next Month">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>

            <input type="text" id="client-search" placeholder="Search Client..." class="flex-grow sm:flex-grow-0 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 min-w-[180px] outline-none focus:border-blue-500 transition shadow-sm text-slate-600 dark:text-slate-200" />
            
            <select id="invoice-filter" class="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 outline-none focus:border-blue-500 transition shadow-sm text-slate-600 dark:text-slate-200 min-w-[140px]">
              <option value="all">All Items</option>
              <option value="not">Pending Only</option>
              <option value="yes">Invoiced Only</option>
            </select>
            
            <span id="not-invoiced-count" class="hidden"></span>

          </div>
        </div>

        <div id="log-entries" class="p-0 min-h-[200px]"> 
          </div>
      </div>
    </section>

    <div id="toast-container" class="fixed bottom-6 right-6 z-[70] flex flex-col gap-3 pointer-events-none"></div>

    <div id="alert-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900 bg-opacity-60 backdrop-blur-sm hidden transition-all duration-200">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 border border-slate-100 dark:border-slate-700 modal-animate">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
           <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
           </svg>
        </div>
        <h3 class="text-lg leading-6 font-bold text-slate-900 dark:text-white text-center mb-2" id="alert-title">Notice</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-6" id="alert-msg">
          Something happened.
        </p>
        <button id="close-alert" class="w-full px-4 py-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition">
          OK, Got it
        </button>
      </div>
    </div>
  `;

  // --- 2. State Variables ---
  let editingId = null;
  // State: "date" (for specific day) or "month" (for whole month view)
  let viewMode = "date"; 
  let currentViewDate = new Date(); // Keeps track of what we are looking at

  let activeDeletePopover = null;
  let isFormDirty = false;
  const db = firebase.firestore();

  // --- 3. Helpers ---
  function showLoading(show = true) {
    const loader = document.getElementById("daily-loading");
    if (show) loader.classList.remove("hidden");
    else loader.classList.add("hidden");
  }

  function setButtonLoading(btn, isLoading, loadingText = "Saving...") {
    if (isLoading) {
      btn.dataset.originalContent = btn.innerHTML; // Store original icon/text
      btn.disabled = true;
      btn.classList.add("opacity-80", "cursor-not-allowed");
      btn.innerHTML = `<div class="btn-spinner mr-2"></div> ${loadingText}`;
    } else {
      btn.disabled = false;
      btn.classList.remove("opacity-80", "cursor-not-allowed");
      btn.innerHTML = btn.dataset.originalContent || "Save Entry";
    }
  }

  function updateFormStatus() {
    const textEl = document.getElementById("form-state-text");
    const dotEl = document.getElementById("form-state-indicator");
    if (!textEl || !dotEl) return;

    if (isFormDirty) {
      textEl.textContent = editingId ? "Unsaved edit changes" : "Unsaved changes";
      dotEl.className = "h-2 w-2 rounded-full bg-amber-500 animate-pulse";
      return;
    }

    textEl.textContent = editingId ? "Editing entry" : "Ready to save";
    dotEl.className = "h-2 w-2 rounded-full bg-emerald-500";
  }

  function markFormDirty() {
    if (!isFormDirty) {
      isFormDirty = true;
      updateFormStatus();
    }
  }

  function markFormClean() {
    isFormDirty = false;
    updateFormStatus();
  }

  // Skeleton Loader for Table
  function renderTableSkeleton() {
    const skeletonHTML = `
      <div class="overflow-x-auto min-h-[300px] w-full animate-pulse"> 
        <table class="w-full text-sm text-left border-collapse">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
             <tr>
               <th class="px-6 py-4 w-1/5"><div class="h-4 w-20 skeleton-box"></div></th>
               <th class="px-4 py-4 w-32"><div class="h-4 w-16 skeleton-box"></div></th>
               <th class="px-6 py-4 w-1/4"><div class="h-4 w-32 skeleton-box"></div></th>
               <th class="px-4 py-4"><div class="h-4 w-16 ml-auto skeleton-box"></div></th>
               <th class="px-4 py-4"><div class="h-4 w-16 ml-auto skeleton-box"></div></th>
               <th class="px-4 py-4"><div class="h-4 w-16 ml-auto skeleton-box"></div></th>
               <th class="px-4 py-4"><div class="h-4 w-12 mx-auto skeleton-box"></div></th>
               <th class="px-6 py-4"><div class="h-4 w-12 ml-auto skeleton-box"></div></th>
             </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${[...Array(5)].map(() => `
              <tr class="border-b border-slate-50 dark:border-slate-800">
                <td class="px-6 py-4"><div class="h-5 w-32 skeleton-box mb-1"></div></td>
                <td class="px-4 py-4"><div class="h-4 w-24 skeleton-box"></div></td>
                <td class="px-6 py-4"><div class="h-5 w-40 skeleton-box mb-1"></div><div class="h-3 w-16 mt-1 skeleton-box"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 ml-auto skeleton-box"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 ml-auto skeleton-box"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 ml-auto skeleton-box"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-16 mx-auto skeleton-box"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-8 ml-auto skeleton-box rounded-full"></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById("log-entries").innerHTML = skeletonHTML;
  }

  function addItemRow(item = {}) {
    const tbody = document.getElementById('items-tbody');
    const tr = document.createElement('tr');
    tr.className = "group hover:bg-slate-50 dark:hover:bg-slate-800 transition";
    tr.innerHTML = `
      <td class="px-4 py-2">
        <input type="text" class="item-name w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500" placeholder="Item Name" value="${item.name || ''}" required>
      </td>
      <td class="px-4 py-2">
        <input type="number" class="item-qty w-full min-w-[4rem] bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-slate-700 dark:text-slate-200 font-medium" placeholder="1" value="${item.qty || ''}" min="1" required />
      </td>
      <td class="px-4 py-2">
        <input type="number" class="item-revenue w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-slate-700 dark:text-slate-200 font-medium" placeholder="0.00" value="${item.revenue || ''}" min="0" step="0.01" required />
      </td>
      <td class="px-4 py-2">
        <input type="number" class="item-ingredients w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-slate-500 dark:text-slate-400" placeholder="0.00" value="${item.ingredients || ''}" min="0" step="0.01" required />
      </td>
      <td class="px-4 py-2">
        <input type="number" class="item-packaging w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-slate-500 dark:text-slate-400" placeholder="0.00" value="${item.packaging || ''}" min="0" step="0.01" required />
      </td>
      <td class="px-4 py-2 text-right">
        <button type="button" class="remove-item text-slate-400 hover:text-red-500 transition p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove Item">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
    updateProfit();
  }

  function ensureAtLeastOneItemRow() {
    const tbody = document.getElementById('items-tbody');
    if (tbody.children.length === 0) addItemRow();
  }

  document.getElementById('add-item-row').addEventListener('click', () => {
    addItemRow();
    markFormDirty();
  });

  document.getElementById('items-tbody').addEventListener('click', function(e) {
    if (e.target.closest('.remove-item')) {
      e.target.closest('tr').remove();
      ensureAtLeastOneItemRow();
      updateProfit();
      markFormDirty();
    }
  });

  document.getElementById('items-tbody').addEventListener('input', function(e) {
    if (e.target.matches('.item-name, .item-qty, .item-revenue, .item-ingredients, .item-packaging')) {
      updateProfit();
      markFormDirty();
    }
  });

  const dailyLogFormEl = document.getElementById("daily-log-form");
  dailyLogFormEl.addEventListener("input", (e) => {
    if (e.target.id !== "calculatedProfit") markFormDirty();
  });
  dailyLogFormEl.addEventListener("change", (e) => {
    if (e.target.id !== "calculatedProfit") markFormDirty();
  });

  function updateProfit() {
    const items = Array.from(document.querySelectorAll("#items-tbody tr")).map(row => ({
      name: row.querySelector(".item-name").value,
      qty: parseInt(row.querySelector(".item-qty").value) || 0,
      revenue: parseFloat(row.querySelector(".item-revenue").value) || 0,
      ingredients: parseFloat(row.querySelector(".item-ingredients").value) || 0,
      packaging: parseFloat(row.querySelector(".item-packaging").value) || 0,
    }));
    let totalRevenue = 0, totalCost = 0;
    items.forEach(item => {
      totalRevenue += item.revenue;
      totalCost += item.ingredients + item.packaging;
    });
    const profit = totalRevenue - totalCost;
    document.getElementById("calculatedProfit").value = profit ? profit.toFixed(2) : "";
  }

  document.getElementById("toggle-notes").addEventListener("click", function(e) {
    e.preventDefault();
    const notes = document.getElementById("notes");
    notes.classList.toggle("hidden");
    const label = document.getElementById("notes-label");
    label.innerText = notes.classList.contains("hidden") ? "Add Note" : "Hide Note";
  });


  // --- 4. Render Table (STATUS LOGIC) ---
async function renderEntriesTable(entries, emptyMsg) {
  if (!entries.length) {
    return `
      <div class="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
         <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-50"><path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
         </div>
         <p class="text-sm font-medium">${emptyMsg || "No entries found."}</p>
      </div>`;
  }

  let html = `
    <div class="overflow-x-auto min-h-[300px] w-full"> 
    <table id="main-entries-table" class="w-full text-sm text-left border-collapse">
      <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
        <tr>
          <th class="px-6 py-4 w-1/5">Client</th>
          <th class="px-4 py-4 w-32">Date</th>
          <th class="px-6 py-4 w-1/4">Item & Notes</th>
          <th class="px-4 py-4 text-right">Revenue</th>
          <th class="px-4 py-4 text-right">Cost</th>
          <th class="px-4 py-4 text-right">Profit</th>
          <th class="px-4 py-4 text-center">Status</th>
          <th class="px-6 py-4 text-right w-24">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
  `;

  entries.forEach(({ docId, d }) => {
    
    // Status Logic
    const hasInvoice = d.invoiceNumber && d.invoiceNumber.trim().length > 0;
    const statusDataAttr = hasInvoice ? "invoiced" : "pending";

    let statusHtml = "";
    if (hasInvoice) {
      statusHtml = `
         <div class="flex flex-col items-center">
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                ✓ ${d.invoiceNumber}
            </span>
        </div>`;
    } else {
      statusHtml = `
         <div class="flex flex-col items-center gap-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 uppercase tracking-wide">
                Pending
            </span>
            <button onclick="createInvoiceFromDailyLog('${docId}')" class="text-xs action-link">
                Create Now
            </button>
        </div>`;
    }

    const noteHtml = d.notes 
      ? `<div class="text-xs text-slate-500 dark:text-slate-500 italic mt-1 line-clamp-1 max-w-[200px]" title="${d.notes}">By: ${d.notes}</div>` 
      : "";

    (d.items || []).forEach((item, index) => {
      const itemRev = item.revenue || 0;
      const totalCost = (item.ingredients || 0) + (item.packaging || 0);
      const itemProf = itemRev - totalCost;
      const displayNote = index === 0 ? noteHtml : "";

      html += `
        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group border-b border-slate-50 dark:border-slate-800 last:border-0">
          <td class="px-6 py-4 client-cell font-bold text-slate-700 dark:text-slate-200">${d.client || ""}</td>
          <td class="px-4 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs font-medium">${formatDisplayDate(d.date) || ""}</td>
          <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
             <div class="font-semibold text-slate-800 dark:text-white">${item.name || "Item"}</div>
             <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Qty: ${item.qty}</span>
                ${displayNote}
             </div>
          </td>
          <td class="px-4 py-4 text-right font-medium text-slate-700 dark:text-slate-200 rev-cell">₹${itemRev.toFixed(2)}</td>
          <td class="px-4 py-4 text-right text-slate-500 dark:text-slate-400 ing-cell" data-full-cost="${totalCost}">₹${totalCost.toFixed(2)}</td>
          <td class="px-4 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-300 prof-cell">₹${itemProf.toFixed(2)}</td>
          
          <td class="px-4 py-4 status-cell text-center align-middle" data-status="${statusDataAttr}">
             ${statusHtml}
          </td>

          <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end gap-4 relative">
              <button onclick="editEntry('${docId}', ${JSON.stringify(d).replace(/"/g, '&quot;')})" class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition transform hover:scale-110 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button onclick="showDeleteConfirmation(this, '${docId}')" class="text-red-400 hover:text-red-600 transition transform hover:scale-110" title="Delete">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  });

  html += `</tbody>
      <tfoot class="bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-700">
        <tr>
          <td colspan="3" class="px-6 py-4 text-right uppercase text-xs tracking-wider text-slate-400 dark:text-slate-500">Totals (Visible):</td>
          <td id="tbl-total-revenue" class="px-4 py-4 text-right">₹0.00</td>
          <td id="tbl-total-cost" class="px-4 py-4 text-right">₹0.00</td>
          <td id="tbl-total-profit" class="px-4 py-4 text-right font-extrabold text-emerald-700 dark:text-emerald-300">₹0.00</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
    </div>`;

  return html;
}

  function updateVisibleTotals() {
    const table = document.getElementById("main-entries-table");
    if (!table) return;

    let sumRev = 0, sumCost = 0, sumProf = 0;
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      if (row.style.display !== "none") {
        const parse = (selector) => {
            const txt = row.querySelector(selector)?.textContent?.replace(/[^0-9.-]+/g,"");
            return parseFloat(txt) || 0;
        }
        sumRev += parse(".rev-cell");
        sumCost += (row.querySelector(".ing-cell") ? parseFloat(row.querySelector(".ing-cell").dataset.fullCost) : 0);
        sumProf += parse(".prof-cell");
      }
    });

    const fmt = (num) => "₹" + num.toFixed(2);
    document.getElementById("tbl-total-revenue").textContent = fmt(sumRev);
    document.getElementById("tbl-total-cost").textContent = fmt(sumCost);
    document.getElementById("tbl-total-profit").textContent = fmt(sumProf);
  }

  // --- 5. Data Loading Logic ---
  
  // Generic Loader for Month Range
  async function loadMonthlySummary(monthStr, isInitial = false) {
    if (isInitial) showLoading(true);
    else renderTableSkeleton();

    viewMode = "month";
    currentViewDate = new Date(`${monthStr}-01`);
    
    // Update Display
    const monthName = currentViewDate.toLocaleString('default', { month: 'long' });
    const year = currentViewDate.getFullYear();
    document.getElementById("log-date-display").innerText = `${monthName} ${year}`;
    
    // Update Hidden Input to 1st of month so picker is near
    const dStr = `${monthStr}-01`;
    document.getElementById("nav-date-picker").value = dStr;

    const startDate = `${monthStr}-01`;
    const endDate = new Date(year, currentViewDate.getMonth() + 1, 0); // Last day of month
    const endDateStr = `${year}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    await executeQuery(startDate, endDateStr);
    if (isInitial) showLoading(false);
  }

  // Generic Loader for Specific Date
  async function loadDailySummary(dateStr, isInitial = false) {
    if (isInitial) showLoading(true);
    else renderTableSkeleton();

    viewMode = "date";
    currentViewDate = new Date(dateStr);
    
    // Update Display
    document.getElementById("log-date-display").innerText = formatDisplayDate(dateStr);
    
    // Update Hidden Input so picker shows this date
    document.getElementById("nav-date-picker").value = dateStr;

    await executeQuery(dateStr, dateStr); // Start == End
    if (isInitial) showLoading(false);
  }

  // Database Fetcher
  async function executeQuery(startStr, endStr) {
    try {
        let snapshot;
        if (startStr === endStr) {
            // Exact Match
            snapshot = await db.collection("dailyLogs").where("date", "==", startStr).get();
        } else {
            // Range Match
            snapshot = await db.collection("dailyLogs")
              .where("date", ">=", startStr)
              .where("date", "<=", endStr)
              .get();
        }

        let totalRevenue = 0, totalCost = 0, totalProfit = 0;
        const entries = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d.items && Array.isArray(d.items)) {
            d.items.forEach(item => {
                totalRevenue += item.revenue || 0;
                totalCost += (item.ingredients || 0) + (item.packaging || 0);
            });
            }
            totalProfit = totalRevenue - totalCost;
            entries.push({ docId: doc.id, d });
        });

        document.getElementById("summary-revenue").innerText = `₹${totalRevenue.toFixed(2)}`;
        document.getElementById("summary-cost").innerText = `₹${totalCost.toFixed(2)}`;
        document.getElementById("summary-profit").innerText = `₹${totalProfit.toFixed(2)}`;
        
        const emptyText = (startStr === endStr) ? "No entries for this date." : "No entries for this month.";
        document.getElementById("log-entries").innerHTML = await renderEntriesTable(entries, emptyText);
        updateVisibleTotals(); 
        filterEntriesByClient();
    } catch (err) {
        console.error(err);
        document.getElementById("log-entries").innerHTML = `<div class="p-4 text-red-500 text-center">Failed to load entries.</div>`;
    }
  }


  // --- FILTER & PENDING COUNT LOGIC ---
  function applyInvoiceFilterToTable() {
    const table = document.querySelector("#log-entries table");
    if (!table) return;

    const filter = document.getElementById("invoice-filter")?.value || "all";
    let notInvoiced = 0;

    table.querySelectorAll("tbody tr").forEach(row => {
      // Logic: Use the data-status attribute we set in renderEntriesTable
      const status = row.querySelector(".status-cell")?.dataset.status;
      const isPending = status === "pending";
      
      const clientCell = row.querySelector(".client-cell");
      const clientName = clientCell ? clientCell.textContent.trim().toLowerCase() : "";
      const searchVal = (document.getElementById("client-search")?.value || "").trim().toLowerCase();
      const matchesClient = clientName.includes(searchVal);

      let show = matchesClient; 
      if (show) {
         if (filter === "yes") show = !isPending;  // Show only invoiced
         else if (filter === "not") show = isPending; // Show only pending
      }
      row.style.display = show ? "" : "none";
      
      // Count pending items based on search/visible context
      if (isPending && matchesClient) notInvoiced += 1;
    });

    const pill = document.getElementById("not-invoiced-count");
    if (pill) {
      if(notInvoiced > 0) {
        pill.textContent = `${notInvoiced} Pending`;
        pill.className = "ml-auto inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-full leading-none whitespace-nowrap shadow-sm border border-red-200 dark:border-red-800 animate-pulse";
        pill.classList.remove("hidden");
      } else {
        pill.classList.add("hidden");
      }
    }
    updateVisibleTotals();
  }

  document.getElementById("invoice-filter")?.addEventListener("change", applyInvoiceFilterToTable);
  document.getElementById("client-search").addEventListener("input", applyInvoiceFilterToTable);
  const filterEntriesByClient = applyInvoiceFilterToTable;


  // --- 6. Form Handlers ---
  document.getElementById("daily-log-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Determine which button triggered submit
    const submitter = e.submitter;
    const action = submitter?.dataset?.action || (editingId ? "update" : "add");
    
    // Set Button Loading
    setButtonLoading(submitter, true, action === "update" ? "Updating..." : "Saving...");

    try {
        const date = document.getElementById("log-date").value;
        
        // Force Title Case
        let clientVal = document.getElementById("client").value.trim();
        const client = clientVal.replace(/\b\w/g, char => char.toUpperCase());

        const notes = document.getElementById("notes").value;
        const invoiceNumber = document.getElementById("invoice-number").value.trim();

        const items = Array.from(document.querySelectorAll("#items-tbody tr")).map(row => ({
          name: row.querySelector(".item-name").value,
          qty: parseInt(row.querySelector(".item-qty").value) || 0,
          revenue: parseFloat(row.querySelector(".item-revenue").value) || 0,
          ingredients: parseFloat(row.querySelector(".item-ingredients").value) || 0,
          packaging: parseFloat(row.querySelector(".item-packaging").value) || 0,
        }));

        let totalRevenue = 0, totalCost = 0;
        items.forEach(item => {
          totalRevenue += item.revenue;
          totalCost += item.ingredients + item.packaging;
        });
        const profit = totalRevenue - totalCost;

        let savedId = null;

        if (action === "update" && editingId) {
          await db.collection("dailyLogs").doc(editingId).update({
            date, client, items, totalRevenue, totalCost, profit, notes, invoiceNumber
          });
          savedId = editingId;
          setAddMode();
        } else {
          const addResult = await db.collection("dailyLogs").add({
            date, client, items, totalRevenue, totalCost, profit, notes, invoiceNumber, createdAt: new Date()
          });
          savedId = addResult.id;
          setAddMode();
          showInvoiceToast(savedId); 
        }

        document.getElementById("daily-log-form").reset();
        document.getElementById("items-tbody").innerHTML = "";
        document.getElementById("calculatedProfit").value = "";
        addItemRow();
        document.getElementById("log-date").value = new Date().toISOString().split("T")[0];

        // Background Refresh: Load the date we just saved to
        loadDailySummary(date);
        markFormClean();

    } catch (err) {
        console.error("Save failed", err);
        showCustomAlert("Failed to save entry. Check console.", "Error");
    } finally {
        setButtonLoading(submitter, false);
    }
  });

  function setUpdateMode() {
    editingId = editingId || null;
    document.getElementById("btn-add-entry")?.classList.add("hidden");
    document.getElementById("btn-update-entry")?.classList.remove("hidden");
    document.getElementById("btn-new-entry").innerText = "Cancel Edit";
    updateFormStatus();
  }

  function setAddMode() {
    editingId = null;
    document.getElementById("btn-update-entry")?.classList.add("hidden");
    document.getElementById("btn-add-entry")?.classList.remove("hidden");
    document.getElementById("btn-new-entry").innerText = "Reset";
    updateFormStatus();
  }

  // --- 7. Init (Start with TODAY) ---
  const todayStr = new Date().toISOString().split("T")[0];
  document.getElementById("log-date").value = todayStr;
  
  addItemRow();
  setAddMode();
  markFormClean();
  
  // Initial Load: Show entries for TODAY
  loadDailySummary(todayStr, true);


  // --- 8. Global Exports & Popover Logic ---
  window.editEntry = function (id, data) {
    editingId = id;
    document.getElementById("log-date").value = data.date;
    document.getElementById("client").value = data.client;
    document.getElementById("notes").value = data.notes || "";
    document.getElementById("invoice-number").value = data.invoiceNumber || "";
    if(data.notes) {
       document.getElementById("notes").classList.remove("hidden");
       document.getElementById("notes-label").innerText = "Hide Note";
    }

    document.getElementById("items-tbody").innerHTML = "";
    (data.items || []).forEach(item => addItemRow(item));
    ensureAtLeastOneItemRow();
    updateProfit();
    setUpdateMode();
    markFormClean();
    document.getElementById("daily-log-form").scrollIntoView({ behavior: "smooth" });
  };

  document.getElementById("btn-new-entry").addEventListener("click", () => {
    setAddMode();
    document.getElementById("daily-log-form").reset();
    document.getElementById("items-tbody").innerHTML = "";
    document.getElementById("calculatedProfit").value = "";
    addItemRow();
    document.getElementById("log-date").value = new Date().toISOString().split("T")[0];
    markFormClean();
  });

  // Popover Logic for Delete
  document.addEventListener("click", function(event) {
    if (activeDeletePopover && !activeDeletePopover.contains(event.target)) {
       removeActivePopover();
    }
  });

  function removeActivePopover() {
    if (activeDeletePopover) {
        activeDeletePopover.remove();
        activeDeletePopover = null;
    }
  }

  window.showDeleteConfirmation = function(btnElement, id) {
     event.stopPropagation();
     removeActivePopover();

     const popover = document.createElement("div");
     popover.className = "delete-popover popover-enter absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 w-48 flex flex-col gap-2";
     
     popover.innerHTML = `
        <div class="popover-arrow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"></div>
        <p class="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center mb-1">Delete this entry?</p>
        <div class="flex gap-2">
           <button class="flex-1 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition" onclick="closePopover(event)">No</button>
           <button class="flex-1 px-2 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition" onclick="executeDelete('${id}')">Yes</button>
        </div>
     `;

     document.body.appendChild(popover);
     activeDeletePopover = popover;

     const rect = btnElement.getBoundingClientRect();
     const scrollY = window.scrollY || window.pageYOffset;
     popover.style.top = `${rect.top + scrollY - 95}px`; 
     popover.style.left = `${rect.left - 130}px`; 

     window.closePopover = function(e) { e.stopPropagation(); removeActivePopover(); };
     window.executeDelete = async function(deleteId) {
        removeActivePopover();
        renderTableSkeleton(); 
        await db.collection("dailyLogs").doc(deleteId).delete();
        // Refresh whatever view we are currently on
        if (viewMode === "date") {
            const d = currentViewDate.toISOString().split("T")[0];
            loadDailySummary(d);
        } else {
            const m = currentViewDate.toISOString().slice(0, 7);
            loadMonthlySummary(m);
        }
        setAddMode();
     };
  };

  // Toast Logic (Success)
  window.showInvoiceToast = function(id) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast-enter pointer-events-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-4 flex items-center gap-4 min-w-[320px] max-w-sm";
    
    toast.innerHTML = `
      <div class="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-full p-2">
        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <div class="flex-grow">
        <p class="text-sm font-bold text-slate-800 dark:text-white">Entry Saved</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Successfully logged.</p>
      </div>
      <button class="flex-shrink-0 text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 px-3 py-2 rounded-lg transition shadow-sm" onclick="triggerCreateInvoice('${id}')">
        Create Invoice
      </button>
      <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-1" onclick="this.parentElement.remove()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      if(toast && toast.parentElement) {
        toast.classList.remove("toast-enter");
        toast.classList.add("toast-exit");
        toast.addEventListener("animationend", () => toast.remove());
      }
    }, 6000);
  }

  window.triggerCreateInvoice = function(id) {
    const btn = event.target;
    const toast = btn.closest('div.pointer-events-auto');
    if(toast) toast.remove();
    window.createInvoiceFromDailyLog(id);
  }

  // Alert Modal
  window.showCustomAlert = function(msg, title="Notice") {
    document.getElementById("alert-title").innerText = title;
    document.getElementById("alert-msg").innerText = msg;
    document.getElementById("alert-modal").classList.remove("hidden");
  }
  document.getElementById("close-alert").addEventListener("click", function() {
    document.getElementById("alert-modal").classList.add("hidden");
  });


  // --- 9. HYBRID NAVIGATION LOGIC ---

  // A. Arrows: Move by MONTH
  function moveByMonth(offset) {
    // Current view date is our anchor. Move month by offset.
    // Set to 1st of month to avoid overflow (e.g. Mar 31 -> Feb 28)
    const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
    
    // Convert to YYYY-MM format for the loader
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const monthStr = `${year}-${month}`;
    
    // Arrows always switch to "Month View" mode
    loadMonthlySummary(monthStr);
  }

  document.getElementById("btn-prev-month").addEventListener("click", () => moveByMonth(-1));
  document.getElementById("btn-next-month").addEventListener("click", () => moveByMonth(1));

  // B. Center Picker: Jump to SPECIFIC DATE or RESET TO MONTH
  document.getElementById("nav-date-picker").addEventListener("change", (e) => {
    const val = e.target.value; // YYYY-MM-DD
    
    if (val) {
        // 1. If user picks a date -> Load Day View
        loadDailySummary(val);
    } else {
        // 2. If user clicks "Clear" -> Load Month View for the current context
        // We rely on 'currentViewDate' which tracks the date currently being viewed
        const year = currentViewDate.getFullYear();
        // Pad month with 0 if needed (e.g. "1" becomes "01")
        const month = String(currentViewDate.getMonth() + 1).padStart(2, "0");
        
        const monthStr = `${year}-${month}`;
        
        loadMonthlySummary(monthStr);
    }
  });

});

// --- GLOBAL EXPORT: THE BRIDGE TO INVOICES.JS ---
window.createInvoiceFromDailyLog = async function(dailyLogId) {
  const db = firebase.firestore();
  const docRef = db.collection("dailyLogs").doc(dailyLogId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
      if(window.showCustomAlert) window.showCustomAlert("Daily log not found.", "Error");
      else alert("Daily log not found.");
      return;
  }
  
  const d = doc.data();

  // Save specific payload including invoiceNumber
  localStorage.setItem("invoicePrefill", JSON.stringify({
    dailyLogId,
    client: d.client,
    items: d.items,
    date: d.date,
    notes: d.notes,
    total: d.totalRevenue,
    invoiceNumber: d.invoiceNumber || "" 
  }));

  // Redirect to Invoice Tab
  window.location.hash = "#invoicePrintArea";
  
  setTimeout(() => {
    if (window.prefillInvoiceFromDailyLog) window.prefillInvoiceFromDailyLog();
  }, 300);
};
