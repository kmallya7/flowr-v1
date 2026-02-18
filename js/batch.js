// batch.js

// --- Global Logic & Font Injection ---
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Dropdown Toggle Logic
window.toggleDropdown = function(id) {
  // Close others
  document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
    if (el.id !== `dropdown-${id}`) el.classList.add('hidden', 'opacity-0', 'scale-95');
  });
  
  const dropdown = document.getElementById(`dropdown-${id}`);
  if (dropdown) {
    if (dropdown.classList.contains('hidden')) {
      // OPEN
      dropdown.classList.remove('hidden');
      setTimeout(() => {
        dropdown.classList.remove('opacity-0', 'scale-95');
        dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 10);
    } else {
      // CLOSE
      dropdown.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        dropdown.classList.add('hidden');
      }, 150);
    }
  }
};

document.addEventListener('click', function(event) {
  // Close dropdowns if clicking outside
  if (!event.target.closest('.relative-dropdown')) {
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
      el.classList.add('opacity-0', 'scale-95');
      setTimeout(() => el.classList.add('hidden'), 150);
    });
  }
  // Close Modal if clicking backdrop
  if (event.target.id === 'edit-modal-backdrop') {
    window.closeEditModal();
  }
  if (event.target.id === 'save-modal-backdrop') {
    window.closeSaveModal();
  }
  if (event.target.id === 'delete-modal-backdrop') {
    window.closeDeleteModal();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (typeof window.closeEditModal === "function") window.closeEditModal();
    if (typeof window.closeSaveModal === "function") window.closeSaveModal();
    if (typeof window.closeDeleteModal === "function") window.closeDeleteModal();
  }
});

