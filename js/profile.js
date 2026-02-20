// js/profile.js

const profileManager = {
    modal: null,
    backdrop: null,
    isOpen: false,
    signOutInFlight: false,

    init() {
        // Create the modal HTML dynamically if it doesn't exist to keep index.html clean
        if (!document.getElementById('profileModal')) {
            this.injectModalHTML();
        }

        this.modal = document.getElementById('profileModal');
        this.backdrop = document.getElementById('profileBackdrop');

        // Attach listener to the sidebar User Info area
        const userInfoBtn = document.getElementById('userInfo');
        if (userInfoBtn) {
            userInfoBtn.classList.add('cursor-pointer', 'hover:bg-slate-100', 'dark:hover:bg-slate-800', 'transition-colors', 'rounded-lg', 'p-2', '-ml-2');
            userInfoBtn.onclick = () => this.open();
        }

        // Close listeners
        document.getElementById('closeProfileBtn')?.addEventListener('click', () => this.close());
        this.backdrop?.addEventListener('click', () => this.close());
        document.getElementById('profileSignOutBtn')?.addEventListener('click', () => this.signOutWithFade());
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // If auth state is lost while modal is open, close it gracefully.
        if (window.auth?.onAuthStateChanged) {
            window.auth.onAuthStateChanged((user) => {
                if (!user && this.isOpen) this.close();
            });
        }
    },

    injectModalHTML() {
        const modalHTML = `
        <div id="profileModal" class="fixed inset-0 z-[100] hidden flex-col items-center justify-center">
            <div id="profileBackdrop" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity opacity-0 duration-300"></div>
            
            <div id="profileContent" class="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl transform scale-95 opacity-0 transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-800">
                
                <div class="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <button id="closeProfileBtn" class="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="px-8 pb-8">
                    <div class="relative -mt-16 mb-6 flex flex-col items-center">
                        <img id="modalUserPhoto" src="assets/LP Logo.png" class="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover bg-slate-100" />
                        <h2 id="modalUserName" class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">User Name</h2>
                        <p id="modalUserEmail" class="text-slate-500 dark:text-slate-400 font-medium">user@example.com</p>
                        <span class="mt-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                            Administrator
                        </span>
                    </div>

                    <div class="space-y-3">
                        
                        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm">
                                    <i data-feather="moon" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">Dark Mode</p>
                                    <p class="text-xs text-slate-400">Toggle theme</p>
                                </div>
                            </div>
                            <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" id="profileThemeToggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"/>
                                <label for="profileThemeToggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>

                        <button id="profileSignOutBtn" class="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-center gap-4 group hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-red-900/20 flex items-center justify-center text-red-500 shadow-sm">
                                <i data-feather="log-out" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="font-bold text-red-600 dark:text-red-400 text-sm">Sign Out</p>
                                <p class="text-xs text-red-400/70">End your session safely</p>
                            </div>
                        </button>

                    </div>
                    
                    <div class="mt-8 text-center">
                        <p class="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Flowr v1.0.0 • Lush Patisserie</p>
                    </div>
                </div>
            </div>
        </div>
        <style>
            .toggle-checkbox:checked { right: 0; border-color: #68D391; }
            .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
            .toggle-checkbox { right: calc(100% - 1.5rem); }
        </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
    },

    open() {
        if (!window.auth || !window.auth.currentUser) return;
        
        const user = window.auth.currentUser;
        
        // Populate Data
        document.getElementById('modalUserName').innerText = user.displayName || 'Chef';
        document.getElementById('modalUserEmail').innerText = user.email;
        if(user.photoURL) document.getElementById('modalUserPhoto').src = user.photoURL;

        // Sync Theme Toggle State
        const isDark = document.documentElement.classList.contains('dark');
        const toggle = document.getElementById('profileThemeToggle');
        if(toggle) {
            toggle.checked = isDark;
            // Add listener for this specific toggle
            toggle.onchange = () => {
                document.getElementById('darkModeToggle').click(); // Reuse existing toggle logic
            };
        }

        // Show Modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        
        // Animation
        setTimeout(() => {
            this.backdrop.classList.remove('opacity-0');
            const content = document.getElementById('profileContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        this.isOpen = true;
    },

    close() {
        const content = document.getElementById('profileContent');
        if (!content || !this.modal || !this.backdrop) return;
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        
        this.backdrop.classList.add('opacity-0');

        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }, 300);

        this.isOpen = false;
    },

    async signOutWithFade() {
        if (this.signOutInFlight) return;
        this.signOutInFlight = true;

        if (this.isOpen) {
            this.close();
            await new Promise(resolve => setTimeout(resolve, 220));
        }

        try {
            await window.auth?.signOut?.();
        } finally {
            this.signOutInFlight = false;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for Firebase to be ready or just init listeners
    profileManager.init();
});
