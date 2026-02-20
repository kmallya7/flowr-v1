// js/clientPortal.js

const getDb = () => window.db;

function showToast(message, type = 'success') {
  if (window.notyf) {
    if (type === 'error') window.notyf.error(message);
    else window.notyf.success(message);
    return;
  }
  if (type === 'error') console.error(message);
  else console.log(message);
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function queueInviteEmail(payload) {
  const db = getDb();
  if (!db) return;

  const to = String(payload?.to || '').trim();
  if (!to) return;

  const recipientName = payload?.fullName || 'there';
  const roleLabel = String(payload?.role || 'user').toUpperCase();
  const appUrl = window.location.origin || 'https://your-app-url.example.com';

  const subject = 'Your Flowr access invite';
  const text = [
    `Hello ${recipientName},`,
    '',
    `You have been invited to Flowr as ${roleLabel}.`,
    'Sign in with Google using this invited email address.',
    `Open Flowr: ${appUrl}`
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px 0;">You are invited to Flowr</h2>
      <p style="margin: 0 0 8px 0;">Hello ${recipientName},</p>
      <p style="margin: 0 0 8px 0;">You have been invited as <strong>${roleLabel}</strong>.</p>
      <p style="margin: 0 0 12px 0;">Please sign in using Google with this email address.</p>
      <p style="margin: 0;">
        <a href="${appUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Open Flowr</a>
      </p>
    </div>
  `;

  // Firebase Extension (firestore-send-email) default collection is "mail".
  // Make this configurable in case extension uses a custom collection.
  const extensionCollection = window.EMAIL_EXTENSION_COLLECTION || 'mail';

  await db.collection(extensionCollection).add({
    to: [to],
    message: {
      subject,
      text,
      html
    },
    // Optional metadata kept for traceability/auditing.
    flowrMeta: {
      type: 'access_invite',
      role: payload?.role || null,
      inviteStatus: payload?.inviteStatus || null,
      requestedAt: new Date()
    }
  });
}

export const AccessControl = {
  session: {
    role: 'guest',
    status: 'signed_out',
    inviteStatus: null,
    emailLower: null,
    clientId: null,
    staffId: null
  },

  setSession(patch = {}) {
    this.session = { ...this.session, ...patch };
    return this.session;
  },

  clearSession() {
    this.session = {
      role: 'guest',
      status: 'signed_out',
      inviteStatus: null,
      emailLower: null,
      clientId: null,
      staffId: null
    };
  },

  getRole() {
    return this.session?.role || 'guest';
  },

  normalizeAccessDoc(raw = {}, emailLower = '') {
    const allowedRoles = new Set(['owner', 'admin', 'staff', 'client']);
    const allowedStatuses = new Set(['active', 'pending', 'suspended']);
    const allowedInviteStatuses = new Set(['invited', 'accepted', 'revoked', 'expired']);

    const roleRaw = String(raw.role || '').toLowerCase();
    const statusRaw = String(raw.status || '').toLowerCase();
    const inviteRaw = String(raw.inviteStatus || '').toLowerCase();

    const role = allowedRoles.has(roleRaw) ? roleRaw : 'client';
    const status = allowedStatuses.has(statusRaw) ? statusRaw : 'pending';
    const inviteStatus = allowedInviteStatuses.has(inviteRaw) ? inviteRaw : 'invited';

    return {
      role,
      status,
      inviteStatus,
      clientId: raw.clientId || (role === 'client' ? emailLower : null),
      staffId: raw.staffId || (role === 'staff' ? emailLower : null),
      normalized: role !== roleRaw || status !== statusRaw || inviteStatus !== inviteRaw
    };
  },

  canAccessSection(sectionId) {
    const role = this.getRole();
    const sessionStatus = String(this.session?.status || '').toLowerCase();
    const inviteStatus = String(this.session?.inviteStatus || '').toLowerCase();

    if (role === 'guest') return false;
    if (sessionStatus === 'suspended') return false;
    if (inviteStatus === 'revoked' || inviteStatus === 'expired') return false;
    if (sessionStatus !== 'active' && inviteStatus !== 'accepted') return false;

    const allowedSectionsByRole = {
      owner: ['*'],
      admin: ['*'],
      staff: ['home', 'workLog', 'dashboard', 'recipeCalculator', 'invoice', 'payments', 'orders', 'eventsStall', 'inventory'],
      client: ['home', 'dashboard', 'invoice', 'payments', 'orders'],
      guest: []
    };

    const allowed = allowedSectionsByRole[role] || [];
    return allowed.includes('*') || allowed.includes(sectionId);
  },

  async handlePostLogin(user) {
    const db = getDb();
    if (!db || !user || !user.email) {
      return { allowed: true, reason: 'missing-db-or-email' };
    }

    const emailLower = normalizeEmail(user.email);
    const accessRef = db.collection('accessUsers').doc(emailLower);

    try {
      const accessDoc = await accessRef.get();

      // Bootstrap owner account when product has no access records yet.
      if (!accessDoc.exists) {
        const hasAnyAccess = await db.collection('accessUsers').limit(1).get();
        if (hasAnyAccess.empty) {
          await accessRef.set({
            email: user.email,
            emailLower,
            name: user.displayName || user.email,
            role: 'owner',
            status: 'active',
            inviteStatus: 'accepted',
            invitedAt: new Date(),
            acceptedAt: new Date(),
            lastLoginAt: new Date(),
            loginProvider: 'google',
            createdAt: new Date()
          }, { merge: true });

          this.setSession({
            role: 'owner',
            status: 'active',
            inviteStatus: 'accepted',
            emailLower
          });

          return {
            allowed: true,
            role: 'owner',
            bootstrapped: true,
            status: 'active',
            inviteStatus: 'accepted',
            emailLower
          };
        }

        return { allowed: false, reason: 'not-invited' };
      }

      const data = accessDoc.data() || {};
      const normalized = this.normalizeAccessDoc(data, emailLower);
      const status = normalized.status;
      const inviteStatus = normalized.inviteStatus;

      if (status === 'suspended' || inviteStatus === 'revoked' || inviteStatus === 'expired') {
        return { allowed: false, reason: 'access-disabled', role: normalized.role || null };
      }

      const patch = {
        lastLoginAt: new Date(),
        loginProvider: 'google',
        name: data.name || user.displayName || user.email,
        role: normalized.role,
        status: normalized.status,
        inviteStatus: normalized.inviteStatus,
        clientId: normalized.clientId,
        staffId: normalized.staffId,
        schemaVersion: 2
      };

      if (inviteStatus === 'invited') {
        patch.inviteStatus = 'accepted';
        patch.acceptedAt = new Date();
        if (!data.status || data.status === 'pending') patch.status = 'active';
      }

      await accessRef.set(patch, { merge: true });

      const resolvedRole = patch.role;
      const resolvedStatus = patch.status;
      const resolvedInviteStatus = patch.inviteStatus;
      const resolvedClientId = patch.clientId;
      const resolvedStaffId = patch.staffId;

      this.setSession({
        role: resolvedRole,
        status: resolvedStatus,
        inviteStatus: resolvedInviteStatus,
        emailLower,
        clientId: resolvedClientId,
        staffId: resolvedStaffId
      });

      return {
        allowed: true,
        role: resolvedRole,
        status: resolvedStatus,
        inviteStatus: resolvedInviteStatus,
        emailLower,
        clientId: resolvedClientId,
        staffId: resolvedStaffId
      };
    } catch (err) {
      console.error('Access control check failed:', err);
      this.clearSession();
      return { allowed: false, reason: 'access-check-failed' };
    }
  }
};

export const AdminPortal = {
  state: {
    tab: 'client',
    search: ''
  },

  render() {
    const host = document.getElementById('admin');
    if (!host) return;
    const role = window.AccessControl?.getRole?.() || 'guest';

    if (!['owner', 'admin'].includes(role)) {
      host.innerHTML = `
        <div class="max-w-4xl mx-auto p-8">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <i data-feather="shield-off" class="w-10 h-10 mx-auto text-amber-500 mb-3"></i>
            <h2 class="text-xl font-bold text-slate-800 dark:text-white">Access Restricted</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">Only owner/admin accounts can access Admin workspace.</p>
          </div>
        </div>
      `;
      if (window.feather) window.feather.replace();
      return;
    }

    host.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs uppercase tracking-widest font-bold text-slate-400">Admin Workspace</p>
              <h2 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-1">People Access</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Invite clients and staff, then control login access.</p>
            </div>
            <div class="flex gap-2">
              <button id="admin-add-client" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Invite Client</button>
              <button id="admin-add-staff" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-semibold transition-colors">Invite Staff</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-kpis"></div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button data-tab="client" class="admin-tab px-4 py-2 rounded-lg text-sm font-semibold">Clients</button>
              <button data-tab="staff" class="admin-tab px-4 py-2 rounded-lg text-sm font-semibold">Staff</button>
            </div>
            <input id="admin-search" type="text" placeholder="Search by name or email" class="w-full md:w-72 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          </div>
          <div id="admin-people-list" class="overflow-x-auto"></div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500">Permission Matrix</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                <tr>
                  <th class="p-3 text-left">Capability</th>
                  <th class="p-3 text-center">Owner/Admin</th>
                  <th class="p-3 text-center">Staff</th>
                  <th class="p-3 text-center">Client</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                <tr><td class="p-3">Manage invites/roles</td><td class="p-3 text-center">Yes</td><td class="p-3 text-center">No</td><td class="p-3 text-center">No</td></tr>
                <tr><td class="p-3">Orders access</td><td class="p-3 text-center">Full</td><td class="p-3 text-center">Full</td><td class="p-3 text-center">Own</td></tr>
                <tr><td class="p-3">Inventory access</td><td class="p-3 text-center">Full</td><td class="p-3 text-center">View/Edit</td><td class="p-3 text-center">No</td></tr>
                <tr><td class="p-3">Invoices & payments</td><td class="p-3 text-center">Full</td><td class="p-3 text-center">Operational</td><td class="p-3 text-center">Own</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="admin-invite-overlay" class="fixed inset-0 z-[80] hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <form id="admin-invite-form" class="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between">
            <h3 id="admin-invite-title" class="text-lg font-bold text-slate-800 dark:text-white">Invite</h3>
            <button id="admin-invite-close" type="button" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <i data-feather="x" class="w-4 h-4"></i>
            </button>
          </div>

          <input type="hidden" id="admin-role" value="client" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
              <input id="admin-name" type="text" required class="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" placeholder="Jane Doe" />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
              <input id="admin-email" type="email" required class="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" placeholder="jane@example.com" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</label>
              <input id="admin-phone" type="text" class="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" placeholder="+1..." />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Company (Client only)</label>
              <input id="admin-company" type="text" class="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" placeholder="Acme Inc" />
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
            <p class="text-xs text-slate-500">On submit: an access record is created, lifecycle starts at <span class="font-semibold">invited</span>, and an invite email request is queued.</p>
          </div>

          <button type="submit" class="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Create Invite</button>
        </form>
      </div>
    `;

    this.bindEvents();
    this.setTab(this.state.tab);
    if (window.feather) window.feather.replace();
  },

  bindEvents() {
    const addClient = document.getElementById('admin-add-client');
    const addStaff = document.getElementById('admin-add-staff');
    const search = document.getElementById('admin-search');
    const tabs = document.querySelectorAll('.admin-tab');
    const closeBtn = document.getElementById('admin-invite-close');
    const overlay = document.getElementById('admin-invite-overlay');
    const form = document.getElementById('admin-invite-form');

    addClient?.addEventListener('click', () => this.openInviteModal('client'));
    addStaff?.addEventListener('click', () => this.openInviteModal('staff'));

    tabs.forEach(btn => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });

    search?.addEventListener('input', (e) => {
      this.state.search = (e.target.value || '').trim().toLowerCase();
      this.loadPeople();
    });

    closeBtn?.addEventListener('click', () => this.closeInviteModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeInviteModal();
    });

    form?.addEventListener('submit', (e) => this.handleInviteSubmit(e));

    document.getElementById('admin-people-list')?.addEventListener('click', async (e) => {
      const actionBtn = e.target.closest('button[data-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.action;
      const emailLower = actionBtn.dataset.email;
      if (!emailLower) return;

      try {
        const db = getDb();
        const accessRef = db.collection('accessUsers').doc(emailLower);

        if (action === 'resend') {
          await accessRef.set({
            inviteStatus: 'invited',
            invitedAt: new Date(),
            lastInviteSentAt: new Date()
          }, { merge: true });

          const doc = await accessRef.get();
          const row = doc.data() || {};

          await queueInviteEmail({
            template: 'access_invite',
            to: row.email,
            role: row.role,
            fullName: row.name,
            inviteStatus: 'invited'
          });

          showToast('Invite resent.');
        }

        if (action === 'suspend') {
          await accessRef.set({ status: 'suspended' }, { merge: true });
          showToast('Access suspended.');
        }

        if (action === 'activate') {
          await accessRef.set({ status: 'active' }, { merge: true });
          showToast('Access activated.');
        }

        await this.loadPeople();
      } catch (err) {
        console.error(err);
        showToast('Unable to update access.', 'error');
      }
    });

    document.getElementById('admin-people-list')?.addEventListener('change', async (e) => {
      const select = e.target.closest('select[data-action="set-role"]');
      if (!select) return;
      const emailLower = select.dataset.email;
      const nextRole = select.value;
      if (!emailLower || !nextRole) return;

      try {
        const patch = {
          role: nextRole,
          clientId: nextRole === 'client' ? emailLower : null,
          staffId: nextRole === 'staff' ? emailLower : null,
          updatedAt: new Date()
        };
        await getDb().collection('accessUsers').doc(emailLower).set(patch, { merge: true });
        showToast('Role updated.');
        await this.loadPeople();
      } catch (err) {
        console.error(err);
        showToast('Failed to update role.', 'error');
      }
    });
  },

  setTab(tab) {
    this.state.tab = tab === 'staff' ? 'staff' : 'client';

    document.querySelectorAll('.admin-tab').forEach(btn => {
      const active = btn.dataset.tab === this.state.tab;
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('dark:bg-slate-700', active);
      btn.classList.toggle('text-slate-900', active);
      btn.classList.toggle('dark:text-white', active);
      btn.classList.toggle('text-slate-500', !active);
    });

    this.loadPeople();
  },

  openInviteModal(role) {
    const overlay = document.getElementById('admin-invite-overlay');
    const title = document.getElementById('admin-invite-title');
    const roleInput = document.getElementById('admin-role');
    const companyField = document.getElementById('admin-company');

    roleInput.value = role;
    title.textContent = role === 'staff' ? 'Invite Staff Member' : 'Invite Client';

    if (companyField) {
      companyField.disabled = role === 'staff';
      if (role === 'staff') companyField.value = '';
    }

    overlay?.classList.remove('hidden');
    overlay?.classList.add('flex');
  },

  closeInviteModal() {
    const overlay = document.getElementById('admin-invite-overlay');
    const form = document.getElementById('admin-invite-form');
    overlay?.classList.add('hidden');
    overlay?.classList.remove('flex');
    form?.reset();
  },

  async handleInviteSubmit(e) {
    e.preventDefault();

    const db = getDb();
    if (!db) {
      showToast('Database not ready.', 'error');
      return;
    }

    const role = document.getElementById('admin-role')?.value || 'client';
    const fullName = document.getElementById('admin-name')?.value.trim();
    const email = document.getElementById('admin-email')?.value.trim();
    const phone = document.getElementById('admin-phone')?.value.trim();
    const company = document.getElementById('admin-company')?.value.trim();
    const emailLower = normalizeEmail(email);

    if (!fullName || !emailLower) {
      showToast('Name and email are required.', 'error');
      return;
    }

    try {
      const actor = window.auth?.currentUser;
      const accessRef = db.collection('accessUsers').doc(emailLower);

      await accessRef.set({
        name: fullName,
        email,
        emailLower,
        role,
        clientId: role === 'client' ? emailLower : null,
        staffId: role === 'staff' ? emailLower : null,
        phone: phone || '',
        company: role === 'client' ? (company || '') : '',
        status: 'pending',
        inviteStatus: 'invited',
        invitedAt: new Date(),
        lastInviteSentAt: new Date(),
        invitedByUid: actor?.uid || null,
        invitedByName: actor?.displayName || actor?.email || 'Admin',
        loginProvider: 'google',
        updatedAt: new Date(),
        createdAt: new Date()
      }, { merge: true });

      if (role === 'client') {
        await db.collection('clients').doc(emailLower).set({
          name: company || fullName,
          contactPerson: fullName,
          phone: phone || '',
          email,
          emailLower,
          status: 'Prospect',
          notes: 'Invited through Admin > People Access',
          accessUserId: emailLower,
          updatedAt: new Date(),
          createdAt: new Date()
        }, { merge: true });
      }

      if (role === 'staff') {
        await db.collection('staff').doc(emailLower).set({
          name: fullName,
          phone: phone || '',
          email,
          emailLower,
          status: 'Invited',
          accessUserId: emailLower,
          updatedAt: new Date(),
          createdAt: new Date()
        }, { merge: true });
      }

      await queueInviteEmail({
        template: 'access_invite',
        to: email,
        role,
        fullName,
        inviteStatus: 'invited'
      });

      this.closeInviteModal();
      await this.loadPeople();
      showToast('Invite created and email queued.');
    } catch (err) {
      console.error(err);
      showToast('Failed to create invite.', 'error');
    }
  },

  async loadPeople() {
    const db = getDb();
    const host = document.getElementById('admin-people-list');
    const kpiHost = document.getElementById('admin-kpis');
    if (!db || !host || !kpiHost) return;

    host.innerHTML = `<div class="p-6 text-sm text-slate-400">Loading people...</div>`;

    try {
      const snap = await db.collection('accessUsers').orderBy('createdAt', 'desc').get();
      const people = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const clients = people.filter(p => p.role === 'client');
      const staff = people.filter(p => p.role === 'staff');
      const invited = people.filter(p => p.inviteStatus === 'invited').length;
      const active = people.filter(p => (p.status || '').toLowerCase() === 'active').length;

      kpiHost.innerHTML = `
        ${this.kpiCard('Total Invites', people.length, 'mail')}
        ${this.kpiCard('Clients', clients.length, 'users')}
        ${this.kpiCard('Staff', staff.length, 'briefcase')}
        ${this.kpiCard('Active Logins', active, 'shield')}
      `;

      let rows = people.filter(p => p.role === this.state.tab);
      if (this.state.search) {
        rows = rows.filter(p => {
          const name = (p.name || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          return name.includes(this.state.search) || email.includes(this.state.search);
        });
      }

      if (!rows.length) {
        host.innerHTML = `<div class="p-8 text-center text-sm text-slate-400">No ${this.state.tab} records yet.</div>`;
      } else {
        host.innerHTML = `
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
              <tr>
                <th class="p-3 text-left">Name</th>
                <th class="p-3 text-left">Email</th>
                <th class="p-3 text-left">Role</th>
                <th class="p-3 text-left">Invite</th>
                <th class="p-3 text-left">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${rows.map(row => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="p-3 font-semibold text-slate-800 dark:text-slate-100">${row.name || '-'}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-300">${row.email || '-'}</td>
                  <td class="p-3">
                    <select data-action="set-role" data-email="${row.emailLower || row.id}" class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold ${row.role === 'owner' ? 'opacity-70 cursor-not-allowed' : ''}" ${row.role === 'owner' ? 'disabled' : ''}>
                      <option value="client" ${row.role === 'client' ? 'selected' : ''}>client</option>
                      <option value="staff" ${row.role === 'staff' ? 'selected' : ''}>staff</option>
                      <option value="admin" ${row.role === 'admin' ? 'selected' : ''}>admin</option>
                      <option value="owner" ${row.role === 'owner' ? 'selected' : ''}>owner</option>
                    </select>
                  </td>
                  <td class="p-3">${this.badgeInvite(row.inviteStatus || 'invited')}</td>
                  <td class="p-3">${this.badgeStatus(row.status || 'pending')}</td>
                  <td class="p-3">
                    <div class="flex justify-end gap-2">
                      <button data-action="resend" data-email="${row.emailLower || row.id}" class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">Resend</button>
                      ${(row.status || '').toLowerCase() === 'suspended'
                        ? `<button data-action="activate" data-email="${row.emailLower || row.id}" class="px-2 py-1 rounded-lg border tone-success text-xs font-semibold">Activate</button>`
                        : `<button data-action="suspend" data-email="${row.emailLower || row.id}" class="px-2 py-1 rounded-lg border border-amber-200 text-amber-600 text-xs font-semibold hover:bg-amber-50">Suspend</button>`}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      if (window.feather) window.feather.replace();

      // Keep invited KPI visible even if not used in cards now.
      void invited;
    } catch (err) {
      console.error(err);
      host.innerHTML = `<div class="p-6 text-sm text-red-500">Failed to load access records.</div>`;
    }
  },

  kpiCard(label, value, icon) {
    return `
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">${label}</p>
          <i data-feather="${icon}" class="w-4 h-4 text-slate-400"></i>
        </div>
        <p class="text-2xl font-bold text-slate-800 dark:text-white mt-2">${value}</p>
      </div>
    `;
  },

  badgeInvite(status) {
    const s = (status || '').toLowerCase();
    const cls = s === 'accepted'
      ? 'tone-success'
      : s === 'revoked' || s === 'expired'
      ? 'tone-danger'
      : 'tone-accent';
    return `<span class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${cls}">${s || 'invited'}</span>`;
  },

  badgeStatus(status) {
    const s = (status || '').toLowerCase();
    const cls = s === 'active'
      ? 'tone-success'
      : s === 'suspended'
      ? 'tone-warning'
      : 'tone-neutral';
    return `<span class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${cls}">${s || 'pending'}</span>`;
  }
};

export const StaffPortal = {
  staffId: null,
  staffData: null,

  async init(user, staffId) {
    this.staffId = staffId;
    const db = getDb();
    let staffData = null;

    try {
      const doc = await db.collection('staff').doc(staffId).get();
      staffData = doc.exists ? doc.data() : null;
    } catch (err) {
      console.error('Failed to load staff profile:', err);
    }

    this.staffData = staffData || {
      name: user?.displayName || 'Staff Member',
      email: user?.email || ''
    };

    this.renderSidebar();
    await this.renderDashboard();
  },

  renderSidebar() {
    const sidebarNav = document.querySelector('#sidebar nav');
    const userName = document.getElementById('userName');
    const brandSub = document.querySelector('.sidebar-label p');
    if (!sidebarNav) return;

    if (userName) userName.innerText = this.staffData?.name || 'Staff';
    if (brandSub) brandSub.innerText = 'Staff Portal';

    const links = [
      { icon: 'home', label: 'Overview', action: () => this.renderDashboard() },
      { icon: 'shopping-bag', label: 'Orders Queue', action: () => this.renderOrdersQueue() },
      { icon: 'package', label: 'Inventory View', action: () => this.renderInventoryView() },
      { icon: 'clipboard', label: 'Daily Tasks', action: () => this.renderDailyTasks() }
    ];

    sidebarNav.innerHTML = '';
    links.forEach((link, idx) => {
      const a = document.createElement('a');
      a.className = `nav-link group cursor-pointer ${idx === 0 ? 'active' : ''}`;
      a.innerHTML = `
        <i data-feather="${link.icon}" class="nav-icon"></i>
        <span class="sidebar-label text-sm">${link.label}</span>
      `;
      a.addEventListener('click', () => {
        sidebarNav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        a.classList.add('active');
        link.action();
      });
      sidebarNav.appendChild(a);
    });

    if (window.feather) window.feather.replace();
  },

  async renderDashboard() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const db = getDb();

    main.innerHTML = `
      <div class="p-8 max-w-7xl mx-auto space-y-6">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Staff Workspace</h1>
          <p class="text-sm text-slate-500 mt-2">Operational snapshot for kitchen and fulfillment.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="staff-kpi-grid">
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Loading...</div>
        </div>
      </div>
    `;

    try {
      const [ordersSnap, inventorySnap, logsSnap] = await Promise.all([
        db.collection('orders').limit(200).get(),
        db.collection('inventory').limit(200).get(),
        db.collection('dailyLogs').limit(200).get()
      ]);

      const pendingOrders = ordersSnap.docs.filter(d => (d.data().status || '').toLowerCase() !== 'delivered').length;
      const lowInventory = inventorySnap.docs.filter(d => Number(d.data().qty || 0) <= 10).length;
      const today = new Date().toISOString().slice(0, 10);
      const todayLogs = logsSnap.docs.filter(d => String(d.data().date || '').slice(0, 10) === today).length;

      const kpiGrid = document.getElementById('staff-kpi-grid');
      if (kpiGrid) {
        kpiGrid.innerHTML = `
          ${this.kpiCard('Pending Orders', pendingOrders, 'shopping-bag')}
          ${this.kpiCard('Low Inventory', lowInventory, 'alert-triangle')}
          ${this.kpiCard('Today Logs', todayLogs, 'clipboard')}
        `;
      }
      if (window.feather) window.feather.replace();
    } catch (err) {
      console.error('Staff KPI load failed:', err);
    }
  },

  async renderOrdersQueue() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
      <div class="p-8 max-w-6xl mx-auto">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Orders Queue</h2>
          <p class="text-sm text-slate-500 mt-2">Live operational queue for pending and in-progress orders.</p>
          <div id="staff-orders-table" class="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    `;

    const tableHost = document.getElementById('staff-orders-table');
    if (!tableHost) return;

    try {
      const snap = await getDb().collection('orders').limit(100).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pending = rows.filter(r => (r.status || '').toLowerCase() !== 'delivered');

      if (!pending.length) {
        tableHost.innerHTML = `<div class="p-6 text-sm text-slate-400 text-center">No pending orders.</div>`;
        return;
      }

      tableHost.innerHTML = `
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
            <tr>
              <th class="p-3 text-left">Order</th>
              <th class="p-3 text-left">Client</th>
              <th class="p-3 text-left">Date</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${pending.slice(0, 25).map(o => `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="p-3 font-semibold text-slate-800 dark:text-slate-100">#${(o.id || '').slice(0, 8)}</td>
                <td class="p-3 text-slate-600 dark:text-slate-300">${o.clientName || o.client || '-'}</td>
                <td class="p-3 text-slate-500">${o.date || '-'}</td>
                <td class="p-3">${(o.status || 'Pending')}</td>
                <td class="p-3 text-right font-semibold text-slate-700 dark:text-slate-200">Rs ${Number(o.totalAmount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      console.error('Failed to load staff orders queue:', err);
      tableHost.innerHTML = `<div class="p-6 text-sm text-red-500">Unable to load orders queue.</div>`;
    }
  },

  async renderInventoryView() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
      <div class="p-8 max-w-6xl mx-auto">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Inventory View</h2>
          <p class="text-sm text-slate-500 mt-2">Current stock with low-quantity highlights.</p>
          <div id="staff-inventory-table" class="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    `;

    const tableHost = document.getElementById('staff-inventory-table');
    if (!tableHost) return;

    try {
      const snap = await getDb().collection('inventory').limit(300).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!rows.length) {
        tableHost.innerHTML = `<div class="p-6 text-sm text-slate-400 text-center">No inventory records.</div>`;
        return;
      }

      tableHost.innerHTML = `
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
            <tr>
              <th class="p-3 text-left">Ingredient</th>
              <th class="p-3 text-left">Qty</th>
              <th class="p-3 text-left">Unit</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-right">Cost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${rows.slice(0, 40).map(item => {
              const qty = Number(item.qty || 0);
              const low = qty <= 10;
              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="p-3 font-semibold text-slate-800 dark:text-slate-100">${item.name || item.ingredient || '-'}</td>
                  <td class="p-3 text-slate-700 dark:text-slate-200">${qty}</td>
                  <td class="p-3 text-slate-500">${item.unit || '-'}</td>
                  <td class="p-3">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${low ? 'tone-warning' : 'tone-success'}">
                      ${low ? 'Low' : 'Healthy'}
                    </span>
                  </td>
                  <td class="p-3 text-right font-semibold text-slate-700 dark:text-slate-200">Rs ${Number(item.cost || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      console.error('Failed to load inventory view:', err);
      tableHost.innerHTML = `<div class="p-6 text-sm text-red-500">Unable to load inventory.</div>`;
    }
  },

  async renderDailyTasks() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
      <div class="p-8 max-w-6xl mx-auto">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-4">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Daily Tasks</h2>
          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>1. Review open orders and update statuses.</li>
            <li>2. Check low-stock ingredients.</li>
            <li>3. Log today production updates in Work Log.</li>
          </ul>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 class="text-lg font-bold text-slate-800 dark:text-white">Recent Work Logs</h3>
          <div id="staff-worklogs" class="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    `;

    const host = document.getElementById('staff-worklogs');
    if (!host) return;

    try {
      const snap = await getDb().collection('dailyLogs').limit(60).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

      if (!rows.length) {
        host.innerHTML = `<div class="p-6 text-sm text-slate-400 text-center">No work logs found.</div>`;
        return;
      }

      host.innerHTML = `
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
            <tr>
              <th class="p-3 text-left">Date</th>
              <th class="p-3 text-left">Notes</th>
              <th class="p-3 text-right">Entries</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${rows.slice(0, 20).map(log => {
              const notes = (log.notes || '').toString();
              const notePreview = notes.length > 80 ? `${notes.slice(0, 80)}...` : notes || '-';
              const entryCount = Array.isArray(log.entries) ? log.entries.length : (Array.isArray(log.batchData) ? log.batchData.length : '-');
              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="p-3 font-semibold text-slate-800 dark:text-slate-100">${log.date || '-'}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-300">${notePreview}</td>
                  <td class="p-3 text-right text-slate-700 dark:text-slate-200">${entryCount}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      console.error('Failed to load work logs:', err);
      host.innerHTML = `<div class="p-6 text-sm text-red-500">Unable to load work logs.</div>`;
    }
  },

  kpiCard(label, value, icon) {
    return `
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">${label}</p>
          <i data-feather="${icon}" class="w-4 h-4 text-slate-400"></i>
        </div>
        <p class="text-3xl font-bold text-slate-800 dark:text-white mt-2">${value}</p>
      </div>
    `;
  }
};

export const RolePortal = {
  mode: 'default',
  defaultSidebarNavHTML: null,
  defaultBrandSubtitle: null,
  quickActionsBound: false,

  snapshotDefaultSidebar() {
    const nav = document.querySelector('#sidebar nav');
    const subtitle = document.querySelector('.sidebar-label p');
    if (!nav || this.defaultSidebarNavHTML !== null) return;

    this.defaultSidebarNavHTML = nav.innerHTML;
    this.defaultBrandSubtitle = subtitle?.innerText || 'Pastry Management';
  },

  resetToDefaultSidebar() {
    this.mode = 'default';
    this.snapshotDefaultSidebar();
    const nav = document.querySelector('#sidebar nav');
    const subtitle = document.querySelector('.sidebar-label p');
    if (!nav || this.defaultSidebarNavHTML === null) return;

    nav.innerHTML = this.defaultSidebarNavHTML;
    if (subtitle) subtitle.innerText = this.defaultBrandSubtitle || 'Pastry Management';
    if (window.feather) window.feather.replace();
    this.applyHeaderAffordances('admin');
  },

  async activate(user, accessResult = {}) {
    this.snapshotDefaultSidebar();
    const role = accessResult.role || window.AccessControl?.getRole?.() || 'guest';
    const emailLower = accessResult.emailLower || normalizeEmail(user?.email);

    if (role === 'client') {
      this.mode = 'client';
      const clientId = accessResult.clientId || emailLower;
      await window.ClientPortal?.init?.(user, clientId);
      this.applyHeaderAffordances('client');
      return;
    }

    if (role === 'staff') {
      this.mode = 'staff';
      const staffId = accessResult.staffId || emailLower;
      await window.StaffPortal?.init?.(user, staffId);
      this.applyHeaderAffordances('staff');
      return;
    }

    this.resetToDefaultSidebar();
    this.applyHeaderAffordances(role);
  },

  applyHeaderAffordances(role = 'admin') {
    const roleBadge = document.getElementById('roleBadge');
    const quickActions = document.getElementById('roleQuickActions');
    if (!roleBadge || !quickActions) return;

    const roleStyles = {
      owner: 'tone-info',
      admin: 'tone-accent',
      staff: 'tone-success',
      client: 'tone-warning'
    };

    const shortcutsByRole = {
      owner: [
        { section: 'admin', label: 'People' },
        { section: 'dashboard', label: 'Insights' },
        { section: 'orders', label: 'Orders' }
      ],
      admin: [
        { section: 'admin', label: 'People' },
        { section: 'clients', label: 'Clients' },
        { section: 'inventory', label: 'Inventory' }
      ],
      staff: [
        { section: 'orders', label: 'Orders' },
        { section: 'inventory', label: 'Stock' },
        { section: 'workLog', label: 'Work Log' }
      ],
      client: [
        { section: 'dashboard', label: 'Overview' },
        { section: 'orders', label: 'My Orders' },
        { section: 'payments', label: 'Payments' }
      ]
    };

    roleBadge.className = `px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleStyles[role] || roleStyles.admin}`;
    roleBadge.textContent = role;
    roleBadge.classList.remove('hidden');

    const shortcuts = shortcutsByRole[role] || [];
    quickActions.innerHTML = shortcuts.map(s => `
      <button class="quick-action-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors" data-section="${s.section}">
        ${s.label}
      </button>
    `).join('');
    quickActions.classList.toggle('hidden', shortcuts.length === 0);

    if (!this.quickActionsBound) {
      quickActions.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-action-btn');
        if (!btn) return;
        const section = btn.dataset.section;
        if (!section) return;

        if (this.mode === 'client') {
          if (section === 'dashboard') return window.ClientPortal?.renderDashboard?.();
          if (section === 'orders') return window.ClientPortal?.renderOrders?.();
          if (section === 'payments') return window.ClientPortal?.renderPayments?.();
          if (section === 'invoice') return window.ClientPortal?.renderInvoices?.();
        }

        if (this.mode === 'staff') {
          if (section === 'orders') return window.StaffPortal?.renderOrdersQueue?.();
          if (section === 'inventory') return window.StaffPortal?.renderInventoryView?.();
          if (section === 'workLog') return window.StaffPortal?.renderDailyTasks?.();
        }

        if (typeof window.showSection === 'function') window.showSection(section);
      });
      this.quickActionsBound = true;
    }
  },

  clearHeaderAffordances() {
    const roleBadge = document.getElementById('roleBadge');
    const quickActions = document.getElementById('roleQuickActions');
    if (roleBadge) {
      roleBadge.classList.add('hidden');
      roleBadge.textContent = '';
    }
    if (quickActions) {
      quickActions.classList.add('hidden');
      quickActions.innerHTML = '';
    }
  }
};

export const ClientPortal = {
  clientId: null,
  clientData: null,

  // Entry point called from index.html upon successful client login
  init: async function(user, clientId) {
    console.log('Initializing Client Portal for:', clientId);
    this.clientId = clientId;

    // 1. Fetch Client Details
    const doc = await window.db.collection('clients').doc(clientId).get();
    this.clientData = doc.exists ? doc.data() : {
      name: user?.displayName || 'Client',
      email: user?.email || ''
    };

    // 2. Transform UI
    this.renderSidebar();

    // 3. Hide internal-only visuals
    document.getElementById('batchCalculator')?.remove();
    document.getElementById('inventory')?.remove();
  },

  renderSidebar: function() {
    const sidebarNav = document.querySelector('#sidebar nav');
    const userName = document.getElementById('userName');

    userName.innerText = this.clientData.name;
    document.querySelector('.sidebar-label p').innerText = 'Client Portal';

    sidebarNav.innerHTML = '';

    const links = [
      { id: 'clientHome', icon: 'home', label: 'Overview', onclick: 'ClientPortal.renderDashboard()' },
      { id: 'clientOrders', icon: 'shopping-bag', label: 'My Orders', onclick: 'ClientPortal.renderOrders()' },
      { id: 'clientInvoices', icon: 'file-text', label: 'Invoices', onclick: 'ClientPortal.renderInvoices()' },
      { id: 'clientPayments', icon: 'credit-card', label: 'Payment History', onclick: 'ClientPortal.renderPayments()' }
    ];

    links.forEach(link => {
      const a = document.createElement('a');
      a.className = 'nav-link group cursor-pointer';
      a.innerHTML = `
        <i data-feather="${link.icon}" class="nav-icon"></i>
        <span class="sidebar-label text-sm">${link.label}</span>
      `;
      a.onclick = () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        a.classList.add('active');
        eval(link.onclick);
      };
      sidebarNav.appendChild(a);
    });

    feather.replace();
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
      </div>
    `;

    feather.replace();
    this._fetchDashboardStats();
  },

  renderOrders: async function() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '<div class="p-8"><h2 class="text-2xl font-bold mb-6">Your Orders</h2><div id="ordersList" class="grid gap-4">Loading...</div></div>';

    const snapshot = await window.db.collection('orders')
      .where('clientId', '==', this.clientId)
      .orderBy('date', 'desc')
      .limit(20)
      .get();

    const container = document.getElementById('ordersList');
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<p class="text-slate-500">No orders found.</p>';
      return;
    }

    snapshot.forEach(doc => {
      const order = doc.data();
      container.innerHTML += `
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order #${doc.id.substr(0, 8)}</div>
            <div class="font-bold text-lg">${order.date}</div>
            <div class="text-sm text-slate-500">${order.items ? order.items.length : 0} Items</div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold text-blue-600">Rs ${order.totalAmount || 0}</div>
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
              ${order.status || 'Pending'}
            </span>
          </div>
        </div>
      `;
    });
  },

  renderInvoices: async function() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '<div class="p-8"><h2 class="text-2xl font-bold mb-6">Invoices</h2><div id="invList" class="space-y-4">Loading...</div></div>';

    const snapshot = await window.db.collection('invoices')
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
              <div class="font-bold text-slate-800 dark:text-white">Inv #${inv.invoiceNumber || '-'}</div>
              <div class="text-xs text-slate-500">${inv.date || '-'}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold">Rs ${inv.grandTotal || 0}</div>
            <div class="text-[10px] uppercase font-bold ${inv.status === 'Paid' ? 'text-green-500' : 'text-red-500'}">${inv.status || 'Unpaid'}</div>
          </div>
        </div>
      `;
    });

    feather.replace();
  },

  renderPayments: function() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '<div class="p-8 text-center"><i data-feather="tool" class="mx-auto mb-4 text-slate-300"></i><h2 class="text-xl text-slate-500">Payment History Module Loading...</h2></div>';
    feather.replace();
  },

  _createStatCard: (title, value, icon, color) => `
    <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-4 mb-2">
        <div class="w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500">
          <i data-feather="${icon}" class="w-5 h-5"></i>
        </div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">${title}</span>
      </div>
      <div class="text-2xl font-black text-slate-800 dark:text-white mt-2" id="stat-${title.replace(/\s/g, '')}">${value}</div>
    </div>
  `,

  _fetchDashboardStats: async function() {
    const invSnap = await window.db.collection('invoices').where('clientId', '==', this.clientId).get();
    const totalOrdersEl = document.getElementById('stat-TotalOrders');
    const outstandingEl = document.getElementById('stat-OutstandingBalance');

    if (totalOrdersEl) totalOrdersEl.innerText = invSnap.size;
    if (outstandingEl) outstandingEl.innerText = 'Rs 0';
  }
};

window.AccessControl = AccessControl;
window.AdminPortal = AdminPortal;
window.StaffPortal = StaffPortal;
window.RolePortal = RolePortal;
window.ClientPortal = ClientPortal;
