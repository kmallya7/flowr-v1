// js/clients.js

window.renderClientsSection = function () {
  const clientsSection = document.getElementById("clients");
  if (!clientsSection) return;

  clientsSection.innerHTML = `
    <div class="space-y-6 max-w-7xl mx-auto pb-8 animate-fade-in">
      <section class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-7">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                <i data-feather="users" class="w-5 h-5"></i>
              </span>
              Clients
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage prospects, active clients, and lifecycle updates from one place.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="show-add-prospect-form" class="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-2">
              <i data-feather="user-plus" class="w-4 h-4"></i> Add Prospect
            </button>
            <button id="show-add-client-form" class="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition inline-flex items-center gap-2">
              <i data-feather="plus" class="w-4 h-4"></i> Add Client
            </button>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Clients</p>
            <i data-feather="users" class="w-4 h-4 text-blue-500"></i>
          </div>
          <p id="kpi-total-clients" class="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
        </article>
        <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">New This Month</p>
            <i data-feather="user-check" class="w-4 h-4 text-emerald-500"></i>
          </div>
          <p id="kpi-new-clients" class="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
        </article>
        <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pipeline</p>
            <i data-feather="filter" class="w-4 h-4 text-amber-500"></i>
          </div>
          <p id="kpi-pipeline" class="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
        </article>
        <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Converted</p>
            <i data-feather="check-circle" class="w-4 h-4 text-purple-500"></i>
          </div>
          <p id="kpi-converted" class="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
        </article>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="xl:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Pipeline (Prospects)</h3>
          <div id="pipeline-list" class="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[230px]"></div>
        </article>

        <article class="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Client Directory</h3>
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>View:</span>
              <button type="button" class="client-filter-btn px-2.5 py-1.5 rounded-lg border tone-success" data-status="Active">Active</button>
              <button type="button" class="client-filter-btn px-2.5 py-1.5 rounded-lg border tone-neutral" data-status="Lost">Lost</button>
            </div>
          </div>

          <div class="flex flex-col md:flex-row gap-2 mb-4">
            <div class="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/50 transition overflow-hidden group">
              <span class="pl-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <i data-feather="search" class="w-4 h-4"></i>
              </span>
              <input id="client-search" type="text" placeholder="Search name, person, phone, address" class="w-full px-3 py-2.5 bg-transparent border-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-0" />
              <button id="clear-search" type="button" class="hidden mr-2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700" aria-label="Clear search">
                <i data-feather="x" class="w-4 h-4"></i>
              </button>
            </div>
            <div id="client-results-meta" class="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 whitespace-nowrap">
              0 results
            </div>
          </div>

          <div id="client-list" class="rounded-xl border border-slate-100 dark:border-slate-800 min-h-[300px] overflow-hidden"></div>
          <div id="pagination" class="flex justify-center items-center gap-2 mt-5"></div>
        </article>
      </section>
    </div>

    <div id="client-form-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center hidden p-4 transition-opacity">
      <form id="client-form" class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 w-full max-w-2xl relative transform transition-all scale-100 max-h-[92vh] overflow-y-auto">
        <button type="button" id="client-cancel-btn" class="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition">
          <i data-feather="x" class="w-5 h-5"></i>
        </button>

        <h3 class="text-xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <i data-feather="edit-3" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
          </div>
          <span id="client-form-title">Add Client</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Client Name *</label>
            <input type="text" id="client-name" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-medium" required placeholder="e.g. Acme Corp" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Contact Person</label>
            <input type="text" id="client-contact-person" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="John Doe" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
            <input type="text" id="client-phone" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="+91..." />
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Address</label>
            <input type="text" id="client-address" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="Full address" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Invoice Prefix</label>
            <input type="text" id="client-invoice-prefix" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-semibold" placeholder="e.g. LP" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Next Invoice #</label>
            <input type="number" id="client-invoice-next-seq" min="1" step="1" value="1" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-semibold" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
            <div class="relative">
              <select id="client-status" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none font-medium">
                <option value="Prospect">Prospect</option>
                <option value="Active">Active</option>
                <option value="Lost">Lost</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <i data-feather="chevron-down" class="w-4 h-4"></i>
              </div>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea id="client-notes" rows="3" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none" placeholder="Additional details..."></textarea>
          </div>
        </div>

        <button type="submit" id="client-submit-btn" class="mt-7 w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg hover:shadow-xl">
          <span id="client-submit-label">Add Client</span>
        </button>
      </form>
    </div>

    <div id="client-confirm-modal" class="fixed inset-0 z-[80] hidden bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <h4 id="client-confirm-title" class="text-lg font-bold text-slate-900 dark:text-white">Confirm action</h4>
        <p id="client-confirm-message" class="mt-2 text-sm text-slate-500 dark:text-slate-400">Are you sure?</p>
        <div class="mt-5 flex items-center justify-end gap-2">
          <button id="client-confirm-cancel" type="button" class="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button id="client-confirm-submit" type="button" class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>

    <div id="clients-fallback-toast" class="fixed top-5 right-5 z-[90] hidden">
      <div id="clients-fallback-toast-card" class="px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"></div>
    </div>
  `;

  if (window.feather) window.feather.replace();

  const db = window.db;
  let editingClientId = null;
  let editingMode = "client";
  let searchTerm = "";
  let statusFilter = "Active";
  let currentPage = 1;
  const pageSize = 10;

  const addBtn = document.getElementById("show-add-client-form");
  const addProspectBtn = document.getElementById("show-add-prospect-form");
  const overlay = document.getElementById("client-form-overlay");
  const form = document.getElementById("client-form");
  const submitBtn = document.getElementById("client-submit-btn");
  const cancelBtn = document.getElementById("client-cancel-btn");
  const formTitle = document.getElementById("client-form-title");
  const submitLabel = document.getElementById("client-submit-label");
  const searchInput = document.getElementById("client-search");
  const clearSearchBtn = document.getElementById("clear-search");
  const pagination = document.getElementById("pagination");
  const resultsMeta = document.getElementById("client-results-meta");

  const confirmModal = document.getElementById("client-confirm-modal");
  const confirmTitle = document.getElementById("client-confirm-title");
  const confirmMessage = document.getElementById("client-confirm-message");
  const confirmCancelBtn = document.getElementById("client-confirm-cancel");
  const confirmSubmitBtn = document.getElementById("client-confirm-submit");

  let pendingConfirmAction = null;
  let fallbackToastTimeout = null;

  setActiveFilter(statusFilter);

  addBtn.addEventListener("click", () => openForm("client"));
  addProspectBtn.addEventListener("click", () => openForm("prospect"));
  cancelBtn.addEventListener("click", closeOverlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  if (window.__clientsEscHandler) {
    document.removeEventListener("keydown", window.__clientsEscHandler);
  }
  window.__clientsEscHandler = (e) => {
    if (e.key !== "Escape") return;
    if (!overlay.classList.contains("hidden")) closeOverlay();
    if (!confirmModal.classList.contains("hidden")) closeConfirmModal();
  };
  document.addEventListener("keydown", window.__clientsEscHandler);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("client-name").value.trim();
    const contactPerson = document.getElementById("client-contact-person").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const address = document.getElementById("client-address").value.trim();
    const status = document.getElementById("client-status").value;
    const notes = document.getElementById("client-notes").value.trim();
    const invoicePrefix = document.getElementById("client-invoice-prefix").value.trim();
    const nextSeqRaw = parseInt(document.getElementById("client-invoice-next-seq").value, 10);
    const invoiceNextSequence = Number.isFinite(nextSeqRaw) && nextSeqRaw > 0 ? nextSeqRaw : 1;

    if (!name) {
      showToast("Client name is required.", "error");
      return;
    }

    setSubmitState(true);

    try {
      if (editingClientId) {
        await db.collection("clients").doc(editingClientId).update({
          name,
          contactPerson,
          phone,
          address,
          status,
          notes,
          invoicePrefix,
          invoiceNextSequence,
        });
        showToast("Client updated.", "success");
      } else {
        await db.collection("clients").add({
          name,
          contactPerson,
          phone,
          address,
          status,
          notes,
          invoicePrefix,
          invoiceNextSequence,
          createdAt: new Date(),
        });
        showToast(editingMode === "prospect" ? "Prospect added." : "Client added.", "success");
      }

      closeOverlay();
      await loadClients();
    } catch (err) {
      console.error(err);
      showToast("Error saving client.", "error");
    } finally {
      setSubmitState(false);
    }
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    clearSearchBtn.classList.toggle("hidden", !searchTerm);
    currentPage = 1;
    loadClients();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchTerm = "";
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    currentPage = 1;
    loadClients();
  });

  document.querySelectorAll(".client-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      statusFilter = btn.dataset.status;
      setActiveFilter(statusFilter);
      currentPage = 1;
      loadClients();
    });
  });

  confirmCancelBtn.addEventListener("click", closeConfirmModal);
  confirmModal.addEventListener("click", (e) => {
    if (e.target.id === "client-confirm-modal") closeConfirmModal();
  });

  confirmSubmitBtn.addEventListener("click", async () => {
    if (typeof pendingConfirmAction === "function") await pendingConfirmAction();
    closeConfirmModal();
  });

  function openForm(mode) {
    form.reset();
    overlay.classList.remove("hidden");
    editingClientId = null;
    editingMode = mode;

    const isProspect = mode === "prospect";
    formTitle.textContent = isProspect ? "Add Prospect" : "Add Client";
    submitLabel.textContent = isProspect ? "Add Prospect" : "Add Client";

    document.getElementById("client-status").value = isProspect ? "Prospect" : "Active";
    document.getElementById("client-invoice-next-seq").value = "1";

    const nameInput = document.getElementById("client-name");
    if (nameInput) setTimeout(() => nameInput.focus(), 0);
  }

  function closeOverlay() {
    overlay.classList.add("hidden");
    form.reset();
    editingClientId = null;
    editingMode = "client";
    setSubmitState(false);
  }

  function setSubmitState(isSaving) {
    if (!submitBtn) return;
    submitBtn.disabled = isSaving;
    submitBtn.classList.toggle("opacity-70", isSaving);
    submitBtn.classList.toggle("cursor-not-allowed", isSaving);
    submitLabel.textContent = isSaving ? "Saving..." : editingClientId ? "Update Client" : editingMode === "prospect" ? "Add Prospect" : "Add Client";
  }

  function setActiveFilter(selected) {
    document.querySelectorAll(".client-filter-btn").forEach((btn) => {
      const isSelected = btn.dataset.status === selected;
      btn.classList.remove("tone-success", "tone-neutral");
      btn.classList.add(isSelected ? "tone-success" : "tone-neutral");
      btn.setAttribute("aria-pressed", String(isSelected));
    });
  }

  async function loadClients() {
    const list = document.getElementById("client-list");
    const pipelineList = document.getElementById("pipeline-list");

    list.innerHTML = loadingState("Loading clients...");
    pipelineList.innerHTML = loadingState("Loading pipeline...");

    try {
      const snapshot = await db.collection("clients").orderBy("createdAt", "desc").get();
      const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filteredClients = filterClients(clients);

      updateKpis(filteredClients);
      renderPipeline(filteredClients.filter((c) => c.status === "Prospect"));
      renderMainList(filteredClients);
    } catch (err) {
      console.error(err);
      list.innerHTML = errorState("Could not load clients.");
      pipelineList.innerHTML = errorState("Could not load pipeline.");
      pagination.innerHTML = "";
      showToast("Failed to load clients.", "error");
    }

    if (window.feather) window.feather.replace();
    bindActionButtons();
  }

  function filterClients(allClients) {
    if (!searchTerm) return allClients;

    return allClients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const person = (c.contactPerson || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const address = (c.address || "").toLowerCase();
      return name.includes(searchTerm) || person.includes(searchTerm) || phone.includes(searchTerm) || address.includes(searchTerm);
    });
  }

  function updateKpis(clients) {
    const activeClients = clients.filter((c) => c.status === "Active" || !c.status);
    const prospectClients = clients.filter((c) => c.status === "Prospect");

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const newClients = activeClients.filter((c) => {
      const date = toDate(c.createdAt);
      return date && date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const convertedThisMonth = clients.filter((c) => {
      if (c.status !== "Active") return false;
      const date = toDate(c.createdAt);
      return date && date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    document.getElementById("kpi-total-clients").textContent = String(activeClients.length);
    document.getElementById("kpi-new-clients").textContent = String(newClients.length);
    document.getElementById("kpi-pipeline").textContent = String(prospectClients.length);
    document.getElementById("kpi-converted").textContent = String(convertedThisMonth.length);
  }

  function renderPipeline(prospects) {
    const pipelineList = document.getElementById("pipeline-list");

    if (!prospects.length) {
      pipelineList.innerHTML = emptyState("Pipeline is empty.", "user-plus");
      return;
    }

    pipelineList.innerHTML = renderTable(prospects.slice(0, 6), true);
  }

  function renderMainList(clients) {
    const list = document.getElementById("client-list");
    const mainClients = clients.filter((c) => c.status === statusFilter || (!c.status && statusFilter === "Active"));

    const totalPages = Math.ceil(mainClients.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const pagedClients = mainClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    resultsMeta.textContent = `${mainClients.length} result${mainClients.length === 1 ? "" : "s"}`;

    if (!mainClients.length) {
      list.innerHTML = emptyState(`No ${statusFilter.toLowerCase()} clients found.`, "inbox");
      pagination.innerHTML = "";
      return;
    }

    list.innerHTML = renderTable(pagedClients, false);
    renderPagination(currentPage, totalPages);
  }

  function renderTable(data, isPipeline) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-sm text-left text-slate-600 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5">Client</th>
              <th class="p-3.5">Contact</th>
              <th class="p-3.5">Phone</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            ${data
              .map((c) => {
                const safePayload = encodeURIComponent(JSON.stringify(c));
                return `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="p-3.5 align-top">
                      <div class="font-bold text-slate-800 dark:text-white">${escapeHtml(c.name || "-")}</div>
                      <div class="text-xs text-slate-400 mt-0.5">${escapeHtml(c.address || "")}</div>
                      ${(c.invoicePrefix || "").trim() ? `<div class="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Invoice: ${escapeHtml(c.invoicePrefix)}-${Number(c.invoiceNextSequence) || 1} next</div>` : ""}
                    </td>
                    <td class="p-3.5">${escapeHtml(c.contactPerson || "-")}</td>
                    <td class="p-3.5 font-mono text-blue-600 dark:text-blue-400">${escapeHtml(c.phone || "-")}</td>
                    <td class="p-3.5">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(c.status)}">
                        ${escapeHtml(c.status || "Active")}
                      </span>
                    </td>
                    <td class="p-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button class="edit-btn p-2 rounded-lg transition text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" aria-label="Edit client" title="Edit" data-client="${safePayload}">
                          <i data-feather="edit-2" class="w-4 h-4"></i>
                        </button>

                        ${
                          isPipeline
                            ? `
                              <button class="convert-btn p-2 rounded-lg transition text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" data-id="${escapeHtml(c.id)}" aria-label="Convert to active" title="Convert to active">
                                <i data-feather="check" class="w-4 h-4"></i>
                              </button>
                              <button class="lost-btn p-2 rounded-lg transition text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" data-id="${escapeHtml(c.id)}" aria-label="Mark as lost" title="Mark as lost">
                                <i data-feather="x-circle" class="w-4 h-4"></i>
                              </button>
                            `
                            : ""
                        }

                        <button class="delete-btn p-2 rounded-lg transition text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30" data-id="${escapeHtml(c.id)}" data-name="${escapeHtml(c.name || "Client")}" aria-label="Delete client" title="Delete">
                          <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function bindActionButtons() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const payload = btn.dataset.client || "";
        const client = parseClientPayload(payload);
        if (client) editClient(client);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name || "Client";
        if (!id) return;
        openConfirmModal({
          title: "Delete Client",
          message: `Delete ${name} permanently? This action cannot be undone.`,
          confirmLabel: "Delete",
          tone: "danger",
          onConfirm: () => deleteClient(id),
        });
      });
    });

    document.querySelectorAll(".convert-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!btn.dataset.id) return;
        updateStatus(btn.dataset.id, "Active", "Prospect converted.");
      });
    });

    document.querySelectorAll(".lost-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!btn.dataset.id) return;
        updateStatus(btn.dataset.id, "Lost", "Marked as lost.");
      });
    });
  }

  function parseClientPayload(payload) {
    try {
      return JSON.parse(decodeURIComponent(payload));
    } catch {
      showToast("Could not open client details.", "error");
      return null;
    }
  }

  function editClient(c) {
    overlay.classList.remove("hidden");

    document.getElementById("client-name").value = c.name || "";
    document.getElementById("client-contact-person").value = c.contactPerson || "";
    document.getElementById("client-phone").value = c.phone || "";
    document.getElementById("client-address").value = c.address || "";
    document.getElementById("client-status").value = c.status || "Active";
    document.getElementById("client-notes").value = c.notes || "";
    document.getElementById("client-invoice-prefix").value = c.invoicePrefix || "";
    document.getElementById("client-invoice-next-seq").value = c.invoiceNextSequence || 1;

    formTitle.textContent = "Edit Client";
    submitLabel.textContent = "Update Client";
    editingClientId = c.id;
    editingMode = "client";
  }

  async function updateStatus(id, status, successMessage) {
    try {
      await db.collection("clients").doc(id).update({ status });
      showToast(successMessage, "success");
      await loadClients();
    } catch (err) {
      console.error(err);
      showToast("Could not update status.", "error");
    }
  }

  async function deleteClient(id) {
    try {
      await db.collection("clients").doc(id).delete();
      showToast("Client deleted.", "success");
      await loadClients();
    } catch (err) {
      console.error(err);
      showToast("Could not delete client.", "error");
    }
  }

  function openConfirmModal({ title, message, confirmLabel, tone, onConfirm }) {
    confirmTitle.textContent = title || "Confirm action";
    confirmMessage.textContent = message || "Are you sure?";
    confirmSubmitBtn.textContent = confirmLabel || "Confirm";

    confirmSubmitBtn.classList.remove("bg-red-600", "hover:bg-red-700", "bg-blue-600", "hover:bg-blue-700");
    if (tone === "danger") {
      confirmSubmitBtn.classList.add("bg-red-600", "hover:bg-red-700");
    } else {
      confirmSubmitBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
    }

    pendingConfirmAction = onConfirm;
    confirmModal.classList.remove("hidden");
  }

  function closeConfirmModal() {
    pendingConfirmAction = null;
    confirmModal.classList.add("hidden");
  }

  function renderPagination(page, totalPages) {
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = `
      <button id="prev-page" class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" ${page === 1 ? "disabled" : ""}>Previous</button>
      <span class="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">Page ${page} of ${totalPages}</span>
      <button id="next-page" class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" ${page === totalPages ? "disabled" : ""}>Next</button>
    `;

    document.getElementById("prev-page")?.addEventListener("click", () => {
      currentPage -= 1;
      loadClients();
    });
    document.getElementById("next-page")?.addEventListener("click", () => {
      currentPage += 1;
      loadClients();
    });
  }

  function loadingState(message) {
    return `
      <div class="flex flex-col items-center justify-center py-14">
        <div class="w-10 h-10 mb-3 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 animate-spin"></div>
        <p class="text-xs text-slate-400 font-medium">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function emptyState(message, icon) {
    return `
      <div class="flex flex-col items-center justify-center py-14 text-slate-400">
        <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mb-3 border border-slate-100 dark:border-slate-700">
          <i data-feather="${icon}" class="w-5 h-5 opacity-50"></i>
        </div>
        <p class="text-sm font-medium">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function errorState(message) {
    return `
      <div class="flex items-center justify-center py-12">
        <p class="text-sm font-semibold text-red-500 dark:text-red-300">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function getStatusBadge(status) {
    if (status === "Active") return "tone-success";
    if (status === "Prospect") return "tone-warning";
    if (status === "Lost") return "tone-danger";
    return "tone-neutral";
  }

  function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message, type) {
    if (window.notyf) {
      if (type === "error") window.notyf.error(message);
      else window.notyf.success(message);
      return;
    }

    const wrapper = document.getElementById("clients-fallback-toast");
    const card = document.getElementById("clients-fallback-toast-card");
    if (!wrapper || !card) return;

    card.textContent = message;
    card.classList.remove("border-red-200", "text-red-700", "dark:border-red-700", "dark:text-red-200", "border-emerald-200", "text-emerald-700", "dark:border-emerald-700", "dark:text-emerald-200");

    if (type === "error") {
      card.classList.add("border-red-200", "text-red-700", "dark:border-red-700", "dark:text-red-200");
    } else {
      card.classList.add("border-emerald-200", "text-emerald-700", "dark:border-emerald-700", "dark:text-emerald-200");
    }

    wrapper.classList.remove("hidden");
    if (fallbackToastTimeout) clearTimeout(fallbackToastTimeout);
    fallbackToastTimeout = setTimeout(() => wrapper.classList.add("hidden"), 2400);
  }

  loadClients();
};
