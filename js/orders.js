// js/orders.js

document.addEventListener("DOMContentLoaded", () => {
  const ordersSection = document.getElementById("orders");
  const db = window.db; // Firestore instance

  // Initialize Notyf
  const notyf = new Notyf({
    duration: 3000,
    position: { x: 'right', y: 'top' },
    types: [
      { type: 'success', background: '#2563eb', icon: false }, 
      { type: 'error', background: '#ef4444', icon: false }
    ]
  });

  function getCurrentMonthYear() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  }

  // --- Main Render Function ---
  async function renderOrdersTable(selectedMonthYear = getCurrentMonthYear()) {
    if (!ordersSection) return;

    // AESTHETIC LOADER
    ordersSection.innerHTML = `
      <div class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-md transition-opacity">
        <div class="relative w-16 h-16 mb-4">
           <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <img src="assets/Flowr Logo.png" class="relative w-full h-full rounded-full animate-breath shadow-lg">
        </div>
        <p class="text-sm text-slate-500 font-semibold animate-pulse tracking-wide">Fetching Orders...</p>
      </div>
    `;

    if (!db || typeof db.collection !== "function") {
      ordersSection.innerHTML = `<div class="p-12 text-center text-red-500">Firestore not initialized.</div>`;
      return;
    }

    let ordersSnapshot;
    try {
      ordersSnapshot = await db.collection("orders").get();
    } catch (err) {
      console.error(err);
      notyf.error("Error loading orders.");
      ordersSection.innerHTML = `<div class="p-12 text-center text-red-500">Error loading data.</div>`;
      return;
    }

    const orders = [];
    ordersSnapshot.forEach(doc => {
      const d = doc.data();
      if (!d.date || !d.customer || !d.item) return;
      if (!d.date.startsWith(selectedMonthYear)) return;
      orders.push({ id: doc.id, ...d });
    });

    // Calculate Stats
    const statusCounts = { Received: 0, Baked: 0, Delivered: 0, Cancelled: 0 };
    orders.forEach(o => {
      statusCounts[o.status || "Received"] = (statusCounts[o.status || "Received"] || 0) + 1;
    });

    // --- HTML Construction ---
    
    // 1. Month Picker
    const monthPickerHtml = `
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
        <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                <i data-feather="calendar" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
            </div>
            <span class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Period:</span>
            <input type="month" id="orders-month-filter" value="${selectedMonthYear}" 
              class="p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer" />
        </div>
        <button id="add-order-btn" class="w-full sm:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2">
          <i data-feather="plus" class="w-4 h-4"></i> New Order
        </button>
      </div>
    `;

    // 2. Stats Cards
    const cardClass = "flex-1 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 transition hover:-translate-y-1 hover:shadow-md";
    const labelClass = "text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500";
    const valueClass = "text-3xl font-extrabold text-slate-800 dark:text-white";

    const statsHtml = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="${cardClass}">
          <span class="${labelClass}">Received</span>
          <span class="${valueClass} text-blue-600 dark:text-blue-400">${statusCounts.Received}</span>
        </div>
        <div class="${cardClass}">
          <span class="${labelClass}">Baked</span>
          <span class="${valueClass} text-amber-500">${statusCounts.Baked}</span>
        </div>
        <div class="${cardClass}">
          <span class="${labelClass}">Delivered</span>
          <span class="${valueClass} text-emerald-600 dark:text-emerald-400">${statusCounts.Delivered}</span>
        </div>
        <div class="${cardClass}">
          <span class="${labelClass}">Cancelled</span>
          <span class="${valueClass} text-rose-500">${statusCounts.Cancelled}</span>
        </div>
      </div>
    `;

    // 3. Table Construction
    let tableRows = '';
    
    if (orders.length === 0) {
      tableRows = `
        <tr>
          <td colspan="6" class="p-12 text-center text-slate-400 dark:text-slate-500">
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-full inline-block mb-3">
                <i data-feather="inbox" class="w-8 h-8 opacity-50"></i>
            </div>
            <p class="text-sm font-medium">No orders found for this month.</p>
          </td>
        </tr>`;
    } else {
      orders.sort((a, b) => b.date.localeCompare(a.date)).forEach((order) => {
        // Status Badge Logic
        let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
        if (order.status === "Received") badgeColor = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
        if (order.status === "Baked") badgeColor = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
        if (order.status === "Delivered") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
        if (order.status === "Cancelled") badgeColor = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800";

        tableRows += `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 group">
            <td class="p-4 font-bold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">${formatDate(order.date)}</td>
            <td class="p-4 text-slate-800 dark:text-slate-200 font-medium">${order.customer}</td>
            <td class="p-4 text-slate-600 dark:text-slate-400">
                <span class="font-medium text-slate-800 dark:text-white">${order.item}</span> 
                <span class="ml-1 text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 font-bold">x${order.quantity}</span>
            </td>
            <td class="p-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}">${order.status || "Received"}</span>
            </td>
            <td class="p-4">
               <button class="update-status-btn text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition shadow-sm" 
                 data-id="${order.id}" data-status="${order.status || 'Received'}">Change Status</button>
            </td>
            <td class="p-4 text-right">
               <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button class="show-details-btn p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" data-id="${order.id}"><i data-feather="eye" class="w-4 h-4"></i></button>
                   <button class="delete-order-btn p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" data-id="${order.id}"><i data-feather="trash-2" class="w-4 h-4"></i></button>
               </div>
            </td>
          </tr>
        `;
      });
    }

    const tableHtml = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-4">Date</th>
                <th class="p-4">Customer</th>
                <th class="p-4">Item</th>
                <th class="p-4">Status</th>
                <th class="p-4">Quick Action</th>
                <th class="p-4 text-right">Options</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Combine all parts
    ordersSection.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div class="flex items-center gap-2 mb-2">
             <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Order Management</h2>
          </div>
          ${monthPickerHtml}
          ${statsHtml}
          ${tableHtml}
      </div>
      <div id="order-modal-container"></div>
    `;

    // --- Event Listeners ---
    feather.replace();

    document.getElementById('orders-month-filter').onchange = (e) => {
      renderOrdersTable(e.target.value);
    };

    document.getElementById('add-order-btn').onclick = () => {
      openOrderModal(selectedMonthYear);
    };

    document.querySelectorAll('.update-status-btn').forEach(btn => {
      btn.onclick = () => openStatusModal(btn.dataset.id, btn.dataset.status, selectedMonthYear);
    });

    document.querySelectorAll('.show-details-btn').forEach(btn => {
      btn.onclick = () => openDetailsModal(btn.dataset.id, selectedMonthYear);
    });

    document.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("Delete this order?")) {
          try {
            await db.collection("orders").doc(btn.dataset.id).delete();
            notyf.success("Order deleted");
            renderOrdersTable(selectedMonthYear);
          } catch(e) {
            notyf.error("Could not delete order");
          }
        }
      };
    });
  }

  // --- 5. FIXED MODAL (No Whitespace) ---
  function openOrderModal(selectedMonthYear) {
    const today = new Date().toISOString().split('T')[0];
    
    const modalHtml = `
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform scale-100 transition-all">
          
          <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
               <span class="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600"><i data-feather="plus" class="w-4 h-4"></i></span>
               New Order
             </h3>
             <button id="modal-close-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
               <i data-feather="x" class="w-5 h-5"></i>
             </button>
          </div>

          <form id="add-order-form" class="p-6 space-y-5">
             <div>
               <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Date</label>
               <input type="date" name="date" class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium" required value="${today}">
             </div>

             <div>
               <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Customer Name</label>
               <input type="text" name="customer" class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required placeholder="e.g. John Doe">
             </div>

             <div class="grid grid-cols-12 gap-4">
                 <div class="col-span-8">
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Item</label>
                    <input type="text" name="item" class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required placeholder="e.g. Choco Cake">
                 </div>
                 <div class="col-span-4">
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Qty</label>
                    <input type="number" name="quantity" class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-center font-bold" required min="1" value="1">
                 </div>
             </div>

             <div>
               <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
               <textarea name="notes" rows="2" class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" placeholder="Allergies, special requests..."></textarea>
             </div>

             <div class="flex items-center gap-3 pt-4">
                 <button type="button" id="modal-cancel-btn" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Cancel
                 </button>
                 <button type="submit" class="flex-1 px-4 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition transform active:scale-95">
                    Save Order
                 </button>
             </div>
          </form>
        </div>
      </div>
    `;

    const container = document.getElementById('order-modal-container');
    container.innerHTML = modalHtml;
    feather.replace();

    const closeModal = () => { container.innerHTML = ''; };
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;

    document.getElementById('add-order-form').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      try {
        await window.db.collection("orders").add({
          date: form.date.value,
          customer: form.customer.value.trim(),
          item: form.item.value.trim(),
          quantity: parseInt(form.quantity.value),
          notes: form.notes.value.trim(),
          status: "Received",
          createdAt: new Date()
        });
        notyf.success("Order Created!");
        closeModal();
        renderOrdersTable(form.date.value.slice(0, 7));
      } catch (err) {
        console.error(err);
        notyf.error("Error saving order.");
      }
    };
  }

  // --- Status Update Modal ---
  function openStatusModal(orderId, currentStatus, selectedMonthYear) {
    const statuses = ["Received", "Baked", "Delivered", "Cancelled"];
    const options = statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('');
    
    const modalHtml = `
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
           <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <i data-feather="check-circle" class="w-4 h-4 text-green-500"></i> Update Status
             </h3>
             <button id="status-close-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i data-feather="x" class="w-5 h-5"></i></button>
           </div>
           <form id="status-form" class="p-6">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">New Status</label>
              <div class="relative">
                  <select id="new-status" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white mb-6 appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                    ${options}
                  </select>
                  <div class="absolute inset-y-0 right-0 top-0 bottom-6 flex items-center px-3 pointer-events-none text-slate-500">
                    <i data-feather="chevron-down" class="w-4 h-4"></i>
                  </div>
              </div>
              <button type="submit" class="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition">Save Changes</button>
           </form>
        </div>
      </div>
    `;

    const container = document.getElementById('order-modal-container');
    container.innerHTML = modalHtml;
    feather.replace();

    document.getElementById('status-close-btn').onclick = () => container.innerHTML = '';
    
    document.getElementById('status-form').onsubmit = async (e) => {
      e.preventDefault();
      const newStatus = document.getElementById('new-status').value;
      try {
        await db.collection("orders").doc(orderId).update({ status: newStatus });
        container.innerHTML = '';
        notyf.success("Status Updated");
        renderOrdersTable(selectedMonthYear);
      } catch (err) {
        notyf.error("Update failed");
      }
    };
  }

  // --- Details Modal ---
  async function openDetailsModal(orderId, selectedMonthYear) {
    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) return;
    const o = doc.data();

    const modalHtml = `
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
           <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <i data-feather="file-text" class="w-4 h-4 text-blue-500"></i> Order Details
             </h3>
             <button id="details-close-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i data-feather="x" class="w-5 h-5"></i></button>
           </div>
           <div class="p-6 space-y-4 text-sm">
              <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span class="text-slate-500 font-medium">Date</span>
                  <span class="font-bold text-slate-800 dark:text-white">${formatDate(o.date)}</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span class="text-slate-500 font-medium">Customer</span>
                  <span class="font-bold text-slate-800 dark:text-white">${o.customer}</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span class="text-slate-500 font-medium">Order</span>
                  <span class="font-bold text-slate-800 dark:text-white">${o.item} (x${o.quantity})</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span class="text-slate-500 font-medium">Status</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">${o.status}</span>
              </div>
              <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span class="block text-xs font-bold text-slate-400 uppercase mb-1">NOTES</span>
                  <p class="text-slate-700 dark:text-slate-300 italic">${o.notes || "No notes provided."}</p>
              </div>
           </div>
        </div>
      </div>
    `;
    
    const container = document.getElementById('order-modal-container');
    container.innerHTML = modalHtml;
    feather.replace();
    document.getElementById('details-close-btn').onclick = () => container.innerHTML = '';
  }

  window.renderOrdersTable = renderOrdersTable;
});