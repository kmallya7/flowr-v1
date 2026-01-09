// js/clients.js

window.renderClientsSection = function() {
  // --- 1. Render UI ---
  const clientsSection = document.getElementById("clients");

  // We use the same 'slate' palette and rounded/shadow styles as index.html
  clientsSection.innerHTML = `
    <div class="space-y-6 max-w-7xl mx-auto">
    
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Clients</h3>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <i data-feather="users" class="text-blue-500 w-4 h-4"></i>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 dark:text-white" id="kpi-total-clients">0</div>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">New (Month)</h3>
            <div class="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <i data-feather="user-plus" class="text-emerald-500 w-4 h-4"></i>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 dark:text-white" id="kpi-new-clients">0</div>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pipeline</h3>
            <div class="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <i data-feather="filter" class="text-amber-500 w-4 h-4"></i>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 dark:text-white" id="kpi-pipeline">0</div>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Converted</h3>
            <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <i data-feather="check-circle" class="text-purple-500 w-4 h-4"></i>
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 dark:text-white" id="kpi-converted">0</div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <div class="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
               <i data-feather="filter" class="w-5 h-5 text-amber-500"></i>
            </div>
            Pipeline (Prospects)
          </h2>
          <button id="show-add-prospect-form" class="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm">
            <i data-feather="plus" class="w-4 h-4"></i> Add Prospect
          </button>
        </div>
        <div id="pipeline-list" class="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800"></div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div class="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <i data-feather="users" class="w-5 h-5 text-blue-500"></i>
             </div>
             Client List
          </h2>
          
          <div class="flex gap-2 w-full md:w-auto">
            
            <div class="flex-1 md:w-64 flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/50 transition-all shadow-sm overflow-hidden group">
                <span class="pl-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <i data-feather="search" class="w-4 h-4"></i>
                </span>
                <input id="client-search" type="text" placeholder="Search..." class="w-full px-3 py-2.5 bg-transparent border-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-0" />
            </div>
            
            <select id="client-status-filter" class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer font-medium">
              <option value="Active">Active</option>
              <option value="Lost">Lost</option>
            </select>
            
            <button id="show-add-client-form" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none whitespace-nowrap hover:-translate-y-0.5">
              <i data-feather="plus" class="w-4 h-4"></i> Add Client
            </button>
          </div>
        </div>

        <div id="client-list" class="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 min-h-[300px]"></div>
        <div id="pagination" class="flex justify-center items-center gap-2 mt-6"></div>
      </div>

    </div>

    <div id="client-form-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center hidden p-4 transition-opacity">
      <form id="client-form" class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-lg relative transform transition-all scale-100">
        
        <button type="button" id="client-cancel-btn" class="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition">
          <i data-feather="x" class="w-5 h-5"></i>
        </button>

        <h3 class="text-xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <i data-feather="user-plus" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
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

        <button type="submit" id="client-submit-btn" class="mt-8 w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg hover:shadow-xl transform active:scale-95">
          <span id="client-submit-label">Add Client</span>
        </button>
      </form>
    </div>
  `;
  
  if(window.feather) window.feather.replace();

  // --- 2. Variables ---
  const db = window.db;
  let editingClientId = null;
  let editingMode = "client"; 
  let searchTerm = '';
  let statusFilter = 'Active'; 
  let currentPage = 1;
  const pageSize = 10;

  // --- 3. UI Elements ---
  const addBtn = document.getElementById("show-add-client-form");
  const addProspectBtn = document.getElementById("show-add-prospect-form");
  const overlay = document.getElementById("client-form-overlay");
  const form = document.getElementById("client-form");
  const cancelBtn = document.getElementById("client-cancel-btn");
  const formTitle = document.getElementById("client-form-title");
  const submitLabel = document.getElementById("client-submit-label");
  const searchInput = document.getElementById("client-search");
  const statusFilterInput = document.getElementById("client-status-filter");
  const pagination = document.getElementById("pagination");

  // --- 4. Event Listeners ---
  addBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    form.reset();
    editingClientId = null;
    editingMode = "client";
    formTitle.textContent = "Add Client";
    submitLabel.textContent = "Add Client";
    document.getElementById("client-status").value = "Active";
  });

  addProspectBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    form.reset();
    editingClientId = null;
    editingMode = "prospect";
    formTitle.textContent = "Add Prospect";
    submitLabel.textContent = "Add Prospect";
    document.getElementById("client-status").value = "Prospect";
  });

  const closeOverlay = () => {
    overlay.classList.add("hidden");
    form.reset();
    editingClientId = null;
  };

  cancelBtn.addEventListener("click", closeOverlay);
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  // --- 5. Add/Update Logic ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("client-name").value.trim();
    const contactPerson = document.getElementById("client-contact-person").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const address = document.getElementById("client-address").value.trim();
    const status = document.getElementById("client-status").value;
    const notes = document.getElementById("client-notes").value.trim();

    if (!name) {
      showToast("Client name is required.", "error");
      return;
    }

    try {
        if (editingClientId) {
          await db.collection("clients").doc(editingClientId).update({ name, contactPerson, phone, address, status, notes });
          showToast("Client updated!", "success");
        } else {
          await db.collection("clients").add({ name, contactPerson, phone, address, status, notes, createdAt: new Date() });
          showToast("Client added!", "success");
        }
    
        closeOverlay();
        loadClients();
    } catch(err) {
        console.error(err);
        showToast("Error saving client", "error");
    }
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    currentPage = 1;
    loadClients();
  });

  statusFilterInput.addEventListener("change", (e) => {
    statusFilter = e.target.value;
    currentPage = 1;
    loadClients();
  });

  // --- 6. Load Data ---
  async function loadClients() {
    const list = document.getElementById("client-list");
    const pipelineList = document.getElementById("pipeline-list");
    
    // Aesthetic Loader inside table
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16">
         <div class="relative w-10 h-10 mb-3">
           <div class="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-20 animate-pulse"></div>
           <img src="assets/Flowr Logo.png" class="relative w-full h-full rounded-full animate-breath">
         </div>
         <p class="text-xs text-slate-400 font-medium">Loading directory...</p>
      </div>`;
    
    const snapshot = await db.collection("clients").orderBy("createdAt", "desc").get();
    let clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (searchTerm) {
      clients = clients.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.toLowerCase().includes(searchTerm)) ||
        (c.address && c.address.toLowerCase().includes(searchTerm))
      );
    }

    // --- KPIs ---
    const activeClients = clients.filter(c => c.status === "Active");
    document.getElementById("kpi-total-clients").textContent = activeClients.length;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newClients = activeClients.filter(c => {
      let d = c.createdAt;
      if (d && typeof d.toDate === 'function') d = d.toDate();
      else d = new Date(d);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    document.getElementById("kpi-new-clients").textContent = newClients.length;

    const pipelineClients = clients.filter(c => c.status === "Prospect");
    document.getElementById("kpi-pipeline").textContent = pipelineClients.length;
    document.getElementById("kpi-converted").textContent = newClients.length; 

    // --- Render Pipeline Table ---
    if (pipelineClients.length === 0) {
      pipelineList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-slate-400">
           <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mb-2">
             <i data-feather="inbox" class="w-6 h-6 opacity-30"></i>
           </div>
           <p class="text-sm font-medium">Pipeline is empty.</p>
        </div>`;
    } else {
      pipelineList.innerHTML = renderTable(pipelineClients, true);
    }

    // --- Render Main Table ---
    let mainClients = clients.filter(c => 
      c.status === statusFilter || (!c.status && statusFilter === 'Active')
    );

    const totalPages = Math.ceil(mainClients.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const pagedClients = mainClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (mainClients.length === 0) {
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-slate-400">
           <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3 border border-slate-100 dark:border-slate-700">
             <i data-feather="user-x" class="w-8 h-8 opacity-40"></i>
           </div>
           <p class="text-sm font-medium">No clients found.</p>
        </div>`;
      pagination.innerHTML = "";
    } else {
      list.innerHTML = renderTable(pagedClients, false);
      renderPagination(currentPage, totalPages);
    }

    // Re-bind Icons
    if(window.feather) window.feather.replace();

    // Re-bind Action Buttons
    bindActionButtons();
  }

  // --- 7. Table Renderer (Matches Recipe Calc style) ---
  function renderTable(data, isPipeline) {
    return `
      <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
        <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="p-4">Client Name</th>
            <th class="p-4">Contact</th>
            <th class="p-4">Phone</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          ${data.map(c => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <td class="p-4">
                <div class="font-bold text-slate-800 dark:text-white">${c.name}</div>
                <div class="text-xs text-slate-400 mt-0.5">${c.address || ''}</div>
              </td>
              <td class="p-4">${c.contactPerson || '-'}</td>
              <td class="p-4 font-mono text-blue-600 dark:text-blue-400">${c.phone || '-'}</td>
              <td class="p-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(c.status)}">
                  ${c.status || 'Active'}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="edit-btn p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" 
                    data-id="${c.id}"
                    data-client='${JSON.stringify(c).replace(/'/g, "&#39;")}'>
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                  </button>
                  
                  ${isPipeline ? `
                  <button class="convert-btn p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" 
                    data-id="${c.id}" title="Convert">
                    <i data-feather="check" class="w-4 h-4"></i>
                  </button>
                  <button class="lost-btn p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition" 
                    data-id="${c.id}" title="Mark Lost">
                    <i data-feather="x-circle" class="w-4 h-4"></i>
                  </button>
                  ` : ''}

                  <button class="delete-btn p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" 
                    data-id="${c.id}">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function getStatusBadge(status) {
      if(status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      if(status === 'Prospect') return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      if(status === 'Lost') return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  function bindActionButtons() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const c = JSON.parse(btn.dataset.client);
        editClient(c);
      });
    });
    
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteClient(btn.dataset.id));
    });

    document.querySelectorAll(".convert-btn").forEach(btn => {
      btn.addEventListener("click", () => updateStatus(btn.dataset.id, 'Active', 'Prospect Converted!'));
    });

    document.querySelectorAll(".lost-btn").forEach(btn => {
      btn.addEventListener("click", () => updateStatus(btn.dataset.id, 'Lost', 'Marked as Lost.'));
    });
  }

  function editClient(c) {
    overlay.classList.remove("hidden");
    document.getElementById("client-name").value = c.name;
    document.getElementById("client-contact-person").value = c.contactPerson || '';
    document.getElementById("client-phone").value = c.phone || '';
    document.getElementById("client-address").value = c.address || '';
    document.getElementById("client-status").value = c.status || "Active";
    document.getElementById("client-notes").value = c.notes || "";
    
    formTitle.textContent = "Edit Client";
    submitLabel.textContent = "Update Client";
    editingClientId = c.id;
  }

  async function updateStatus(id, status, msg) {
      await db.collection("clients").doc(id).update({ status: status });
      showToast(msg, "success");
      loadClients();
  }

  async function deleteClient(id) {
    if (confirm("Delete this client permanently?")) {
      await db.collection("clients").doc(id).delete();
      showToast("Client deleted.", "success");
      loadClients();
    }
  }

  function renderPagination(page, totalPages) {
    if (totalPages <= 1) return;
    
    pagination.innerHTML = `
      <button id="prev-page" class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed" ${page===1?'disabled':''}>
        Previous
      </button>
      <span class="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
        Page ${page} of ${totalPages}
      </span>
      <button id="next-page" class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed" ${page===totalPages?'disabled':''}>
        Next
      </button>
    `;

    document.getElementById("prev-page")?.addEventListener('click', () => { currentPage--; loadClients(); });
    document.getElementById("next-page")?.addEventListener('click', () => { currentPage++; loadClients(); });
  }

  // Uses Notyf if available, else fallback
  function showToast(message, type) {
      if(window.notyf) {
          if(type === 'success') window.notyf.success(message);
          else window.notyf.error(message);
      } else {
          alert(message);
      }
  }

  // Initial Load
  loadClients();
};