// --- Main UI logic ---
document.addEventListener("DOMContentLoaded", () => {
  const batchSection = document.getElementById("batchCalculator");
  const db = window.db; 
  let cachedPresets = [];

  // Updated Layout
  batchSection.innerHTML = `
    <style>
      .font-inter { font-family: 'Inter', sans-serif; }
      
      /* Input Logic */
      .input-container {
        display: flex;
        align-items: center;
        background-color: #f8fafc; /* slate-50 */
        border: 1px solid #e2e8f0; /* slate-200 */
        border-radius: 0.75rem; /* rounded-xl */
        transition: all 0.2s;
      }
      .dark .input-container {
        background-color: #0f172a; 
        border-color: #334155; 
      }

      .input-container:focus-within {
        background-color: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        transform: translateY(-1px);
      }
      .dark .input-container:focus-within {
        background-color: #1e293b; 
      }

      .input-container:focus-within .icon-slot { color: #3b82f6; }
      
      .naked-input {
        flex: 1;
        width: 100%;
        background: transparent;
        border: none;
        padding: 0.875rem 0.5rem; 
        outline: none;
        color: #1e293b;
        font-weight: 500;
      }
      .dark .naked-input { color: #f8fafc; }

      .naked-input::-webkit-outer-spin-button,
      .naked-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Modal Animation */
      @keyframes modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .animate-modal-in { animation: modal-in 0.2s ease-out forwards; }
    </style>

    <section class="font-inter max-w-6xl mx-auto mt-10 px-4 mb-20">
      
      <div class="text-center mb-10">
        <h2 class="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
          Batch Profit Calculator
        </h2>
        <p class="text-slate-500 dark:text-slate-400 text-lg">Optimize your pastry margins with precision.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"></path></svg>
              Batch Details
            </h3>
            
            <form id="batch-form" class="space-y-6" autocomplete="off">
              
              <div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cost to Produce</label>
                <div class="input-container">
                  <div class="pl-4 pr-1 icon-slot text-slate-400 font-semibold select-none">₹</div>
                  <input type="number" id="cost" placeholder="20.00" class="naked-input" min="0.01" step="0.01" required />
                  <div class="pr-4 pl-2 text-xs text-slate-400 font-medium select-none whitespace-nowrap">per unit</div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Selling Price</label>
                <div class="input-container">
                  <div class="pl-4 pr-1 icon-slot text-slate-400 font-semibold select-none">₹</div>
                  <input type="number" id="price" placeholder="50.00" class="naked-input" min="0.01" step="0.01" required />
                  <div class="pr-4 pl-2 text-xs text-slate-400 font-medium select-none whitespace-nowrap">per unit</div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Batch Quantity</label>
                <div class="input-container">
                  <div class="pl-4 pr-1 icon-slot text-slate-400 select-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  </div>
                  <input type="number" id="qty" placeholder="12" class="naked-input" min="1" step="1" required />
                  <div class="pr-2 pl-2 text-xs text-slate-400 font-medium select-none whitespace-nowrap">units</div>
                </div>
              </div>

              <div id="form-error" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm hidden flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span id="error-msg"></span>
              </div>

              <div class="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  class="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-700 dark:hover:bg-blue-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate
                </button>
                <button type="button" id="reset-btn" class="px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white py-3.5 rounded-xl font-semibold transition-colors">
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div class="mt-8">
            <button id="toggle-presets-btn" class="w-full group flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div class="text-left">
                  <span class="block font-semibold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Saved Batches</span>
                  <span class="block text-xs text-slate-400" id="toggle-status">Click to view library</span>
                </div>
              </div>
              <svg id="toggle-arrow" class="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <div id="preset-section" class="overflow-hidden transition-all duration-500 ease-in-out" style="max-height:0; opacity:0;">
              <div class="bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl p-4 shadow-inner bg-slate-50/50 dark:bg-slate-900/50">
                
                <div class="input-container bg-white dark:bg-slate-900 mb-4">
                  <div class="pl-3 pr-2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input id="preset-search" type="text" placeholder="Search saved batches..." class="naked-input py-2.5" />
                </div>

                <div id="preset-loading" class="hidden py-6 flex flex-col items-center justify-center space-y-3">
                  <div class="relative">
                     <div class="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-20 animate-pulse"></div>
                     <img src="assets/Flowr Logo.png" class="relative w-8 h-8 rounded-full animate-breath shadow-sm">
                  </div>
                  <p class="text-xs text-slate-400 font-medium animate-pulse">Loading batches...</p>
                </div>

                <div id="preset-list" class="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar pb-10">
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-6">
          
          <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sticky top-8">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Financials</h3>
            
            <div id="grossProfitTile" class="relative overflow-hidden rounded-xl p-6 mb-4 transition-all duration-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div class="relative z-10">
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Gross Profit</p>
                <div class="flex items-baseline gap-2">
                  <h2 id="profit" class="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹0.00</h2>
                </div>
              </div>
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-10 rounded-full blur-xl"></div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6">
              <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Revenue</p>
                <p id="revenue" class="text-lg font-bold text-slate-700 dark:text-slate-200">₹0.00</p>
              </div>
              <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Total Cost</p>
                <p id="costs" class="text-lg font-bold text-slate-700 dark:text-slate-200">₹0.00</p>
              </div>
            </div>

            <div class="bg-slate-900 dark:bg-blue-600 rounded-xl p-5 text-white flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-400 dark:text-blue-100 uppercase font-bold">Profit Margin</p>
                <p id="margin" class="text-2xl font-bold mt-1">0.00%</p>
              </div>
              <div class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button id="save-preset-btn" class="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-medium hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group">
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                <span>Save this Batch</span>
              </button>
               
               <p class="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                 Save to your library with a custom batch name.
               </p>

            </div>

          </div>
        </div>

      </div>

      </section>
  `;

  // --- Logic Implementation ---
  
  // UI Helpers
  const showError = (msg) => {
    const errorDiv = document.getElementById("form-error");
    const errorMsg = document.getElementById("error-msg");
    errorMsg.innerText = msg;
    errorDiv.classList.remove("hidden");
    errorDiv.classList.remove("animate-pulse");
    void errorDiv.offsetWidth; 
    errorDiv.classList.add("animate-pulse");
  };
  
  const hideError = () => {
    document.getElementById("form-error").classList.add("hidden");
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const showModalError = (id, msg) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  };

  const hideModalError = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
  };

  const setProfitTileColor = (profit) => {
    const tile = document.getElementById("grossProfitTile");
    const profitText = document.getElementById("profit");
    
    // Clean classes
    tile.className = "relative overflow-hidden rounded-xl p-6 mb-4 transition-all duration-500 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
    profitText.className = "text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white";

    if (profit > 0) {
      tile.classList.add("bg-green-50", "border-green-100", "text-green-500", "dark:bg-green-900/20", "dark:border-green-900", "dark:text-green-400");
      profitText.classList.remove("text-slate-900", "dark:text-white");
      profitText.classList.add("text-green-700", "dark:text-green-400");
    } else if (profit < 0) {
      tile.classList.add("bg-red-50", "border-red-100", "text-red-500", "dark:bg-red-900/20", "dark:border-red-900", "dark:text-red-400");
      profitText.classList.remove("text-slate-900", "dark:text-white");
      profitText.classList.add("text-red-700", "dark:text-red-400");
    }
  };

  const calculateAndDisplay = () => {
    const cost = parseFloat(document.getElementById("cost").value);
    const price = parseFloat(document.getElementById("price").value);
    const qty = parseFloat(document.getElementById("qty").value);

    if (isNaN(cost) || isNaN(price) || isNaN(qty)) {
        document.getElementById("revenue").innerText = `₹0.00`;
        document.getElementById("costs").innerText = `₹0.00`;
        document.getElementById("profit").innerText = `₹0.00`;
        document.getElementById("margin").innerText = `0.00%`;
        setProfitTileColor(0);
        return false;
    }

    if (cost <= 0 || price <= 0 || qty <= 0) return false;

    hideError();

    const totalRevenue = price * qty;
    const totalCost = cost * qty;
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue === 0 ? 0 : (profit / totalRevenue) * 100;

    document.getElementById("revenue").innerText = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById("costs").innerText = `₹${totalCost.toFixed(2)}`;
    document.getElementById("profit").innerText = `₹${profit.toFixed(2)}`;
    document.getElementById("margin").innerText = `${margin.toFixed(2)}%`;
    setProfitTileColor(profit);

    return { cost, price, qty, profit };
  };

  const resetFormAndResults = () => {
    document.getElementById("batch-form").reset();
    document.getElementById("revenue").innerText = `₹0.00`;
    document.getElementById("costs").innerText = `₹0.00`;
    document.getElementById("profit").innerText = `₹0.00`;
    document.getElementById("margin").innerText = `0.00%`;
    setProfitTileColor(0);
    hideError();
  };

  // Listeners
  document.getElementById("reset-btn").addEventListener("click", resetFormAndResults);
  
  document.getElementById("batch-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const cost = parseFloat(document.getElementById("cost").value);
    const price = parseFloat(document.getElementById("price").value);
    const qty = parseFloat(document.getElementById("qty").value);
    
    if (isNaN(cost) || isNaN(price) || isNaN(qty) || cost <= 0 || price <= 0 || qty <= 0) {
      showError("Please enter valid positive numbers.");
    } else {
      calculateAndDisplay();
    }
  });

  ["cost", "price", "qty"].forEach(id => {
    document.getElementById(id).addEventListener("input", calculateAndDisplay);
  });

  // --- Preset Logic ---

  function renderPresetList(items) {
    const presetList = document.getElementById("preset-list");
    if (!presetList) return;

    if (!items.length) {
      presetList.innerHTML = `
        <div class="text-center py-6">
          <p class="text-sm text-slate-400">No batches found.</p>
        </div>`;
      return;
    }

    presetList.innerHTML = items.map(d => {
      const safeId = d.__id;
      return `
        <div id="preset-item-${safeId}" 
             class="group relative flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer relative-dropdown"
             onclick='window.applyPreset(${JSON.stringify({ cost: d.cost, price: d.price, qty: d.qty })});'>
          
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
               ${d.name ? d.name.charAt(0).toUpperCase() : '#'}
            </div>
            <div class="min-w-0">
              <h4 class="font-semibold text-slate-800 dark:text-white text-sm truncate pr-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">${d.name}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate">₹${d.price} sell • ₹${d.cost} cost</p>
            </div>
          </div>

          <div class="relative ml-2" onclick="event.stopPropagation();">
            <button onclick="window.toggleDropdown('${safeId}')" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
            </button>
            <div id="dropdown-${safeId}" class="hidden absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 transform transition-all duration-200 origin-top-right opacity-0 scale-95">
              <div class="py-1">
                <button onclick='window.openEditModal("${safeId}")' class="flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400">
                  Edit
                </button>
                <button onclick='window.openDeleteModal("${safeId}", ${JSON.stringify(d.name || "this batch")})' class="flex w-full items-center px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadPresets() {
    document.getElementById("preset-loading").classList.remove("hidden");
    const presetList = document.getElementById("preset-list");
    presetList.innerHTML = "";
    
    try {
      const snapshot = await db.collection("batchPresets").orderBy("createdAt", "desc").get();
      cachedPresets = [];
      snapshot.forEach(doc => {
        cachedPresets.push({ __id: doc.id, ...doc.data() });
      });
      renderPresetList(cachedPresets);
    } catch (e) {
      console.error(e);
      presetList.innerHTML = `<p class='text-center text-xs text-red-400 py-4'>Error loading presets.</p>`;
    }
    document.getElementById("preset-loading").classList.add("hidden");
  }

  document.getElementById("preset-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    if(!q) return renderPresetList(cachedPresets);
    const filtered = cachedPresets.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) || String(p.price).includes(q)
    );
    renderPresetList(filtered);
  });

  document.getElementById("save-preset-btn").addEventListener("click", () => {
    const res = calculateAndDisplay();
    if (!res) {
      showError("Fill in valid data first.");
      return;
    }
    window.openSaveModal(res);
  });

  window.applyPreset = (data) => {
    // If we are clicking inside an edit form, ignore apply
    if(document.activeElement.tagName === 'INPUT') return;

    const costEl = document.getElementById("cost");
    const priceEl = document.getElementById("price");
    const qtyEl = document.getElementById("qty");
    
    costEl.value = data.cost;
    priceEl.value = data.price;
    qtyEl.value = data.qty;
    
    calculateAndDisplay();
    
    [costEl, priceEl, qtyEl].forEach(el => {
      const parent = el.closest('.input-container');
      parent.classList.add('bg-blue-50', 'border-blue-300');
      setTimeout(() => parent.classList.remove('bg-blue-50', 'border-blue-300'), 500);
    });

    window.scrollTo({ top: document.getElementById("batchCalculator").offsetTop - 20, behavior: 'smooth' });
  };

  // --- NEW GLOBAL MODAL LOGIC (Appended to Body) ---

  window.openSaveModal = (data) => {
    window.closeSaveModal();
    window.closeEditModal();
    window.closeDeleteModal();

    const modal = document.createElement("div");
    modal.id = "save-modal-wrapper";
    modal.className = "relative z-[9999]";

    modal.innerHTML = `
      <div id="save-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-modal-in">
            <div class="px-6 pt-6 pb-2 flex justify-between items-start">
              <div>
                <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Save Batch</h3>
                <p class="text-xl font-bold text-slate-900 dark:text-white">Add to your presets</p>
              </div>
              <button type="button" onclick="window.closeSaveModal()" class="rounded-full p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="px-6 pb-4 space-y-4">
              <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <label class="block text-xs font-medium text-slate-500 mb-1">Preset Name</label>
                <input type="text" id="save-modal-name" placeholder="Chocolate Croissant" class="w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white font-semibold focus:ring-0 text-lg" />
              </div>

              <div class="grid grid-cols-3 gap-3 text-center">
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2 border border-slate-100 dark:border-slate-700/50">
                  <p class="text-[10px] uppercase text-slate-400">Cost</p>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">₹${data.cost.toFixed(2)}</p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2 border border-slate-100 dark:border-slate-700/50">
                  <p class="text-[10px] uppercase text-slate-400">Price</p>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">₹${data.price.toFixed(2)}</p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2 border border-slate-100 dark:border-slate-700/50">
                  <p class="text-[10px] uppercase text-slate-400">Qty</p>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">${data.qty}</p>
                </div>
              </div>

              <div id="save-modal-error" class="hidden bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs"></div>
            </div>

            <div class="px-6 pb-6 pt-2">
              <button id="save-modal-submit-btn" onclick='window.saveNewPreset(${JSON.stringify(data)})' class="w-full inline-flex justify-center items-center rounded-xl bg-blue-600 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all">
                Save Preset
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const nameInput = document.getElementById("save-modal-name");
    if (nameInput) nameInput.focus();
  };

  window.closeSaveModal = () => {
    const el = document.getElementById("save-modal-wrapper");
    if (el) el.remove();
  };

  window.saveNewPreset = async (data) => {
    const nameInput = document.getElementById("save-modal-name");
    const saveBtn = document.getElementById("save-modal-submit-btn");
    const name = nameInput?.value.trim();

    hideModalError("save-modal-error");

    if (!name) {
      showModalError("save-modal-error", "Please enter a preset name.");
      return;
    }

    if (!saveBtn) return;
    const originalLabel = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtn.innerHTML = "Saving...";

    try {
      await db.collection("batchPresets").add({
        name,
        cost: data.cost,
        price: data.price,
        qty: data.qty,
        createdAt: new Date()
      });

      window.closeSaveModal();
      if (presetsVisible) loadPresets();
      else document.getElementById("toggle-presets-btn").click();
    } catch (e) {
      console.error("Save preset failed", e);
      showModalError("save-modal-error", "Could not save right now. Please try again.");
      saveBtn.disabled = false;
      saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
      saveBtn.innerHTML = originalLabel;
    }
  };
  
  window.openEditModal = (id) => {
    // Find data
    const item = cachedPresets.find(p => p.__id === id);
    if (!item) return;

    // Remove any existing modal first
    window.closeSaveModal();
    window.closeDeleteModal();
    window.closeEditModal();

    const modal = document.createElement('div');
    modal.id = 'edit-modal-wrapper';
    modal.className = 'relative z-[9999]';
    
    // Inject Modal HTML (Portal to Body)
    modal.innerHTML = `
      <div id="edit-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
      
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          
          <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-modal-in">
            
            <div class="px-6 pt-6 pb-4 flex justify-between items-start">
               <div>
                  <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Editing Batch Details</h3>
                  
                  <div class="relative mt-2">
                     <input type="text" id="modal-name" value="${escapeHtml(item.name)}" 
                       class="block w-full border-0 p-0 text-slate-900 dark:text-white text-2xl font-bold placeholder:text-slate-400 focus:ring-0 bg-transparent" 
                       placeholder="Batch Name" />
                     <div class="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                  </div>
               </div>
               
               <button type="button" onclick="window.closeEditModal()" class="rounded-full p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                 <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>

            <div class="px-6 pb-4 space-y-4">
               
               <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                     <label class="block text-xs font-medium text-slate-500 mb-1">Selling Price (₹)</label>
                     <input type="number" id="modal-price" value="${item.price}" class="w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white font-semibold focus:ring-0 text-lg" />
                  </div>
                  
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                     <label class="block text-xs font-medium text-slate-500 mb-1">Cost (₹)</label>
                     <input type="number" id="modal-cost" value="${item.cost}" class="w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white font-semibold focus:ring-0 text-lg" />
                  </div>
               </div>

               <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <label class="block text-xs font-medium text-slate-500 mb-1">Batch Quantity</label>
                  <input type="number" id="modal-qty" value="${item.qty}" class="w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white font-semibold focus:ring-0 text-lg" />
               </div>
               <div id="modal-edit-error" class="hidden bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs"></div>
            </div>

            <div class="px-6 pb-6 pt-2">
               <button id="modal-edit-save-btn" onclick="window.saveEditModal('${id}')" class="w-full inline-flex justify-center items-center rounded-xl bg-blue-600 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all">
                  Save Changes
                  <svg class="ml-2 -mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
               </button>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Ensure dropdown is closed
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
  };

  window.closeEditModal = () => {
    const el = document.getElementById('edit-modal-wrapper');
    if (el) el.remove();
  };

  window.saveEditModal = async (id) => {
    const name = document.getElementById('modal-name').value.trim();
    const price = parseFloat(document.getElementById('modal-price').value);
    const cost = parseFloat(document.getElementById('modal-cost').value);
    const qty = parseFloat(document.getElementById('modal-qty').value);
    const saveBtn = document.getElementById("modal-edit-save-btn");

    hideModalError("modal-edit-error");

    if (!name || isNaN(price) || isNaN(cost) || isNaN(qty)) {
      showModalError("modal-edit-error", "Please check your inputs.");
      return;
    }

    if (price <= 0 || cost <= 0 || qty <= 0) {
      showModalError("modal-edit-error", "Price, cost, and quantity must be greater than zero.");
      return;
    }

    if (!saveBtn) return;
    const originalLabel = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtn.innerHTML = "Saving...";

    try {
      await db.collection("batchPresets").doc(id).update({ name, cost, price, qty });
      const index = cachedPresets.findIndex(p => p.__id === id);
      if (index !== -1) {
        cachedPresets[index] = { ...cachedPresets[index], name, price, cost, qty };
        renderPresetList(cachedPresets);
      }
      window.closeEditModal();
    } catch (e) {
      console.error("Save failed", e);
      showModalError("modal-edit-error", "Failed to save changes. Please try again.");
      saveBtn.disabled = false;
      saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
      saveBtn.innerHTML = originalLabel;
    }
  };

  window.openDeleteModal = (id, name) => {
    window.closeDeleteModal();
    window.closeSaveModal();
    window.closeEditModal();

    const modal = document.createElement("div");
    modal.id = "delete-modal-wrapper";
    modal.className = "relative z-[9999]";

    modal.innerHTML = `
      <div id="delete-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-modal-in">
            <div class="px-6 pt-6 pb-2 flex justify-between items-start">
              <div>
                <h3 class="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-widest mb-1">Delete Batch</h3>
                <p class="text-xl font-bold text-slate-900 dark:text-white">Are you sure?</p>
              </div>
              <button type="button" onclick="window.closeDeleteModal()" class="rounded-full p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="px-6 pb-4 space-y-4">
              <p class="text-sm text-slate-600 dark:text-slate-300">
                This will permanently remove <span class="font-semibold text-slate-900 dark:text-white">"${escapeHtml(name)}"</span> from saved batches.
              </p>
              <div id="delete-modal-error" class="hidden bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs"></div>
            </div>

            <div class="px-6 pb-6 pt-2 flex gap-3">
              <button type="button" onclick="window.closeDeleteModal()" class="flex-1 inline-flex justify-center items-center rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Cancel
              </button>
              <button id="delete-modal-confirm-btn" type="button" onclick="window.confirmDeletePreset('${id}')" class="flex-1 inline-flex justify-center items-center rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white hover:bg-red-500 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
  };

  window.closeDeleteModal = () => {
    const el = document.getElementById("delete-modal-wrapper");
    if (el) el.remove();
  };

  window.confirmDeletePreset = async (id) => {
    const deleteBtn = document.getElementById("delete-modal-confirm-btn");
    hideModalError("delete-modal-error");

    if (!deleteBtn) return;
    const originalLabel = deleteBtn.innerHTML;
    deleteBtn.disabled = true;
    deleteBtn.classList.add("opacity-70", "cursor-not-allowed");
    deleteBtn.innerHTML = "Deleting...";

    try {
      await db.collection("batchPresets").doc(id).delete();
      cachedPresets = cachedPresets.filter(p => p.__id !== id);
      renderPresetList(cachedPresets);
      window.closeDeleteModal();
    } catch (e) {
      console.error("Delete failed", e);
      showModalError("delete-modal-error", "Failed to delete. Please try again.");
      deleteBtn.disabled = false;
      deleteBtn.classList.remove("opacity-70", "cursor-not-allowed");
      deleteBtn.innerHTML = originalLabel;
    }
  };

  const toggleBtn = document.getElementById("toggle-presets-btn");
  const presetSection = document.getElementById("preset-section");
  const toggleArrow = document.getElementById("toggle-arrow");
  const toggleStatus = document.getElementById("toggle-status");
  let presetsVisible = false;

  toggleBtn.addEventListener("click", () => {
    presetsVisible = !presetsVisible;
    if (presetsVisible) {
      presetSection.style.maxHeight = "500px";
      presetSection.style.opacity = "1";
      toggleArrow.style.transform = "rotate(180deg)";
      toggleStatus.innerText = "Click to close library";
      loadPresets();
    } else {
      presetSection.style.maxHeight = "0";
      presetSection.style.opacity = "0";
      toggleArrow.style.transform = "rotate(0deg)";
      toggleStatus.innerText = "Click to view library";
    }
  });

});
