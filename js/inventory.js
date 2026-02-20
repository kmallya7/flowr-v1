// js/inventory.js

document.addEventListener("DOMContentLoaded", () => {
  const db = window.db;
  const auth = window.auth;
  let editingId = null;
  let chartInstance = null;

  // Sorting state
  let sortField = "product";
  let sortDir = "asc";

  // Currency Formatter (Indian Rupee)
  const formatCurrency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  });

  // Date formatting utility
  function formatDate(dateStr) {
    if (!dateStr) return "--";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}-${months[parseInt(m, 10) - 1]}-${y}`;
  }

  // Get the main container
  const container = document.getElementById("inventory");
  if (!container) return; 

  // Register ChartDataLabels plugin if available
  if (window.ChartDataLabels) {
    Chart.register(ChartDataLabels);
  }

  // Render the Inventory UI
  container.innerHTML = `
    <div id="inv-loading" class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-md hidden transition-opacity duration-300">
      <div class="relative w-16 h-16 mb-4">
         <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
         <img src="assets/Flowr Logo.png" class="relative w-full h-full rounded-full animate-breath shadow-lg">
      </div>
      <p class="text-sm text-slate-500 font-semibold animate-pulse tracking-wide">Checking Stock...</p>
    </div>

    <div class="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i data-feather="package" class="text-blue-600"></i> Inventory Tracker
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Manage stock levels and purchases</p>
        </div>
        
        <div class="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
           <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 flex items-center justify-center">
             <span class="text-xl font-bold leading-none">₹</span>
           </div>
           <div>
             <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
             <p class="text-xl font-bold text-slate-800 dark:text-slate-100" id="total-money-spent">₹0.00</p>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
            <p id="inv-total-items" class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">0</p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500">
            <i data-feather="box"></i>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Value</p>
            <p id="inv-value" class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹0.00</p>
          </div>
          <div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500">
            <i data-feather="trending-up"></i>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
            <p id="inv-low-stock" class="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">0</p>
          </div>
          <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
            <i data-feather="alert-triangle"></i>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
             <span class="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600">
               <i data-feather="plus" class="w-4 h-4"></i>
             </span>
             <span id="form-header-text">Add New Product</span>
          </h3>
          
          <form id="inv-form" autocomplete="off" class="space-y-5">
            
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Product Name</label>
              <input id="inv-product" type="text" placeholder="e.g. Dark Chocolate" 
                class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition font-medium" required />
              <div id="error-product" class="text-red-500 text-xs mt-1 hidden"></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Quantity</label>
                <input id="inv-qty" type="number" placeholder="0" min="0" step="any"
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                <div id="error-qty" class="text-red-500 text-xs mt-1 hidden"></div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Unit</label>
                <input id="inv-unit" type="text" placeholder="kg, L, pcs" 
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                <div id="error-unit" class="text-red-500 text-xs mt-1 hidden"></div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">MRP (₹)</label>
                <input id="inv-mrp" type="number" placeholder="0.00" min="0" step="0.01"
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Rate (₹)</label>
                <input id="inv-rate" type="number" placeholder="0.00" min="0" step="0.01"
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                <div id="error-rate" class="text-red-500 text-xs mt-1 hidden"></div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Purchase Date</label>
                 <input id="inv-date" type="date" 
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-400 transition" required />
              </div>
              <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Notes</label>
                 <input id="inv-notes" type="text" placeholder="Optional..." 
                  class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" />
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-800/30">
                <span class="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Total Amount</span>
                <p id="inv-amount" class="text-lg font-bold text-green-700 dark:text-green-300">₹0.00</p>
              </div>
              <div class="flex gap-3">
                 <button id="cancel-edit-btn" type="button" class="hidden px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition">Cancel</button>
                 <button id="add-inv-btn" type="submit" class="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg shadow-slate-200 dark:shadow-none hover:-translate-y-0.5">Add Product</button>
                 <button id="update-inv-btn" type="button" class="hidden px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg hover:-translate-y-0.5">Update Product</button>
              </div>
            </div>
          </form>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div class="flex items-center justify-between mb-4">
             <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Spending</h3>
             <i data-feather="bar-chart-2" class="w-4 h-4 text-slate-300"></i>
          </div>
          <div class="relative w-full h-56">
            <canvas id="moneySpentChart"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
             <h3 class="text-lg font-bold text-slate-800 dark:text-white">Product List</h3>
             <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700" id="table-count-badge">0</span>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative flex-1 sm:flex-none group">
                <i data-feather="search" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                <input id="search-inv" type="text" placeholder="Search inventory..." class="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition font-medium">
            </div>
            <button id="toggle-used-btn" class="px-4 py-2 bg-white border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                History
            </button>
          </div>
        </div>

        <div class="overflow-x-auto min-h-[300px]">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="product">Product</th>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="qty">Qty</th>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="unit">Unit</th>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="rate">Rate</th>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="amount">Total</th>
                <th class="px-6 py-4">Notes</th>
                <th class="px-6 py-4 cursor-pointer hover:text-blue-600 sort-header" data-field="date">Date</th>
                <th class="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-list" class="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
              </tbody>
          </table>
        </div>
      </div>

      <div id="used-products-section" class="hidden bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
         <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <i data-feather="archive" class="w-4 h-4"></i> Usage History
         </h3>
         <div class="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table class="w-full text-sm text-left opacity-75">
                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th class="px-6 py-3">Product</th>
                    <th class="px-6 py-3">Qty</th>
                    <th class="px-6 py-3">Amount</th>
                    <th class="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody id="used-products-list" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
            </table>
         </div>
      </div>

    </div>
  `;

  // Initialize Icons
  if (window.feather) window.feather.replace();

  // Helper functions
  function showLoading(show) {
      const loader = document.getElementById("inv-loading");
      if(show) loader.classList.remove("hidden");
      else loader.classList.add("hidden");
  }

  function getProduct() { return document.getElementById("inv-product").value.trim(); }
  function getQty() { return parseFloat(document.getElementById("inv-qty").value) || 0; }
  function getUnit() { return document.getElementById("inv-unit").value.trim(); }
  function getMRP() { return parseFloat(document.getElementById("inv-mrp").value) || 0; }
  function getRate() { return parseFloat(document.getElementById("inv-rate").value) || 0; }
  function getNotes() { return document.getElementById("inv-notes").value.trim(); }
  function getDate() { return document.getElementById("inv-date").value; }

  function resetInventoryViewForSignedOut() {
    document.getElementById("inventory-list").innerHTML = "";
    document.getElementById("used-products-list").innerHTML = "";
    document.getElementById("inv-total-items").innerText = "0";
    document.getElementById("inv-value").innerText = formatCurrency.format(0);
    document.getElementById("inv-low-stock").innerText = "0";
    document.getElementById("table-count-badge").innerText = "0";
    document.getElementById("total-money-spent").innerText = formatCurrency.format(0);
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  // Validation
  function validateForm() {
    let valid = true;
    if (!getProduct()) { showError("product", "Required"); valid = false; } else hideError("product");
    if (getQty() <= 0) { showError("qty", "> 0"); valid = false; } else hideError("qty");
    if (!getUnit()) { showError("unit", "Required"); valid = false; } else hideError("unit");
    if (getRate() < 0) { showError("rate", "Invalid"); valid = false; } else hideError("rate");
    return valid;
  }
  function showError(field, msg) {
    document.getElementById("error-" + field).textContent = msg;
    document.getElementById("error-" + field).classList.remove("hidden");
  }
  function hideError(field) {
    document.getElementById("error-" + field).classList.add("hidden");
  }

  // Live Summary Update
  function updateSummary() {
    const qty = getQty();
    const rate = getRate();
    const amount = qty * rate;
    document.getElementById("inv-amount").innerText = formatCurrency.format(amount);
  }
  ["inv-qty", "inv-rate"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateSummary);
  });

  // Notyf for notifications
  const notyf = new Notyf({
    duration: 3000,
    position: { x: 'right', y: 'bottom' },
    ripple: true,
    types: [
        { type: 'success', background: '#10B981', icon: false }, 
        { type: 'error', background: '#EF4444', icon: false }    
    ]
  });

  // Handle Add
  document.getElementById("inv-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (editingId) return; 

    const btn = document.getElementById("add-inv-btn");
    const ogText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    const data = {
        product: getProduct(),
        qty: getQty(),
        unit: getUnit(),
        mrp: getMRP(),
        rate: getRate(),
        notes: getNotes(),
        date: getDate(),
        amount: getQty() * getRate(),
        used: false
    };

    try {
        await db.collection("inventory").add(data);
        notyf.success(`${data.product} added!`);
        document.getElementById("inv-form").reset();
        updateSummary();
        renderInventory();
    } catch (err) {
        console.error(err);
        notyf.error("Failed to add product");
    } finally {
        btn.innerText = ogText;
        btn.disabled = false;
    }
  });

  // Handle Update
  document.getElementById("update-inv-btn").addEventListener("click", async () => {
    if (!editingId || !validateForm()) return;
    
    const data = {
        product: getProduct(),
        qty: getQty(),
        unit: getUnit(),
        mrp: getMRP(),
        rate: getRate(),
        notes: getNotes(),
        date: getDate(),
        amount: getQty() * getRate()
    };

    try {
        await db.collection("inventory").doc(editingId).update(data);
        notyf.success("Product updated successfully");
        resetFormState();
        renderInventory();
    } catch(err) {
        notyf.error("Update failed");
    }
  });

  // Cancel Edit
  document.getElementById("cancel-edit-btn").addEventListener("click", resetFormState);

  function resetFormState() {
      editingId = null;
      document.getElementById("inv-form").reset();
      updateSummary();
      document.getElementById("add-inv-btn").classList.remove("hidden");
      document.getElementById("update-inv-btn").classList.add("hidden");
      document.getElementById("cancel-edit-btn").classList.add("hidden");
      document.getElementById("form-header-text").innerText = "Add New Product";
  }

  // Toggle Used Section
  document.getElementById("toggle-used-btn").addEventListener("click", () => {
      const section = document.getElementById("used-products-section");
      const btn = document.getElementById("toggle-used-btn");
      if (section.classList.contains("hidden")) {
          section.classList.remove("hidden");
          btn.textContent = "Hide History";
          section.scrollIntoView({ behavior: 'smooth' });
      } else {
          section.classList.add("hidden");
          btn.textContent = "History";
      }
  });

  // Search
  document.getElementById("search-inv").addEventListener("input", () => renderInventory());

  // Main Render Function
  async function renderInventory() {
    if (!auth?.currentUser) {
      resetInventoryViewForSignedOut();
      showLoading(false);
      return;
    }

    showLoading(true);
    const search = document.getElementById("search-inv").value.trim().toLowerCase();
    
    try {
        const snapshot = await db.collection("inventory").get();
        
        let totalItems = 0;
        let totalValue = 0;
        let lowStock = 0;
        let totalSpent = 0;
        
        let docs = [];
        const monthTotals = {};

        snapshot.forEach(doc => {
            const d = doc.data();
            d._id = doc.id;
            
            const amt = d.amount || (d.qty * d.rate);
            totalSpent += amt;

            if (d.date) {
                const m = d.date.slice(0, 7); // YYYY-MM
                monthTotals[m] = (monthTotals[m] || 0) + amt;
            }

            docs.push(d);
        });

        // Use formatted Currency
        document.getElementById("total-money-spent").innerText = formatCurrency.format(totalSpent);

        docs = docs.filter(d => !search || (d.product && d.product.toLowerCase().includes(search)));
        docs.sort((a, b) => {
            let v1 = a[sortField], v2 = b[sortField];
            if (typeof v1 === 'string') v1 = v1.toLowerCase();
            if (typeof v2 === 'string') v2 = v2.toLowerCase();
            if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
            if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        let html = "";
        let usedHtml = "";
        let activeCount = 0;

        docs.forEach(d => {
            const qty = d.qty || 0;
            const rate = d.rate || 0;
            const amount = d.amount || (qty * rate);

            if (!d.used) {
                activeCount++;
                totalItems++;
                totalValue += amount;
                if (qty < 5) lowStock++;

                const isLow = qty < 5;
                const rowClass = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-50 dark:border-slate-800/50";
                const qtyClass = isLow ? "text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded" : "text-slate-600 dark:text-slate-300";

                // Action buttons are now always visible (opacity-100 instead of opacity-0 group-hover)
                html += `
                <tr class="${rowClass}">
                    <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">${d.product}</td>
                    <td class="px-6 py-4"><span class="${qtyClass}">${qty}</span></td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">${d.unit}</td>
                    <td class="px-6 py-4 text-slate-600 dark:text-slate-400">₹${rate.toFixed(2)}</td>
                    <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">₹${amount.toFixed(2)}</td>
                    <td class="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate">${d.notes || '-'}</td>
                    <td class="px-6 py-4 text-slate-500 text-xs font-medium">${formatDate(d.date)}</td>
                    <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1 opacity-100 transition-opacity">
                        <button class="mark-used-btn p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Mark as Used" data-id="${d._id}">
                            <i data-feather="check" class="w-4 h-4"></i>
                        </button>
                        <button class="edit-btn p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Edit" data-id="${d._id}">
                            <i data-feather="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button class="delete-btn p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete" data-id="${d._id}">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    </td>
                </tr>
                `;
            } else {
                usedHtml += `
                <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <td class="px-6 py-3">${d.product}</td>
                    <td class="px-6 py-3">${qty} ${d.unit}</td>
                    <td class="px-6 py-3">${formatCurrency.format(amount)}</td>
                    <td class="px-6 py-3 text-xs">${formatDate(d.date)}</td>
                </tr>
                `;
            }
        });

        const emptyStateHTML = `
            <tr><td colspan="8">
                <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3 border border-slate-100 dark:border-slate-700">
                    <i data-feather="box" class="w-8 h-8 opacity-40"></i>
                </div>
                <p class="text-sm font-medium">Stock is empty.</p>
                </div>
            </td></tr>`;

        document.getElementById("inventory-list").innerHTML = html || emptyStateHTML;
        document.getElementById("used-products-list").innerHTML = usedHtml || `<tr><td colspan="4" class="p-6 text-center text-slate-400 text-xs italic">No usage history yet.</td></tr>`;
        
        document.getElementById("inv-total-items").innerText = totalItems;
        // Use formatted Currency
        document.getElementById("inv-value").innerText = formatCurrency.format(totalValue);
        document.getElementById("inv-low-stock").innerText = lowStock;
        document.getElementById("table-count-badge").innerText = activeCount;

        if (window.feather) window.feather.replace();

        attachRowEvents();
        drawChart(monthTotals);

    } catch (e) {
        console.error(e);
        notyf.error("Failed to load inventory");
    } finally {
        showLoading(false);
    }
  }

  function attachRowEvents() {
      document.querySelectorAll(".mark-used-btn").forEach(btn => {
          btn.onclick = async () => {
              if(confirm("Mark this product as used/empty?")) {
                  const id = btn.dataset.id;
                  await db.collection("inventory").doc(id).update({ used: true, qty: 0 });
                  notyf.success("Marked as used");
                  renderInventory();
              }
          };
      });

      document.querySelectorAll(".edit-btn").forEach(btn => {
          btn.onclick = async () => {
              const id = btn.dataset.id;
              const doc = await db.collection("inventory").doc(id).get();
              const d = doc.data();
              
              document.getElementById("inv-product").value = d.product;
              document.getElementById("inv-qty").value = d.qty;
              document.getElementById("inv-unit").value = d.unit;
              document.getElementById("inv-mrp").value = d.mrp;
              document.getElementById("inv-rate").value = d.rate;
              document.getElementById("inv-notes").value = d.notes || "";
              document.getElementById("inv-date").value = d.date || "";
              updateSummary();

              editingId = id;
              document.getElementById("form-header-text").innerText = "Edit Product";
              document.getElementById("add-inv-btn").classList.add("hidden");
              document.getElementById("update-inv-btn").classList.remove("hidden");
              document.getElementById("cancel-edit-btn").classList.remove("hidden");
              document.getElementById("inv-product").focus();
              document.getElementById("inventory").scrollIntoView({ behavior: 'smooth' });
          };
      });

      document.querySelectorAll(".delete-btn").forEach(btn => {
          btn.onclick = async () => {
              if(confirm("Permanently delete this item?")) {
                  await db.collection("inventory").doc(btn.dataset.id).delete();
                  notyf.success("Item deleted");
                  renderInventory();
              }
          };
      });

      document.querySelectorAll(".sort-header").forEach(th => {
          th.onclick = () => {
              const field = th.dataset.field;
              if (sortField === field) sortDir = sortDir === "asc" ? "desc" : "asc";
              else { sortField = field; sortDir = "asc"; }
              renderInventory();
          };
      });
  }

  function drawChart(monthTotals) {
      const ctx = document.getElementById('moneySpentChart');
      if(!ctx) return;
      
      const months = Object.keys(monthTotals).sort();
      const labels = months.map(m => {
          const [y, mo] = m.split('-');
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${monthNames[parseInt(mo, 10) - 1]} '${y.slice(2)}`;
      });
      const data = months.map(m => monthTotals[m]);

      const isDark = document.documentElement.classList.contains('dark');
      const barColor = isDark ? '#3b82f6' : '#1e293b'; 
      const gridColor = isDark ? '#334155' : '#e2e8f0';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      if (chartInstance) chartInstance.destroy();
      
      chartInstance = new window.Chart(ctx, {
          type: 'bar',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Spent (₹)',
                  data: data,
                  backgroundColor: barColor,
                  borderRadius: 6,
                  barThickness: 30,
                  hoverBackgroundColor: '#2563eb'
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                  legend: { display: false },
                  datalabels: {
                      anchor: 'end',
                      align: 'top',
                      formatter: (value) => '₹' + value,
                      color: textColor,
                      font: { weight: 'bold', size: 11 }
                  }
              },
              layout: {
                  padding: { top: 25 }
              },
              scales: {
                  y: { 
                      beginAtZero: true, 
                      grid: { color: gridColor, drawBorder: false },
                      ticks: { color: textColor, callback: (val) => '₹' + val }
                  },
                  x: { 
                      grid: { display: false },
                      ticks: { color: textColor }
                  }
              }
          }
      });
  }

  // Initial load
  if (auth?.onAuthStateChanged) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        renderInventory();
      } else {
        resetInventoryViewForSignedOut();
      }
    });
  } else {
    renderInventory();
  }
});
