// js/firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyD-JHWOVuWJL8l1jA6a9-VKEO4cGulK1Wk",
  authDomain: "lp-profit-calculator.firebaseapp.com",
  projectId: "lp-profit-calculator",
  storageBucket: "lp-profit-calculator.appspot.com", // <-- fixed here
  messagingSenderId: "557442999992",
  appId: "1:557442999992:web:9893228dd9b73f2534764d"
};

firebase.initializeApp(firebaseConfig);

window.db = firebase.firestore();
window.auth = firebase.auth();
window.googleProvider = new firebase.auth.GoogleAuthProvider();
window.EMAIL_EXTENSION_COLLECTION = 'mail';
window.FLOWR_EMAIL_LINK_EMAIL_KEY = 'flowr:inviteEmail';
window.FLOWR_PRESENCE_HEARTBEAT_MS = 45000;
window.FLOWR_PRESENCE_STALE_MS = 120000;

function getActivationContinueUrl(email, role) {
  const activationUrl = new URL(window.location.href);
  activationUrl.search = '';
  activationUrl.hash = '';
  activationUrl.searchParams.set('mode', 'activate');
  if (email) activationUrl.searchParams.set('email', email);
  if (role) activationUrl.searchParams.set('role', role);
  return activationUrl.toString();
}

function hasProvider(user, providerId) {
  if (!user || !Array.isArray(user.providerData)) return false;
  return user.providerData.some((provider) => provider?.providerId === providerId);
}

window.sendInviteActivationLink = async function sendInviteActivationLink(payload = {}) {
  const email = String(payload?.email || '').trim().toLowerCase();
  if (!email) throw new Error('Activation email is required.');

  const continueUrl = getActivationContinueUrl(email, payload?.role || '');
  const actionCodeSettings = {
    url: continueUrl,
    handleCodeInApp: true
  };

  await window.auth.sendSignInLinkToEmail(email, actionCodeSettings);
  return { email, continueUrl };
};

window.completeInviteEmailLinkSignIn = async function completeInviteEmailLinkSignIn() {
  const href = window.location.href;
  if (!window.auth.isSignInWithEmailLink(href)) {
    return { completed: false };
  }

  const params = new URLSearchParams(window.location.search);
  const queryEmail = String(params.get('email') || '').trim().toLowerCase();
  const continueUrlRaw = String(params.get('continueUrl') || '').trim();
  let continueEmail = '';
  if (continueUrlRaw) {
    try {
      const continueUrl = new URL(continueUrlRaw);
      continueEmail = String(continueUrl.searchParams.get('email') || '').trim().toLowerCase();
    } catch (_) {
      continueEmail = '';
    }
  }
  const storedEmail = String(localStorage.getItem(window.FLOWR_EMAIL_LINK_EMAIL_KEY) || '').trim().toLowerCase();
  const email = queryEmail || continueEmail || storedEmail || window.prompt('Confirm your invited email address');
  const emailLower = String(email || '').trim().toLowerCase();
  if (!emailLower) throw new Error('Unable to confirm invited email address.');

  const result = await window.auth.signInWithEmailLink(emailLower, href);
  localStorage.setItem(window.FLOWR_EMAIL_LINK_EMAIL_KEY, emailLower);

  const cleaned = new URL(window.location.href);
  ['oobCode', 'mode', 'apiKey', 'lang', 'continueUrl'].forEach((key) => cleaned.searchParams.delete(key));
  window.history.replaceState({}, document.title, cleaned.toString());

  return {
    completed: true,
    email: emailLower,
    user: result?.user || null
  };
};

window.linkGoogleProviderToCurrentUser = async function linkGoogleProviderToCurrentUser() {
  const user = window.auth.currentUser;
  if (!user) return { linked: false, reason: 'no-user' };
  if (hasProvider(user, 'google.com')) return { linked: false, reason: 'already-linked' };

  const linked = await user.linkWithPopup(window.googleProvider);
  return { linked: true, user: linked?.user || null };
};

window.continueWithGoogleAuth = async function continueWithGoogleAuth() {
  const user = window.auth.currentUser;
  if (user) {
    if (hasProvider(user, 'google.com')) return { type: 'already-linked', user };
    return window.linkGoogleProviderToCurrentUser();
  }
  return window.auth.signInWithPopup(window.googleProvider);
};

window.FlowrPresence = {
  intervalId: null,
  emailLower: null,
  visibilityHandler: null,
  pageHideHandler: null,

  async writeState(state) {
    if (!window.db || !this.emailLower) return;
    try {
      await window.db.collection('accessUsers').doc(this.emailLower).set({
        presenceState: state,
        presenceLastSeenAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.warn('Presence write failed:', err);
    }
  },

  async start(user) {
    const emailLower = String(user?.email || '').trim().toLowerCase();
    if (!emailLower) return;
    if (this.emailLower === emailLower && this.intervalId) return;

    await this.stop();
    this.emailLower = emailLower;

    await this.writeState('online');

    this.intervalId = setInterval(() => {
      this.writeState(document.hidden ? 'away' : 'online');
    }, window.FLOWR_PRESENCE_HEARTBEAT_MS);

    this.visibilityHandler = () => {
      this.writeState(document.hidden ? 'away' : 'online');
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.pageHideHandler = () => {
      this.writeState('offline');
    };
    window.addEventListener('pagehide', this.pageHideHandler);
  },

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.pageHideHandler) {
      window.removeEventListener('pagehide', this.pageHideHandler);
      this.pageHideHandler = null;
    }

    if (this.emailLower) {
      await this.writeState('offline');
      this.emailLower = null;
    }
  }
};
