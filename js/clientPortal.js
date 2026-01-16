// js/clientPortal.js

export const ClientPortal = {
  clientId: null,
  clientData: null,

  // Entry point called from index.html upon successful client login
  init: async function(user, clientId) {
    console.log("Initializing Client Portal for:", clientId);
    this.clientId = clientId;
    
    // 1. Fetch Client Details
    const doc = await db.collection('clients').doc(clientId).get();
    this.clientData = doc.data();

    // 2. Transform UI
    this.renderSidebar();
    this.renderWelcome();
    
    // 3. Hide internal-only visuals
    document.getElementById('batchCalculator')?.remove(); // Remove production tools
    document.getElementById('inventory')?.remove(); // Ensure inventory is gone
  },

  renderSidebar: function() {
    const sidebarNav = document.querySelector('#sidebar nav');
    const userName = document.getElementById('userName');
    
    // Update User Profile info
    userName.innerText = this.clientData.name;
    document.querySelector('.sidebar-label p').innerText = "Client Portal";

    // Clear existing Admin links
    sidebarNav.innerHTML = '';

    // Inject Client-Specific Links
    const links = [
      { id: 'clientHome', icon: 'home', label: 'Overview', onclick: 'ClientPortal.renderDashboard()' },
      { id: 'clientOrders', icon: 'shopping-bag', label: 'My Orders', onclick: 'ClientPortal.renderOrders()' },
      { id: 'clientInvoices', icon: 'file-text', label: 'Invoices', onclick: 'ClientPortal.renderInvoices()' },
      { id: 'clientPayments', icon: 'credit-card', label: 'Payment History', onclick: 'ClientPortal.renderPayments()' },
    ];

    links.forEach(link => {
      const a = document.createElement('a');
      a.className = 'nav-link group cursor-pointer';
      a.innerHTML = `
        <i data-feather="${link.icon}" class="nav-icon"></i>
        <span class="sidebar-label text-sm">${link.label}</span>
      `;
      a.onclick = () => {
        // Handle active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active', 'bg-blue-50', 'text-blue-600'));
        a.classList.add('active', 'bg-blue-50', 'text-blue-600');
        // Trigger function
        eval(link.onclick);
      };
      sidebarNav.appendChild(a);
    });
    
    feather.replace();
    
    // Load Dashboard by default
    this.renderDashboard();
  },

  renderDashboard: function() {
    const main = document.getElementById('mainContent');
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    
    main.innerHTML = `
      <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div class="flex flex-col md:flex-row justify-between items-end bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Welcome, ${this.clientData.name}</h1>
            <p class="text-slate-500 mt-2">Here is the snapshot of your account with Lush Patisserie.</p>
          </div>
          <div class="text-right">
             <div class="text-sm font-bold text-slate-400 uppercase tracking-widest">Today</div>
             <div class="text-2xl font-bold text-slate-700 dark:text-slate-200">${date}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
           ${this._createStatCard('Total Orders', 'Fetching...', 'shopping-bag', 'blue')}
           ${this._createStatCard('Outstanding Balance', 'Fetching...', 'alert-circle', 'red')}
           ${this._createStatCard('Last Payment', 'Fetching...', 'check-circle', 'green')}
        </div>
        
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 class="font-bold text-lg mb-4">Recent Invoices</h3>
            <div id="clientRecentInvoices" class="space-y-3">
                <div class="animate-pulse flex space-x-4">
                    <div class="h-12 w-12 bg-slate-200 rounded-full"></div>
                    <div class="flex-1 space-y-4 py-1">
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    `;
    
    feather.replace();
    this._fetchDashboardStats();
  },

  renderOrders: async function() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="p-8"><h2 class="text-2xl font-bold mb-6">Your Orders</h2><div id="ordersList" class="grid gap-4">Loading...</div></div>`;
    
    // Query Logic: Fetch orders ONLY for this clientId
    const snapshot = await db.collection('orders')
        .where('clientId', '==', this.clientId)
        .orderBy('date', 'desc')
        .limit(20)
        .get();

    const container = document.getElementById('ordersList');
    container.innerHTML = '';

    if(snapshot.empty) {
        container.innerHTML = `<p class="text-slate-500">No orders found.</p>`;
        return;
    }

    snapshot.forEach(doc => {
        const order = doc.data();
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order #${doc.id.substr(0,8)}</div>
                    <div class="font-bold text-lg">${order.date}</div>
                    <div class="text-sm text-slate-500">${order.items ? order.items.length : 0} Items</div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-blue-600">₹${order.totalAmount || 0}</div>
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${order.status || 'Pending'}
                    </span>
                </div>
            </div>
        `;
    });
  },

  renderInvoices: async function() {
    // Similar logic to Orders, but fetching from 'invoices' collection
    // Add a "Print" button that re-uses your existing print logic or opens a PDF
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="p-8"><h2 class="text-2xl font-bold mb-6">Invoices</h2><div id="invList" class="space-y-4">Loading...</div></div>`;
    
    const snapshot = await db.collection('invoices')
        .where('clientId', '==', this.clientId)
        .orderBy('date', 'desc')
        .get();
        
    const container = document.getElementById('invList');
    container.innerHTML = '';

    snapshot.forEach(doc => {
        const inv = doc.data();
        container.innerHTML += `
            <div class="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all flex justify-between items-center">
               <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <i data-feather="file-text" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-white">Inv #${inv.invoiceNumber}</div>
                    <div class="text-xs text-slate-500">${inv.date}</div>
                  </div>
               </div>
               <div class="flex items-center gap-6">
                  <div class="text-right">
                    <div class="font-bold">₹${inv.grandTotal}</div>
                    <div class="text-[10px] uppercase font-bold ${inv.status === 'Paid' ? 'text-green-500' : 'text-red-500'}">${inv.status || 'Unpaid'}</div>
                  </div>
                  <button class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                    <i data-feather="download"></i>
                  </button>
               </div>
            </div>
        `;
    });
    feather.replace();
  },

  renderPayments: function() {
     const main = document.getElementById('mainContent');
     main.innerHTML = `<div class="p-8 text-center"><i data-feather="tool" class="mx-auto mb-4 text-slate-300"></i><h2 class="text-xl text-slate-500">Payment History Module Loading...</h2></div>`;
     feather.replace();
     // Implement logic to fetch from 'payments' collection where clientId matches
  },

  // --- Internal Helpers ---

  _createStatCard: (title, value, icon, color) => `
    <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-4 mb-2">
        <div class="w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500">
          <i data-feather="${icon}" class="w-5 h-5"></i>
        </div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">${title}</span>
      </div>
      <div class="text-2xl font-black text-slate-800 dark:text-white mt-2" id="stat-${title.replace(/\s/g,'')}">${value}</div>
    </div>
  `,

  _fetchDashboardStats: async function() {
    // Example aggregation
    let totalSpent = 0;
    const invSnap = await db.collection('invoices').where('clientId', '==', this.clientId).get();
    
    invSnap.forEach(doc => {
        totalSpent += parseFloat(doc.data().grandTotal || 0);
    });

    document.getElementById('stat-TotalOrders').innerText = invSnap.size; // Or fetch real orders count
    document.getElementById('stat-OutstandingBalance').innerText = '₹0'; // Need logic for unpaid invoices
    // Update visuals
  }
};

// Expose to window so HTML can see it
window.ClientPortal = ClientPortal;