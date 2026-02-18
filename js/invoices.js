// js/invoices.js

// ===============================
// INVOICE GENERATOR APP MAIN FILE
// ===============================

document.addEventListener("DOMContentLoaded", () => {
// 1. RENDER INVOICE GENERATOR UI
  // ------------------------------
  const invoicePrintArea = document.getElementById("invoicePrintArea");
  if (invoicePrintArea) {
    invoicePrintArea.innerHTML = `
      <div id="invoice-loading" class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-md hidden transition-opacity duration-300">
        <div class="relative w-16 h-16 mb-4">
           <div class="absolute inset-0 bg-rose-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <img src="assets/Flowr Logo.png" class="relative w-full h-full rounded-full animate-breath shadow-lg">
        </div>
        <p class="text-sm text-slate-500 font-semibold animate-pulse tracking-wide">Syncing Invoices...</p>
      </div>

      <section class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto transition-colors duration-300">
        
        <div id="actualInvoicePaper" class="bg-white text-slate-900 p-8 rounded-lg shadow-md border border-slate-200 mx-auto relative" style="max-width: 800px; min-height: 800px; display: flex; flex-direction: column;">
            
            <header class="flex justify-between items-start mb-6 bg-rose-50 p-6 rounded-xl border border-rose-100 print:bg-rose-50 print:p-6 print:rounded-xl print:border-rose-100">
                <div class="flex items-start gap-4">
                    <img src="assets/Invoice Logo.png" class="w-16 h-16 object-contain drop-shadow-sm" alt="Logo">
                    
                    <div>
                        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Lush Patisserie</h1>
                        <p class="text-sm text-slate-500 mt-1 font-medium">Wow By Urban Tree, Medavakkam<br>Chennai, 600100<br>Phone: +91 877 896 7179</p>
                    </div>
                </div>
                <div class="text-right pt-2">
                    <h2 class="text-4xl font-black text-rose-500 uppercase tracking-widest select-none">Invoice</h2>
                </div>
            </header>

            <div class="flex flex-col lg:flex-row print:flex-row justify-between gap-8 mb-8 px-2">
                <div class="w-full md:w-5/12 space-y-3">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Details</label>
                    <div class="grid grid-cols-1 gap-2">
                        <input type="text" id="invoiceNumber" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-rose-400 outline-none transition" placeholder="INV-2025-001">
                        <div class="flex gap-2">
                            <div class="w-1/2">
                                <span class="text-[10px] text-slate-400 uppercase font-bold">Date</span>
                                <input type="date" id="invoiceDate" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-400 outline-none">
                            </div>
                            <div class="w-1/2">
                                <span class="text-[10px] text-slate-400 uppercase font-bold">Due</span>
                                <input type="date" id="dueDate" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-400 outline-none">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-6/12 space-y-3">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Bill To</label>
                    <input type="text" id="clientName" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-rose-400 outline-none transition" placeholder="Client Name">
                    <textarea id="clientAddress" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 resize-none focus:ring-2 focus:ring-rose-400 outline-none transition" rows="2" placeholder="Address"></textarea>
                    <div class="flex gap-2">
                        <input type="text" id="clientPhone" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:ring-2 focus:ring-rose-400 outline-none" placeholder="Phone">
                        <input type="email" id="clientEmail" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:ring-2 focus:ring-rose-400 outline-none" placeholder="Email">
                    </div>
                </div>
            </div>

            <table class="w-full text-sm mb-6 flex-grow-0">
                <thead class="bg-slate-100 text-slate-600 border-y border-slate-200">
                    <tr>
                    <th class="py-3 px-4 text-left font-semibold w-1/2">Item Description</th>
                    <th class="py-3 px-2 text-center font-semibold w-20">Qty</th>
                    <th class="py-3 px-2 text-center font-semibold w-24">Price</th>
                    <th class="py-3 px-4 text-right font-semibold w-24">Amount</th>
                    <th class="py-3 px-2 w-10 print:hidden png-hide"></th>
                    </tr>
                </thead>
                <tbody id="invoiceItems" class="divide-y divide-slate-100"></tbody>
            </table>

            <button id="addItemBtn" class="mb-8 flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600 px-4 py-2 rounded hover:bg-rose-50 transition print:hidden png-hide w-max mx-auto md:mx-0">
                <i data-feather="plus-circle" class="w-4 h-4"></i> Add Line Item
            </button>

            <div class="flex flex-col md:flex-row justify-between gap-8 mb-8">
                <div class="w-full md:w-2/3">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Terms</label>
                    <textarea id="invoiceNotes" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 resize-none h-24 focus:ring-2 focus:ring-rose-400 outline-none" placeholder="Payment is due within 7 days."></textarea>
                </div>
                <div class="w-full md:w-1/3 flex flex-col justify-end">
                    <div class="flex justify-between text-sm text-slate-500 mb-2 px-2">
                        <span>Subtotal</span>
                        <span id="subtotal" class="font-mono">₹0.00</span>
                    </div>
                    <div class="flex justify-between items-center bg-rose-50 p-4 rounded-xl border border-rose-100 print:bg-rose-50 print:border-rose-100">
                        <span class="text-base font-bold text-rose-900">Total</span>
                        <span id="total" class="text-xl font-bold text-rose-900 font-mono">₹0.00</span>
                    </div>
                </div>
            </div>

            <div class="flex-grow"></div>

            <div class="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center text-center print:block avoid-break">
                <p class="font-dancing text-4xl text-slate-800 mb-1 transform -rotate-2 origin-center" style="font-family: 'Whisper', cursive;">Vaishnavi Karthick</p>
                <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Owner</p>
                <p class="text-sm italic text-slate-500 font-medium">Thank you for your business! ❤️</p>
            </div>

        </div>
      </section>

      <section id="invoiceActionsSection" class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto my-6 print:hidden png-hide">
        <div class="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <button id="newInvoiceBtn" class="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-6 py-3 rounded-xl font-medium transition">
             <i data-feather="file-plus" class="w-4 h-4"></i> New
          </button>
          <button id="saveInvoiceBtn" class="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-rose-200 dark:shadow-none">
             <i data-feather="save" class="w-4 h-4"></i> Save Invoice
          </button>
          <div class="w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          <button id="downloadPngBtn" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition">
             <i data-feather="image" class="w-4 h-4"></i> PNG
          </button>
          <button id="printInvoiceBtn" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-600 dark:hover:bg-slate-500 px-6 py-3 rounded-xl font-medium transition">
             <i data-feather="printer" class="w-4 h-4"></i> Print/PDF
          </button>
        </div>
      </section>

      <section id="allInvoicesSection" class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto mt-10 print:hidden">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <i data-feather="list" class="w-5 h-5 text-rose-500"></i> Invoice History
            </h2>
            
            <div id="invoiceControlsRow" class="flex flex-wrap gap-2 w-full md:w-auto md:items-center">
                <div class="relative flex items-center h-10 min-w-[280px] bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl text-slate-100 shadow-sm">
                    <button id="prevMonthBtn" type="button" class="h-full px-4 flex items-center justify-center text-slate-300 hover:text-white transition focus:ring-2 focus:ring-rose-500 outline-none rounded-l-xl" aria-label="Previous month">
                        <i data-feather="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <button id="monthPickerTrigger" type="button" class="flex-1 h-full flex items-center justify-center gap-2 px-2 text-xs sm:text-sm font-semibold tracking-[0.12em] uppercase text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none" aria-label="Choose month">
                        <span id="filterMonthLabel">---</span>
                        <i data-feather="calendar" class="w-4 h-4 text-slate-300"></i>
                    </button>
                    <button id="nextMonthBtn" type="button" class="h-full px-4 flex items-center justify-center text-slate-300 hover:text-white transition focus:ring-2 focus:ring-rose-500 outline-none rounded-r-xl" aria-label="Next month">
                        <i data-feather="chevron-right" class="w-4 h-4"></i>
                    </button>
                    <input type="month" id="filterMonthYear" class="absolute opacity-0 pointer-events-none w-0 h-0" tabindex="-1" aria-hidden="true" />
                </div>
                
                <input type="text" id="invoiceSearchBox" class="p-2 w-full md:w-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Search..." />
            </div>
        </div>

        <div id="pendingInvoicesCard" class="mb-6 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800/50 text-sm hidden">
            <div class="flex items-center justify-between text-orange-800 dark:text-orange-200">
                <div class="flex items-center gap-2">
                    <i data-feather="alert-circle" class="w-4 h-4"></i>
                    <span><strong>Pending:</strong> <span id="pendingCount">0</span> unbilled logs found.</span>
                </div>
                <button id="openPendingList" class="px-3 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-700 dark:text-orange-100 rounded-lg font-medium text-xs transition">Review</button>
            </div>
            <div id="pendingList" class="mt-3 hidden space-y-2"></div>
        </div>

        <div id="invoicesList" class="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl min-h-[200px]"></div>
      </section>
    `;
    
    // Initialize icons immediately after rendering
    if (window.feather) feather.replace();
  }

  const notyf = new Notyf({
    duration: 2500,
    position: { x: 'center', y: 'top' },
    ripple: true,
    types: [
      { type: 'success', background: '#10B981', icon: false }, 
      { type: 'error', background: '#EF4444', icon: false }    
    ]
  });

  // Re-run prefill when arriving via hash navigation
  window.addEventListener("hashchange", () => {
    if (window.location.hash.startsWith("#invoicePrintArea")) {
      setTimeout(() => {
        if (typeof window.prefillInvoiceFromDailyLog === "function") {
          window.prefillInvoiceFromDailyLog();
        }
      }, 100);
    }
  });

// 1A. CSS STYLES (Print, Helper & Fonts)
  // ---------------------------------------
  const style = document.createElement("style");
  style.innerHTML = `
    /* Import Signature Font (Whisper) */
    @import url('https://fonts.googleapis.com/css2?family=Whisper&display=swap');

    /* --- PRINT OPTIMIZATIONS (COMPACT & NUCLEAR) --- */
    @media print {
      @page { margin: 5mm; size: A4 portrait; }

      /* 1. RESET & HIDE EVERYTHING */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        height: 100%;
        width: 100%;
      }
      body * { visibility: hidden; }

      /* 2. SHOW ONLY INVOICE AREA */
      #invoicePrintArea, #invoicePrintArea * { visibility: visible; }

      /* 3. POSITIONING */
      #invoicePrintArea {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
      }

      /* 4. REMOVE DARK MODE / WRAPPERS */
      #invoicePrintArea section {
        background-color: white !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }

      /* 5. PAPER LAYOUT */
      #actualInvoicePaper {
        width: 100% !important;
        margin: 0 !important;
        padding: 10px 20px !important; /* Reduced padding for print */
        border: none !important;
        box-shadow: none !important;
      }

      /* --- CRITICAL SPACING REDUCTIONS FOR PRINT --- */
      
      /* Updated to target the new header class (mb-6) */
      #actualInvoicePaper header { margin-bottom: 10px !important; }
      
      /* Reduce gap between sections */
      #actualInvoicePaper .mb-8, 
      #actualInvoicePaper .mb-6 { 
        margin-bottom: 10px !important; 
      }
      
      /* Collapse empty textareas */
      textarea { height: auto !important; min-height: 0 !important; }

      /* Tighten footer spacing */
      #actualInvoicePaper .mt-8 { margin-top: 10px !important; padding-top: 10px !important; }
      
      /* Disable the 'spacer' so footer snaps up */
      .flex-grow { display: none !important; }

      /* Hide buttons */
      .print\\:hidden, .png-hide { display: none !important; }
      
      /* Prevent signature page break */
      .avoid-break { break-inside: avoid; page-break-inside: avoid; }
      
      /* Force background graphics (for the Pink Header) */
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    /* --------------------------- */

    /* SIGNATURE FONT CLASS */
    .font-signature {
      font-family: 'Whisper', cursive;
      font-weight: 400;
    }
    
    /* UI HELPER STYLES */
    .autocomplete-dropdown {
      box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    #invoiceItems textarea.item-name {
      min-height: 2.5em;
      background: transparent;
      resize: none;
      overflow: hidden;
      line-height: 1.4;
    }
    #invoiceItems input:focus, #invoiceItems textarea:focus {
        background-color: #f8fafc; 
    }
  `;
  document.head.appendChild(style);

  // 2. ADD/REMOVE INVOICE ITEMS
  // ---------------------------
  const db = firebase.firestore();

  // Loader Helper
  function showLoading(show = true) {
    const loader = document.getElementById("invoice-loading");
    if (show) loader.classList.remove("hidden");
    else loader.classList.add("hidden");
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return "-";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return dateStr;
    const dt = new Date(year, month - 1, day);
    if (Number.isNaN(dt.getTime())) return dateStr;
    const dayStr = String(dt.getDate()).padStart(2, "0");
    const monthStr = dt.toLocaleString("en-US", { month: "short" });
    return `${dayStr}-${monthStr}-${dt.getFullYear()}`;
  }

  // --- HELPER: INCREMENT INVOICE NUMBER ---
  // Handles logic like LP-60 -> LP-61
  function incrementInvoiceNumber(lastInvoiceNo) {
    // Regex looks for "Letters-Numbers" (e.g., LP-60 or LP 60)
    const match = lastInvoiceNo.match(/^([A-Za-z]+)[- ]?(\d+)$/);
    if (!match) return ""; 
    
    const prefix = match[1];
    const separator = lastInvoiceNo.includes("-") ? "-" : " "; // Maintain separator style
    const num = parseInt(match[2], 10) + 1;
    
    // Pad with leading zero if the previous one had it (e.g. 09 -> 10)
    const padding = match[2].length; 
    return `${prefix}${separator}${String(num).padStart(padding, "0")}`;
  }

  // --- HELPER: ASYNC FETCH NEXT NUMBER ---
  // Shared logic for both Manual Typing and Auto-Prefill
  async function fetchNextInvoiceNumForClient(clientName) {
    try {
      const invoiceSnap = await db.collection("invoices")
        .where("client.name", "==", clientName)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      
      if (!invoiceSnap.empty) {
        const lastInvoice = invoiceSnap.docs[0].data();
        const nextNum = incrementInvoiceNumber(lastInvoice.invoiceNumber || "");
        return nextNum;
      } else {
        // Logic for brand new client (first invoice)
        // Generates "LP-01" based on first letter of client name + P
        const prefix = clientName.trim().charAt(0).toUpperCase() + "P"; // e.g. "LP"
        return `${prefix}-01`;
      }
    } catch (err) {
      console.error("Error fetching next invoice number:", err);
      return null;
    }
  }

  // --- CLIENT AUTOFILL & AUTO-NUMBER LOGIC ---
  document.getElementById("clientName").addEventListener("blur", async function() {
    const clientName = this.value.trim();
    if (!clientName) return;

    // 1. Autofill Address/Phone (Existing Logic)
    try {
      const clientSnap = await db.collection("clients").where("name", "==", clientName).limit(1).get();
      if (!clientSnap.empty) {
        const clientDoc = clientSnap.docs[0].data();
        document.getElementById("clientAddress").value = clientDoc.address || "";
        document.getElementById("clientPhone").value = clientDoc.phone || "";
        document.getElementById("clientEmail").value = clientDoc.email || "";
      }
    } catch (err) { console.error(err); }

    // 2. Fetch Next Invoice # (New Logic)
    // Only fill if the box is currently empty to avoid overwriting user manual input
    const currentInvVal = document.getElementById("invoiceNumber").value;
    if(!currentInvVal) {
        const nextNum = await fetchNextInvoiceNumForClient(clientName);
        if(nextNum) document.getElementById("invoiceNumber").value = nextNum;
    }
  });

  const itemsBody = document.getElementById("invoiceItems");

  function addRow(item = {}) {
    const row = document.createElement("tr");
    row.className = "group hover:bg-slate-50 transition-colors";
    row.innerHTML = `
      <td class="p-2 align-top">
        <textarea class="item-name w-full p-1 text-slate-700 font-medium outline-none" placeholder="Item name...">${item.name || ""}</textarea>
      </td>
      <td class="p-2 align-top">
        <input type="number" class="w-full p-1 text-center text-slate-600 outline-none qty bg-transparent" value="${item.qty || 1}">
      </td>
      <td class="p-2 align-top">
        <input type="number" class="w-full p-1 text-center text-slate-600 outline-none price bg-transparent" value="${item.price || 0}">
      </td>
      <td class="p-2 align-top text-right font-mono text-slate-800 font-semibold amount">
        ₹${item.amount || "0.00"}
      </td>
      <td class="p-2 align-middle text-center print:hidden png-hide">
        <button class="deleteBtn text-slate-400 hover:text-red-500 transition"><i data-feather="trash-2" class="w-4 h-4"></i></button>
      </td>
    `;
    
    // Logic
    const qtyInput = row.querySelector(".qty");
    const priceInput = row.querySelector(".price");
    
    [qtyInput, priceInput].forEach(inp => {
        inp.addEventListener("input", updateTotals);
    });

    row.querySelector(".deleteBtn").addEventListener("click", () => {
      row.remove();
      updateTotals();
    });

    // Auto-expand
    const itemTextarea = row.querySelector(".item-name");
    function autoExpand(el) {
      el.style.height = "auto";
      el.style.height = (el.scrollHeight) + "px";
    }
    itemTextarea.addEventListener("input", () => autoExpand(itemTextarea));
    autoExpand(itemTextarea);

    itemsBody.appendChild(row);
    if(window.feather) feather.replace();
    updateTotals();
  }

  document.getElementById("addItemBtn").addEventListener("click", () => addRow());
  addRow(); // Initial row

  // 3. CALCULATE TOTALS
  // -------------------
  function updateTotals() {
    let subtotal = 0;
    itemsBody.querySelectorAll("tr").forEach(row => {
      const qty = parseFloat(row.querySelector(".qty").value) || 0;
      const price = parseFloat(row.querySelector(".price").value) || 0;
      const amt = qty * price;
      subtotal += amt;
      row.querySelector(".amount").textContent = `₹${amt.toFixed(2)}`;
    });
    document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("total").textContent = `₹${subtotal.toFixed(2)}`;
  }

  // 4. SAVE INVOICE (UPDATED: SMART LINKING)
  // ----------------------------------------
  document.addEventListener("click", function(e) {
    if (e.target && e.target.closest("#saveInvoiceBtn")) {
      const btn = document.getElementById("saveInvoiceBtn");
      const originalText = btn.innerHTML;
      
      // Spinner
      btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Saving...`;
      
      const invoiceNumString = document.getElementById("invoiceNumber").value.trim();
      const clientName = document.getElementById("clientName").value.trim();
      const invoiceDate = document.getElementById("invoiceDate").value;

      const invoiceData = {
        invoiceNumber: invoiceNumString,
        invoiceDate: invoiceDate,
        dueDate: document.getElementById("dueDate").value,
        client: {
          name: clientName,
          address: document.getElementById("clientAddress").value.trim(),
          phone: document.getElementById("clientPhone").value.trim(),
          email: document.getElementById("clientEmail").value.trim()
        },
        items: [],
        notes: document.getElementById("invoiceNotes").value.trim(),
        subtotal: document.getElementById("subtotal").textContent,
        total: document.getElementById("total").textContent,
        createdAt: new Date(),
        dailyLogId: window.currentDailyLogIdForInvoice || null
      };

      // Capture Items
      itemsBody.querySelectorAll("tr").forEach(row => {
        invoiceData.items.push({
          name: row.querySelector("textarea.item-name").value,
          qty: parseFloat(row.querySelector(".qty").value) || 0,
          price: parseFloat(row.querySelector(".price").value) || 0,
          amount: row.querySelector(".amount").textContent
        });
      });

      db.collection("invoices").add(invoiceData)
        .then(async (docRef) => {
          notyf.success("Invoice saved!");
          document.getElementById("successSound")?.play();
          
          // --- SMART LINKING LOGIC ---
          // 1. Identify which Daily Log to update
          let logIdToUpdate = invoiceData.dailyLogId;

          // 2. If no direct link exists (manual creation), hunt for an orphan log
          if (!logIdToUpdate) {
            console.log("No specific log linked. Searching for matching daily log...");
            try {
                // Look for: Same Date + Same Client + No Invoice Number
                const orphanSnap = await db.collection("dailyLogs")
                    .where("date", "==", invoiceDate)
                    .where("client", "==", clientName)
                    .limit(1) // Just grab the first matching one
                    .get();

                if (!orphanSnap.empty) {
                    const orphanDoc = orphanSnap.docs[0];
                    const orphanData = orphanDoc.data();
                    
                    // Safety Check: Only claim it if it's truly pending (no invoice #)
                    if (!orphanData.invoiceNumber) {
                       logIdToUpdate = orphanDoc.id;
                       console.log("Found orphan log, linking now:", logIdToUpdate);
                    }
                }
            } catch(err) {
                console.error("Error searching for orphan log:", err);
            }
          }

          // 3. Update the Daily Log (if one was identified)
          if (logIdToUpdate) {
            await db.collection("dailyLogs").doc(logIdToUpdate).update({ 
                invoiceId: docRef.id, 
                invoiceNumber: invoiceNumString // This turns the status GREEN in dailyLog.js
            });
            window.currentDailyLogIdForInvoice = null; // Clear global state
          }
          // ---------------------------
          
          loadAllInvoices();
          resetInvoiceForm();
        })
        .catch(err => {
          console.error(err);
          notyf.error("Failed to save.");
        })
        .finally(() => {
            btn.innerHTML = originalText;
            if(window.feather) feather.replace();
        });
    }
  });

  // 5. DOWNLOAD PNG
  // ---------------
  const setupPngDownload = () => {
    const downloadBtn = document.getElementById("downloadPngBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", function() {
        const node = document.getElementById("actualInvoicePaper");
        const toHide = document.querySelectorAll(".png-hide");
        
        toHide.forEach(el => el.style.visibility = "hidden");
        const originalBorder = node.style.border;
        node.style.border = "none";

        window.domtoimage.toPng(node)
          .then(function(dataUrl) {
            toHide.forEach(el => el.style.visibility = "");
            node.style.border = originalBorder;
            const link = document.createElement('a');
            link.download = `Invoice_${document.getElementById('invoiceNumber').value || 'New'}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch(function(error) {
            toHide.forEach(el => el.style.visibility = "");
            node.style.border = originalBorder;
            console.error('oops, something went wrong!', error);
          });
      });
    }
  };
  
  if (window.domtoimage) setupPngDownload();
  else {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/dom-to-image@2.6.0/src/dom-to-image.min.js";
    s.onload = setupPngDownload;
    document.head.appendChild(s);
  }

  // 6. PRINT
  // --------
  document.addEventListener("click", (e) => {
    if (e.target && e.target.closest("#printInvoiceBtn")) window.print();
  });

  // 7. ALL INVOICES TABLE
  // ---------------------
  let currentPage = 1;
  const invoicesPerPage = 10;
  let filteredInvoices = [];
  let allInvoicesDocs = [];
  let invoicesLoadSeq = 0;
  let activeSort = { key: "invoiceDate", dir: "desc" };

  function defaultDirForSortKey(key) {
    return key === "clientName" || key === "invoiceNumber" ? "asc" : "desc";
  }

  function toggleInvoiceSort(key) {
    if (activeSort.key === key) {
      activeSort.dir = activeSort.dir === "asc" ? "desc" : "asc";
    } else {
      activeSort = { key, dir: defaultDirForSortKey(key) };
    }
    currentPage = 1;
    sortAndRenderInvoices();
  }

  function setInvoicesListLoadingState(loading) {
    const invoicesList = document.getElementById("invoicesList");
    if (!invoicesList) return;
    if (!invoicesList.dataset.animReady) {
      invoicesList.style.transition = "opacity 220ms ease, transform 220ms ease";
      invoicesList.dataset.animReady = "1";
    }
    if (loading) {
      invoicesList.dataset.loading = "1";
      invoicesList.style.opacity = "0.45";
      invoicesList.style.transform = "translateY(4px)";
      invoicesList.style.pointerEvents = "none";
    } else {
      invoicesList.dataset.loading = "0";
      invoicesList.style.opacity = "1";
      invoicesList.style.transform = "translateY(0)";
      invoicesList.style.pointerEvents = "auto";
    }
  }

  function renderInvoicesTable(docs) {
    const invoicesList = document.getElementById("invoicesList");
    if (!invoicesList) return;

    const sortHeader = (label, key, align = "left") => {
      const isActive = activeSort.key === key;
      const iconName = isActive ? (activeSort.dir === "asc" ? "chevron-up" : "chevron-down") : "chevron-down";
      const justifyClass = align === "right" ? "justify-end w-full" : "justify-start";
      return `
        <th class="p-3 ${align === "right" ? "text-right" : ""}">
          <button type="button" class="sortHeaderBtn inline-flex items-center ${justifyClass} gap-1.5 uppercase tracking-wide text-[11px] font-semibold hover:text-slate-700 dark:hover:text-slate-200 transition" data-sort-key="${key}">
            <span>${label}</span>
            <i data-feather="${iconName}" class="w-3.5 h-3.5 ${isActive ? "text-rose-500" : "text-slate-400 opacity-60"}"></i>
          </button>
        </th>
      `;
    };

    // Filter
    const searchVal = document.getElementById("invoiceSearchBox")?.value?.toLowerCase() || "";
    filteredInvoices = docs.filter(d => 
       (d.invoiceNumber || "").toLowerCase().includes(searchVal) ||
       (d.client?.name || "").toLowerCase().includes(searchVal) ||
       (d.invoiceDate || "").toLowerCase().includes(searchVal)
    );

    // Pagination
    const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const startIdx = (currentPage - 1) * invoicesPerPage;
    const pageDocs = filteredInvoices.slice(startIdx, startIdx + invoicesPerPage);

    let html = `
      <table class="w-full text-sm text-left border-collapse">
        <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
          <tr>
            ${sortHeader("Invoice #", "invoiceNumber")}
            ${sortHeader("Date", "invoiceDate")}
            ${sortHeader("Client", "clientName")}
            ${sortHeader("Total", "total", "right")}
            <th class="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
    `;

    if(pageDocs.length === 0) {
        html += `
          <tr><td colspan="5">
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
               <div class="bg-slate-50 p-4 rounded-full mb-3 dark:bg-slate-800">
                 <i data-feather="file-text" class="w-8 h-8 opacity-50"></i>
               </div>
               <p class="text-sm font-medium">No invoices found.</p>
            </div>
          </td></tr>
        `;
    } else {
        pageDocs.forEach(d => {
        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <td class="p-3 font-medium text-slate-700 dark:text-slate-300">${d.invoiceNumber || "-"}</td>
            <td class="p-3 text-slate-500 dark:text-slate-400">${formatDisplayDate(d.invoiceDate)}</td>
            <td class="p-3 text-slate-600 dark:text-slate-300">${d.client?.name || "-"}</td>
            <td class="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">${d.total || "₹0.00"}</td>
            <td class="p-3 text-center flex justify-center gap-2">
                <button class="viewInvoiceBtn p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition" data-id="${d.id}" title="View"><i data-feather="eye" class="w-4 h-4"></i></button>
                <button class="printInvoiceBtn p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition" data-id="${d.id}" title="Print"><i data-feather="printer" class="w-4 h-4"></i></button>
                <button class="deleteInvoiceBtn p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" data-id="${d.id}" title="Delete"><i data-feather="trash-2" class="w-4 h-4"></i></button>
            </td>
            </tr>
        `;
        });
    }

    html += `</tbody></table>`;
    
    // Pagination Controls
    if (totalPages > 1) {
        html += `
        <div class="flex justify-between items-center p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 text-xs font-medium border rounded bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50">Prev</button>
            <span class="text-xs text-slate-500">Page ${currentPage} of ${totalPages}</span>
            <button id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 text-xs font-medium border rounded bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50">Next</button>
        </div>
        `;
    }

    const shouldAnimateIn = invoicesList.dataset.loading === "1";
    if (shouldAnimateIn) {
      invoicesList.style.opacity = "0";
      invoicesList.style.transform = "translateY(8px)";
    }

    invoicesList.innerHTML = html;
    if (window.feather) feather.replace();

    // Event Listeners
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if(currentPage > 1) { currentPage--; renderInvoicesTable(allInvoicesDocs); }
    });
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        if(currentPage < totalPages) { currentPage++; renderInvoicesTable(allInvoicesDocs); }
    });

    // Actions
    document.querySelectorAll(".viewInvoiceBtn").forEach(btn => btn.addEventListener("click", () => showInvoiceDetails(btn.dataset.id)));
    document.querySelectorAll(".printInvoiceBtn").forEach(btn => btn.addEventListener("click", async () => {
        await showInvoiceDetails(btn.dataset.id);
        setTimeout(() => window.print(), 500);
    }));
    document.querySelectorAll(".deleteInvoiceBtn").forEach(btn => btn.addEventListener("click", async () => {
        if(confirm("Delete this invoice?")) deleteInvoice(btn.dataset.id);
    }));
    document.querySelectorAll(".sortHeaderBtn").forEach(btn => btn.addEventListener("click", () => {
      toggleInvoiceSort(btn.dataset.sortKey);
    }));

    if (shouldAnimateIn) {
      requestAnimationFrame(() => setInvoicesListLoadingState(false));
    }
  }

  function sortAndRenderInvoices() {
    let docs = [...allInvoicesDocs];
    const sortKey = activeSort.key;
    const sortDir = activeSort.dir === "asc" ? 1 : -1;

    docs.sort((a, b) => {
        if (sortKey === "invoiceDate") {
          return ((a.invoiceDate || "").localeCompare(b.invoiceDate || "")) * sortDir;
        }
        if (sortKey === "total") {
          const aTotal = parseFloat((a.total || "0").replace(/[^\d.]/g, ""));
          const bTotal = parseFloat((b.total || "0").replace(/[^\d.]/g, ""));
          return (aTotal - bTotal) * sortDir;
        }
        if (sortKey === "clientName") {
          return ((a.client?.name || "").localeCompare(b.client?.name || "")) * sortDir;
        }
        if (sortKey === "invoiceNumber") {
          return ((a.invoiceNumber || "").localeCompare(b.invoiceNumber || "", undefined, { numeric: true, sensitivity: "base" })) * sortDir;
        }
        return 0;
    });
    renderInvoicesTable(docs);
  }

  async function deleteInvoice(id) {
    try {
        await db.collection("invoices").doc(id).delete();
        notyf.success("Invoice deleted.");
        loadAllInvoices();
    } catch(e) { console.error(e); notyf.error("Error deleting invoice."); }
  }

  // --- LOADING LOGIC ---
  function loadAllInvoices() {
    const list = document.getElementById("invoicesList");
    if(!list) return;
    const loadSeq = ++invoicesLoadSeq;
    setInvoicesListLoadingState(true);

    let query = db.collection("invoices");
    
    // Date Filtering
    let filterMonthYear = document.getElementById("filterMonthYear")?.value;
    if (!filterMonthYear) {
      const now = new Date();
      filterMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if(document.getElementById("filterMonthYear")) document.getElementById("filterMonthYear").value = filterMonthYear;
    }
    const [y, m] = filterMonthYear.split("-");
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-${new Date(y, m, 0).getDate()}`;
    
    query = query.where("invoiceDate", ">=", start).where("invoiceDate", "<=", end);

    query.get().then(snap => {
        if (loadSeq !== invoicesLoadSeq) return;
        allInvoicesDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sortAndRenderInvoices();
    }).catch(err => {
        if (loadSeq !== invoicesLoadSeq) return;
        console.error(err);
    }).finally(() => {
        if (loadSeq !== invoicesLoadSeq) return;
        if (list.dataset.loading === "1") setInvoicesListLoadingState(false);
    });
  }

  // PENDING LOGS LOGIC (Fixed: History Pollution Solved + UNIT PRICE FIX)
  async function loadPendingDailyLogsForMonth(monthStr) {
    const [year, month] = monthStr.split("-");
    const startDate = `${year}-${month}-01`;
    const endDateStr = `${year}-${month}-${new Date(year, month, 0).getDate()}`;

    // 1. Get all logs for this month
    const logsSnap = await db.collection("dailyLogs")
        .where("date", ">=", startDate)
        .where("date", "<=", endDateStr)
        .get();
    
    const logs = logsSnap.docs.map(d => ({id:d.id, ...d.data()}));

    // 2. Filter: Only logs that have NO invoiceNumber are pending
    const pending = logs.filter(l => !l.invoiceNumber || l.invoiceNumber.trim() === "");
    
    const card = document.getElementById("pendingInvoicesCard");
    const countEl = document.getElementById("pendingCount");
    const listEl = document.getElementById("pendingList");
    
    if(pending.length > 0) {
        card?.classList.remove("hidden");
        if(countEl) countEl.textContent = pending.length;
        if(listEl) {
             listEl.innerHTML = pending.map(p => `
                <div class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-orange-100 dark:border-slate-700 shadow-sm">
                    <div>
                        <div class="font-bold text-slate-700 dark:text-slate-200">${p.client}</div>
                        <div class="text-xs text-slate-500">${formatDisplayDate(p.date)} • ₹${p.totalRevenue}</div>
                    </div>
                    <button class="createFromPendingBtn px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition" data-id="${p.id}">Create</button>
                </div>
             `).join("");
             
             // Bind Click
             listEl.querySelectorAll(".createFromPendingBtn").forEach(b => {
                 b.addEventListener("click", async () => {
                    const id = b.dataset.id;
                    const doc = await db.collection("dailyLogs").doc(id).get();
                    if(!doc.exists) return;
                    const d = doc.data();
                    
                    document.getElementById("clientName").value = d.client;
                    document.getElementById("invoiceDate").value = d.date;
                    
                    // Trigger "blur" on client name to auto-fetch address and next invoice #
                    document.getElementById("clientName").dispatchEvent(new Event('blur'));

                    itemsBody.innerHTML = "";
                    // FIXED: Calculate Unit Price (Total Revenue / Qty)
                    (d.items || []).forEach(i => {
                        const qty = i.qty || 1;
                        const totalRevenue = i.revenue || 0;
                        const unitPrice = qty > 0 ? (totalRevenue / qty) : 0;
                        
                        addRow({ 
                            name: i.name, 
                            qty: qty, 
                            price: unitPrice.toFixed(2), 
                            amount: totalRevenue.toFixed(2) 
                        });
                    });
                    
                    window.currentDailyLogIdForInvoice = id;
                    document.getElementById("actualInvoicePaper").scrollIntoView({ behavior: 'smooth' });
                 });
             });
        }
    } else {
        card?.classList.add("hidden");
    }
  }

  // Pending Invoices Toggle
  document.getElementById("openPendingList")?.addEventListener("click", () => {
     document.getElementById("pendingList")?.classList.toggle("hidden");
  });

  document.addEventListener("change", (e) => {
    if(e.target.id === "filterMonthYear") {
        updateMonthLabel(e.target.value);
        loadAllInvoices();
        loadPendingDailyLogsForMonth(e.target.value);
    }
  });

  function updateMonthLabel(monthValue) {
    const label = document.getElementById("filterMonthLabel");
    if (!label) return;
    if (!monthValue) {
      label.textContent = "---";
      return;
    }
    const [year, month] = monthValue.split("-").map(Number);
    const dt = new Date(year, month - 1, 1);
    const monthName = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
    label.textContent = `${monthName}-${year}`;
  }

  function shiftFilterMonth(offset) {
    const monthInput = document.getElementById("filterMonthYear");
    if (!monthInput) return;
    const currentValue = monthInput.value || new Date().toISOString().slice(0, 7);
    const [year, month] = currentValue.split("-").map(Number);
    const nextMonthDate = new Date(year, month - 1 + offset, 1);
    monthInput.value = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
    monthInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  document.getElementById("prevMonthBtn")?.addEventListener("click", () => shiftFilterMonth(-1));
  document.getElementById("nextMonthBtn")?.addEventListener("click", () => shiftFilterMonth(1));
  document.getElementById("monthPickerTrigger")?.addEventListener("click", () => {
    const monthInput = document.getElementById("filterMonthYear");
    if (!monthInput) return;
    if (typeof monthInput.showPicker === "function") {
      monthInput.showPicker();
    } else {
      monthInput.focus();
      monthInput.click();
    }
  });

  // 8. SHOW / RESET
  // ---------------
  async function showInvoiceDetails(id) {
    const doc = await db.collection("invoices").doc(id).get();
    if (!doc.exists) return notyf.error("Invoice not found");
    const d = doc.data();

    document.getElementById("invoiceNumber").value = d.invoiceNumber || "";
    document.getElementById("invoiceDate").value = d.invoiceDate || "";
    document.getElementById("dueDate").value = d.dueDate || "";
    document.getElementById("clientName").value = d.client?.name || "";
    document.getElementById("clientAddress").value = d.client?.address || "";
    document.getElementById("clientPhone").value = d.client?.phone || "";
    document.getElementById("clientEmail").value = d.client?.email || "";
    document.getElementById("invoiceNotes").value = d.notes || "";
    
    itemsBody.innerHTML = "";
    (d.items || []).forEach(item => addRow(item));
    updateTotals();
    
    // Scroll to top
    document.getElementById("actualInvoicePaper").scrollIntoView({behavior: "smooth"});
  }

  function resetInvoiceForm() {
    document.getElementById("invoiceNumber").value = "";
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("invoiceDate").value = today;
    document.getElementById("dueDate").value = today;
    document.getElementById("clientName").value = "";
    document.getElementById("clientAddress").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("clientEmail").value = "";
    document.getElementById("invoiceNotes").value = "";
    itemsBody.innerHTML = "";
    addRow();
    window.currentDailyLogIdForInvoice = null;
  }
  
  document.getElementById("newInvoiceBtn")?.addEventListener("click", resetInvoiceForm);
  document.getElementById("invoiceSearchBox")?.addEventListener("input", () => { currentPage = 1; renderInvoicesTable(allInvoicesDocs); });

  // INITIAL LOAD
  // ------------
  const initMonth = new Date().toISOString().slice(0, 7);
  if(document.getElementById("filterMonthYear")) document.getElementById("filterMonthYear").value = initMonth;
  updateMonthLabel(initMonth);
  resetInvoiceForm(); // Sets dates
  loadAllInvoices();
  loadPendingDailyLogsForMonth(initMonth);


  // --- AUTOCOMPLETE (Styled) ---
  let allClients = [];
  db.collection("clients").get().then(snap => {
     allClients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const clientNameInput = document.getElementById("clientName");
  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown absolute bg-white dark:bg-slate-800 z-50 hidden border border-slate-200 dark:border-slate-700 shadow-lg max-h-48 overflow-y-auto";
  clientNameInput.parentNode.appendChild(dropdown);
  // Ensure parent is relative
  clientNameInput.parentNode.style.position = "relative";

  clientNameInput.addEventListener("input", function() {
    const val = this.value.trim().toLowerCase();
    if (!val) { dropdown.style.display = "none"; return; }
    
    const matches = allClients.filter(c => c.name && c.name.toLowerCase().includes(val));
    if (matches.length === 0) { dropdown.style.display = "none"; return; }
    
    dropdown.innerHTML = matches.map(c => `
      <div class="p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-800 dark:text-slate-200" data-id="${c.id}">
        <strong>${c.name}</strong> <span class="text-xs text-slate-500">${c.contactPerson || ""}</span>
      </div>
    `).join("");
    
    dropdown.style.display = "block";
    dropdown.style.width = "100%";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
  });

  dropdown.addEventListener("mousedown", async (e) => {
      const item = e.target.closest("div[data-id]");
      if(item) {
          const client = allClients.find(c => c.id === item.dataset.id);
          if(client) {
              clientNameInput.value = client.name;
              document.getElementById("clientAddress").value = client.address || "";
              document.getElementById("clientPhone").value = client.phone || "";
              // trigger blur to fetch last invoice
              clientNameInput.dispatchEvent(new Event("blur"));
          }
      }
      dropdown.style.display = "none";
  });
  
  clientNameInput.addEventListener("blur", () => setTimeout(() => dropdown.style.display = "none", 200));

  // --- UPDATED PREFILL FUNCTION (SMART HANDOFF + UNIT PRICE FIX) ---
  // =================================================================
  window.prefillInvoiceFromDailyLog = async function() {
    const prefill = JSON.parse(localStorage.getItem("invoicePrefill") || "{}");
    if (!prefill.dailyLogId) return;

    // Retry if DOM not ready
    if (!document.getElementById("invoiceItems")) { 
      setTimeout(window.prefillInvoiceFromDailyLog, 100); 
      return; 
    }

    // 1. Fill Basic Fields (Client, Date, Notes)
    document.getElementById("clientName").value = prefill.client || "";
    document.getElementById("invoiceDate").value = prefill.date || ""; 
    document.getElementById("invoiceNotes").value = prefill.notes || "";
    
    // 2. TRIGGER ADDRESS LOOKUP
    document.getElementById("clientName").dispatchEvent(new Event('blur'));

    // 3. HANDLE INVOICE NUMBER LOGIC
    const manualInvNum = (prefill.invoiceNumber || "").trim();

    if (manualInvNum) {
        setTimeout(() => {
            document.getElementById("invoiceNumber").value = manualInvNum;
        }, 300);
    } else {
        const nextNum = await fetchNextInvoiceNumForClient(prefill.client);
        if (nextNum) {
             document.getElementById("invoiceNumber").value = nextNum;
        }
    }

    // 4. Fill Items (WITH UNIT PRICE FIX)
    const itemsBody = document.getElementById("invoiceItems");
    itemsBody.innerHTML = "";
    (prefill.items || []).forEach(item => {
         
         // Calculate Unit Price from Total Revenue
         const qty = item.qty || 1;
         const totalRevenue = item.revenue || 0;
         const unitPrice = qty > 0 ? (totalRevenue / qty) : 0;

         addRow({
            name: item.name,
            qty: qty,
            price: unitPrice.toFixed(2),
            amount: totalRevenue.toFixed(2)
        });
    });
    
    // 5. Cleanup
    window.currentDailyLogIdForInvoice = prefill.dailyLogId;
    localStorage.removeItem("invoicePrefill");
    document.getElementById("actualInvoicePaper").scrollIntoView({ behavior: 'smooth' });
 };
});
// End of DOMContentLoaded
