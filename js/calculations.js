// js/calculations.js

/**
 * ==========================================
 * PART 1: UI & LAYOUT ENGINE
 * ==========================================
 */

const injectStyles = () => {
    if (document.getElementById('calc-styles')) return; 
    const style = document.createElement('style');
    style.id = 'calc-styles';
    style.innerHTML = `
        .impact-bar-bg { position: absolute; bottom: 0; left: 0; height: 4px; transition: width 0.5s ease; opacity: 0.5; }
        .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .summary-stat-box { display: flex; flex-direction: column; justify-content: center; }
        /* Modal Transitions */
        .modal-enter { opacity: 0; transform: scale(0.95); }
        .modal-enter-active { opacity: 1; transform: scale(1); transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
        .modal-exit { opacity: 1; transform: scale(1); }
        .modal-exit-active { opacity: 0; transform: scale(0.95); transition: opacity 0.2s ease-in, transform 0.2s ease-in; }
        .calc-invalid { border-color: #f87171 !important; box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.2) !important; }
        .calc-field-error { display: none; margin-top: 4px; font-size: 11px; line-height: 1.3; color: #ef4444; }
        .calc-field-error.has-error { display: block; }
        .calc-form-error { min-height: 18px; margin-top: 8px; font-size: 12px; color: #ef4444; font-weight: 600; }
        @media (max-width: 1023px) {
            #finalSummaryDock {
                position: sticky;
                bottom: 12px;
                z-index: 25;
                padding: 10px;
                border-radius: 16px;
                backdrop-filter: blur(8px);
                background: rgba(248, 250, 252, 0.72);
                border: 1px solid rgba(148, 163, 184, 0.35);
                box-shadow: 0 10px 32px -18px rgba(15, 23, 42, 0.45);
            }
            .dark #finalSummaryDock {
                background: rgba(15, 23, 42, 0.68);
                border-color: rgba(51, 65, 85, 0.6);
                box-shadow: 0 12px 32px -20px rgba(2, 6, 23, 0.85);
            }
            #finalSummary .summary-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
                padding: 12px;
            }
            #finalSummary .summary-grid .summary-stat-box {
                min-width: 0;
            }
            #finalSummary .summary-grid .summary-stat-box > div:first-child {
                font-size: 10px;
                margin-bottom: 2px;
                letter-spacing: 0.03em;
            }
            #finalSummary .summary-grid .summary-stat-box > div:last-child {
                font-size: 15px;
                line-height: 1.2;
                word-break: break-word;
            }
            #finalSummary .summary-grid .summary-stat-box.bg-blue-600 {
                transform: none;
                box-shadow: none;
                padding: 10px;
            }
        }
    `;
    document.head.appendChild(style);
};

// --- Function to build the dark modal structure ---
const buildIngredientModal = () => {
    if (document.getElementById('ingredientModal')) return; 

    const modal = document.createElement('div');
    modal.id = 'ingredientModal';
    modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center';
    modal.innerHTML = `
        <div id="modalBackdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity opacity-0"></div>
        <div id="ingredientModalCard" class="relative z-10 w-full max-w-md bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800 modal-enter">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MANAGE PANTRY</p>
                    <h3 id="ingredientModalTitle" class="text-2xl font-extrabold text-white">Add Ingredient</h3>
                </div>
                <button id="closeIngredientModalBtn" class="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <i data-feather="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="modalFormContainer"></div>
        </div>
    `;
    document.body.appendChild(modal);
    if(window.feather) window.feather.replace();
};

const rearrangeLayout = () => {
    const byId = (id) => document.getElementById(id);
    
    // Safety check
    if (!byId('calcBtn') || byId('pantryContainer')) return;

    const getCardWrapper = (childId) => {
        const el = byId(childId);
        if (!el) return null;
        return el.closest('.rounded-2xl') || el.closest('.bg-white') || el.closest('.bg-slate-900');
    };

    const calcCard = getCardWrapper('calcBtn'); 
    const overheadCard = getCardWrapper('labourCost'); 
    const ingredientsCard = getCardWrapper('ingredientsTableBody'); 
    
    if (!calcCard || !ingredientsCard) {
        console.warn("Could not find panels to rearrange.");
        return;
    }

    let mainContainer = calcCard.closest('.grid');
    if (!mainContainer) {
        mainContainer = calcCard.parentElement?.parentElement;
    }
    if (!mainContainer) return; 

    // Build the modal structure first
    buildIngredientModal();

    const newMain = document.createElement('div');
    newMain.className = "w-full mx-auto space-y-6 pb-20 pt-2";

    // --- SECTION A: MAIN GRID ---
    const topSection = document.createElement('div');
    topSection.className = "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start";

    calcCard.className = "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full";
    calcCard.style.width = "100%"; 
    topSection.appendChild(calcCard);

    if (overheadCard) {
        overheadCard.className = "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full";
        overheadCard.style.width = "100%";
        topSection.appendChild(overheadCard);
    }

    // --- SECTION B: SUMMARY ---
    const summaryRow = document.createElement('div');
    summaryRow.className = "w-full";
    const summaryContainer = byId('finalSummary') || document.createElement('div');
    summaryContainer.id = "finalSummary";
    summaryContainer.classList.add('w-full');

    const summaryDock = document.createElement('div');
    summaryDock.id = "finalSummaryDock";
    summaryDock.className = "w-full";
    summaryDock.appendChild(summaryContainer);

    summaryRow.appendChild(summaryDock);

    // --- SECTION C: THE DIVIDER ---
    const divider = document.createElement('div');
    divider.className = "flex items-center justify-center py-6"; 
    divider.innerHTML = `
        <button id="togglePantryBtn" class="group flex items-center gap-2 px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
            <i data-feather="package" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> 
            <span id="pantryBtnText">Manage Pantry</span>
            <i id="pantryChevron" data-feather="chevron-down" class="w-4 h-4 transition-transform duration-500"></i>
        </button>
    `;

    // --- SECTION D: THE PANTRY (ANIMATED WRAPPER) ---
    // The trick for smooth height animation: Grid 0fr -> 1fr
    const pantryContainer = document.createElement('div');
    pantryContainer.id = "pantryContainer";
    // Default State: Closed (0fr, opacity 0)
    pantryContainer.className = "grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]";
    
    // Inner wrapper required for overflow hidden
    const pantryInner = document.createElement('div');
    pantryInner.className = "overflow-hidden";
    
    // Actual Content Box
    const pantryContent = document.createElement('div');
    pantryContent.className = "pt-8 space-y-6 w-full max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800";

    const addBtnContainer = document.createElement('div');
    addBtnContainer.className = "flex justify-between items-center mb-4 px-1";
    addBtnContainer.innerHTML = `<h2 class="text-lg font-bold text-slate-700 dark:text-white flex items-center gap-2"><i data-feather="database" class="w-4 h-4 text-blue-500"></i> Ingredients Library</h2>`;
    
    const showFormBtn = document.createElement('button');
    showFormBtn.id = "showAddFormBtn";
    showFormBtn.className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm";
    showFormBtn.textContent = "Add New Ingredient";
    
    addBtnContainer.appendChild(showFormBtn);
    pantryContent.appendChild(addBtnContainer);

    // --- MOVE AND RESTYLE THE FORM ---
    const formEl = byId('addEditIngredientForm');
    if(formEl) {
        const modalFormContainer = byId('modalFormContainer');
        if(modalFormContainer) {
            modalFormContainer.appendChild(formEl);
            formEl.className = "space-y-6";

            const oldTitle = byId('ingredientFormTitle');
            if(oldTitle) oldTitle.style.display = 'none';
            const cancelBtn = byId('cancelEditBtn');
            if(cancelBtn) {
                 const btnContainer = cancelBtn.closest('div'); 
                 if(btnContainer) btnContainer.style.display = 'none';
            }

            const inputs = formEl.querySelectorAll('input, select');
            inputs.forEach(input => {
                const isGridChild = input.parentElement.classList.contains('grid');
                if (!isGridChild) input.parentElement.classList.add("relative"); 
                
                input.className = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-lg font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
                
                if(input.id === 'ingredientName') input.classList.add('pl-12');
                if(input.id === 'ingredientCost') input.classList.add('pl-8');

                const icon = input.parentElement.querySelector('i, span.absolute');
                if(icon) icon.className = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500";
                
                if(input.tagName === 'SELECT') {
                     input.classList.add('appearance-none');
                     const arrow = input.parentElement.querySelector('.absolute.right-0');
                     if(arrow) arrow.className = "absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500";
                }
            });

            const submitBtn = byId('ingredientFormBtn');
            if(submitBtn) {
                const parentDiv = submitBtn.parentElement;
                if(parentDiv) {
                    parentDiv.className = "mt-8";
                    submitBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 text-lg font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2";
                    submitBtn.innerHTML = `<span>Confirm Ingredient</span> <i data-feather="arrow-right" class="w-5 h-5"></i>`;
                }
            }
        }
    }

    ingredientsCard.className = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden";
    const oldHeader = ingredientsCard.querySelector('h2');
    if(oldHeader) oldHeader.style.display = 'none';
    
    pantryContent.appendChild(ingredientsCard);
    pantryInner.appendChild(pantryContent);
    pantryContainer.appendChild(pantryInner);

    newMain.appendChild(topSection);
    newMain.appendChild(summaryRow);
    newMain.appendChild(divider);
    newMain.appendChild(pantryContainer);

    mainContainer.innerHTML = '';
    mainContainer.className = ''; 
    mainContainer.appendChild(newMain);
    
    if(window.feather) window.feather.replace();
};

/**
 * ==========================================
 * PART 2: LOGIC & CALCULATIONS
 * ==========================================
 */

const db = window.firebase ? window.firebase.firestore() : null;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);
};

const notyf = new Notyf({
    duration: 3000,
    position: { x: 'center', y: 'top' },
    ripple: true,
    dismissible: true
});

class BakingApp {
    constructor() {
        this.ingredients = [];
        this.costRows = [];
        
        injectStyles();
        
        try {
            rearrangeLayout();
        } catch(e) {
            console.error("Layout rearrangement failed:", e);
        }

        this.els = {
            modal: document.getElementById("ingredientModal"),
            modalBackdrop: document.getElementById("modalBackdrop"),
            modalCard: document.getElementById("ingredientModalCard"),
            modalTitle: document.getElementById("ingredientModalTitle"),
            closeModalBtn: document.getElementById("closeIngredientModalBtn"),
            
            pantryContainer: document.getElementById("pantryContainer"), // Animation Wrapper
            togglePantryBtn: document.getElementById("togglePantryBtn"),
            showAddFormBtn: document.getElementById("showAddFormBtn"),
            ingForm: document.getElementById("addEditIngredientForm"), 
            ingBtn: document.getElementById("ingredientFormBtn"),
            select: document.getElementById("ingredientSelect"),
            calcAmount: document.getElementById("usedAmount"),
            calcUnit: document.getElementById("usedUnit"),
            calcBtn: document.getElementById("calcBtn"),
            recipeForm: document.getElementById("recipeForm"),
            ingredientOptions: document.getElementById("ingredientOptions"),
            calcFinalBtn: document.getElementById("calcFinalBtn"),
            resetFinalBtn: document.getElementById("resetFinalBtn"),
            tableBody: document.getElementById("ingredientsTableBody"),
            costTableBody: document.getElementById("costTableBody"),
            finalSummary: document.getElementById("finalSummary"),
            // Overheads
            labour: document.getElementById("labourCost"),
            maint: document.getElementById("maintenanceCost"),
            license: document.getElementById("licensingCost"),
            pack: document.getElementById("packagingCost"),
            elec: document.getElementById("electricityCost"),
            profit: document.getElementById("profitPercent"),
        };
        this.defaultIngredientBtnHtml = this.els.ingBtn ? this.els.ingBtn.innerHTML : "Add";

        this.init();
    }

    init() {
        if (!db) { console.error("Firebase not initialized"); return; }
        this.ensureRecipeValidationUI();
        this.loadIngredients();
        this.restoreSession();

        // --- GLOBAL CLICK LISTENER ---
        if(this.els.tableBody) {
            this.els.tableBody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-btn');
                const deleteBtn = e.target.closest('.delete-btn');

                if (editBtn) {
                    e.preventDefault();
                    this.handleEditClick(editBtn.dataset.id);
                } else if (deleteBtn) {
                    e.preventDefault();
                    this.handleDeleteClick(deleteBtn.dataset.id, deleteBtn.dataset.name);
                }
            });
        }

        // --- NEW SMOOTH ANIMATION TOGGLE ---
        if(this.els.togglePantryBtn) {
            this.els.togglePantryBtn.addEventListener("click", () => {
                if(this.els.pantryContainer) {
                    const el = this.els.pantryContainer;
                    const chevron = document.getElementById('pantryChevron');
                    
                    const isClosed = el.classList.contains("grid-rows-[0fr]");

                    if (isClosed) {
                        // Open
                        el.classList.remove("grid-rows-[0fr]", "opacity-0");
                        el.classList.add("grid-rows-[1fr]", "opacity-100");
                        if(chevron) chevron.style.transform = "rotate(180deg)";
                        
                        // Gentle auto-scroll
                        setTimeout(() => {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 200);
                    } else {
                        // Close
                        el.classList.remove("grid-rows-[1fr]", "opacity-100");
                        el.classList.add("grid-rows-[0fr]", "opacity-0");
                        if(chevron) chevron.style.transform = "rotate(0deg)";
                    }
                }
            });
        }

        // Add Form
        if(this.els.showAddFormBtn) {
            this.els.showAddFormBtn.addEventListener("click", () => {
                this.openModal();
            });
        }

        // Close Modal
        if(this.els.closeModalBtn) {
            this.els.closeModalBtn.addEventListener("click", () => {
                this.closeModal();
            });
        }

        if(this.els.select) {
            const onIngredientInput = (e) => {
                this.clearFieldError("ingredientSelect");
                this.clearFormError();
                this.handleIngredientSelect(e);
            };
            this.els.select.addEventListener("input", onIngredientInput);
            this.els.select.addEventListener("change", onIngredientInput);
        }
        if(this.els.calcAmount) {
            this.els.calcAmount.addEventListener("input", () => {
                this.clearFieldError("usedAmount");
                this.clearFormError();
            });
        }
        if(this.els.calcBtn) this.els.calcBtn.addEventListener("click", () => this.addToRecipe());
        if(this.els.recipeForm) {
            this.els.recipeForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.addToRecipe();
            });
        }
        if(this.els.ingForm) this.els.ingForm.addEventListener("submit", (e) => this.handleIngredientSubmit(e));

        // Live Cost Calculation
        const overheadInputs = [this.els.labour, this.els.maint, this.els.license, this.els.pack, this.els.elec, this.els.profit];
        overheadInputs.forEach(input => {
            if(input) input.addEventListener("input", () => {
                this.saveSession();
                this.renderFinalSummary();
            });
        });

        // Reset Logic
        const resetBtn = document.getElementById('resetCalcBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (resetBtn.dataset.confirming === "true") {
                    this.resetCalculator();
                } else {
                    resetBtn.dataset.confirming = "true";
                    resetBtn.textContent = "Confirm?";
                    resetBtn.classList.remove('text-red-500', 'hover:text-red-700'); 
                    resetBtn.classList.add('bg-red-500', 'text-white', 'px-3', 'py-1', 'rounded-lg', 'shadow-sm', 'hover:bg-red-600'); 
                    setTimeout(() => { this.resetButtonState(resetBtn); }, 3000);
                }
            });
        }

        if (this.els.resetFinalBtn) {
            this.els.resetFinalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearOverheads();
            });
        }

        if (this.els.calcFinalBtn) {
            this.els.calcFinalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.renderFinalSummary();
                this.els.finalSummary?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        this.renderCostTable();
    }

    normalizeIngredientName(name = "") {
        return name.trim().toLowerCase();
    }

    findIngredientByInput(value = "") {
        const normalized = this.normalizeIngredientName(value);
        if(!normalized) return null;
        return this.ingredients.find((ing) => this.normalizeIngredientName(ing.name) === normalized) || null;
    }

    ensureRecipeValidationUI() {
        if(!this.els.recipeForm) return;
        const fieldMap = {
            ingredientSelect: this.els.select,
            usedAmount: this.els.calcAmount,
            usedUnit: this.els.calcUnit,
        };

        Object.entries(fieldMap).forEach(([fieldId, field]) => {
            if(!field || !field.parentElement) return;
            const existingError = field.parentElement.querySelector(`[data-for="${fieldId}"]`);
            if (existingError) return;

            const errorEl = document.createElement("p");
            errorEl.className = "calc-field-error";
            errorEl.dataset.for = fieldId;
            errorEl.setAttribute("aria-live", "polite");
            field.parentElement.appendChild(errorEl);
        });

        if (!this.els.recipeForm.querySelector('[data-role="recipe-form-error"]')) {
            const formError = document.createElement("p");
            formError.className = "calc-form-error";
            formError.dataset.role = "recipe-form-error";
            formError.setAttribute("aria-live", "polite");
            this.els.recipeForm.appendChild(formError);
        }
    }

    setFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if(!field) return;
        field.classList.add("calc-invalid");
        const errorEl = field.parentElement?.querySelector(`[data-for="${fieldId}"]`);
        if(errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add("has-error");
        }
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if(!field) return;
        field.classList.remove("calc-invalid");
        const errorEl = field.parentElement?.querySelector(`[data-for="${fieldId}"]`);
        if(errorEl) {
            errorEl.textContent = "";
            errorEl.classList.remove("has-error");
        }
    }

    setFormError(message) {
        if(!this.els.recipeForm) return;
        const el = this.els.recipeForm.querySelector('[data-role="recipe-form-error"]');
        if(el) el.textContent = message;
    }

    clearFormError() {
        if(!this.els.recipeForm) return;
        const el = this.els.recipeForm.querySelector('[data-role="recipe-form-error"]');
        if(el) el.textContent = "";
    }

    validateRecipeInput() {
        let isValid = true;
        const name = this.els.select?.value?.trim();
        const amount = parseFloat(this.els.calcAmount?.value);
        const selectedIngredient = this.findIngredientByInput(name);

        this.clearFieldError("ingredientSelect");
        this.clearFieldError("usedAmount");
        this.clearFormError();

        if(!name) {
            isValid = false;
            this.setFieldError("ingredientSelect", "Please pick an ingredient.");
        } else if(!selectedIngredient) {
            isValid = false;
            this.setFieldError("ingredientSelect", "Select a valid ingredient from suggestions or add it in Manage Pantry.");
        }

        if(isNaN(amount) || amount <= 0) {
            isValid = false;
            this.setFieldError("usedAmount", "Enter an amount greater than 0.");
        }

        return { isValid, amount, name, selectedIngredient };
    }

    // --- Modal Handling ---
    openModal(isEdit = false) {
        if(!this.els.modal) return;
        this.els.modal.classList.remove("hidden");
        this.els.modal.classList.add("flex");
        if(this.els.modalCard) void this.els.modalCard.offsetWidth;

        const backdrop = document.getElementById('modalBackdrop');
        if(backdrop) backdrop.classList.remove('opacity-0');
        
        if(this.els.modalCard) {
            this.els.modalCard.classList.add('modal-enter-active');
            this.els.modalCard.classList.remove('modal-enter');
        }

        if (!isEdit) {
            if(this.els.ingBtn) {
                this.els.ingBtn.innerHTML = `<span>Confirm Ingredient</span> <i data-feather="arrow-right" class="w-5 h-5"></i>`;
                delete this.els.ingBtn.dataset.editingId;
            }
            if(this.els.ingForm) this.els.ingForm.reset();
            if(this.els.modalTitle) this.els.modalTitle.innerText = "Add Ingredient";
        } else {
             if(this.els.modalTitle) this.els.modalTitle.innerText = "Edit Ingredient";
        }
        if(window.feather) window.feather.replace();
    }

    closeModal() {
        if(!this.els.modal) return;
        const backdrop = document.getElementById('modalBackdrop');
        if(backdrop) backdrop.classList.add('opacity-0');
        
        if(this.els.modalCard) {
            this.els.modalCard.classList.remove('modal-enter-active');
            this.els.modalCard.classList.add('modal-exit-active');
        }

        setTimeout(() => {
            this.els.modal.classList.add("hidden");
            this.els.modal.classList.remove("flex");
            if(this.els.modalCard) {
                this.els.modalCard.classList.remove('modal-exit-active');
                this.els.modalCard.classList.add('modal-enter');
            }
            if(this.els.ingForm) this.els.ingForm.reset();
        }, 200); 
    }

    resetButtonState(btn) {
        if(!btn) return;
        btn.dataset.confirming = "false";
        btn.textContent = "Reset All";
        btn.classList.remove('bg-red-500', 'text-white', 'px-3', 'py-1', 'rounded-lg', 'shadow-sm', 'hover:bg-red-600');
        btn.classList.add('text-red-500', 'hover:text-red-700');
    }

    resetCalculator() {
        if(this.costRows.length === 0) return; 
        this.costRows = [];
        this.renderCostTable();
        this.saveSession();
        if(this.els.calcAmount) this.els.calcAmount.value = '';
        if(this.els.select) this.els.select.value = "";
        const resetBtn = document.getElementById('resetCalcBtn');
        this.resetButtonState(resetBtn);
        notyf.success("Calculator reset");
    }

    clearOverheads() {
        if(this.els.labour) this.els.labour.value = '';
        if(this.els.maint) this.els.maint.value = '';
        if(this.els.license) this.els.license.value = '';
        if(this.els.pack) this.els.pack.value = '';
        if(this.els.elec) this.els.elec.value = '';
        if(this.els.profit) this.els.profit.value = ''; 
        this.saveSession();
        this.renderFinalSummary();
        notyf.success("Overheads cleared");
    }

    resetIngredientFormState() {
        if(this.els.ingForm) this.els.ingForm.reset();
        if(this.els.ingBtn) {
            delete this.els.ingBtn.dataset.editingId;
            this.els.ingBtn.innerHTML = this.defaultIngredientBtnHtml;
        }
    }

    handleEditClick(id) {
        const ing = this.ingredients.find(i => i.id === id);
        if(!ing) return;
        this.openModal(true);
        if(document.getElementById("ingredientName")) document.getElementById("ingredientName").value = ing.name;
        if(document.getElementById("ingredientSize")) document.getElementById("ingredientSize").value = ing.packageSize;
        if(document.getElementById("ingredientUnit")) document.getElementById("ingredientUnit").value = ing.packageUnit;
        if(document.getElementById("ingredientCost")) document.getElementById("ingredientCost").value = ing.packageCost;
        
        if(this.els.ingBtn) {
            this.els.ingBtn.innerHTML = `<span>Update Ingredient</span> <i data-feather="arrow-right" class="w-5 h-5"></i>`;
            this.els.ingBtn.dataset.editingId = ing.id;
        }
        if(window.feather) window.feather.replace();
    }

    handleDeleteClick(id, name) {
        if(confirm(`Delete ${name}?`)) {
            db.collection("ingredients").doc(id).delete().then(() => { 
                notyf.success("Ingredient deleted"); 
                this.loadIngredients(); 
            }).catch(e => {
                console.error(e);
                notyf.error("Could not delete");
            });
        }
    }

    async loadIngredients() {
        try {
            const snapshot = await db.collection("ingredients").orderBy("name").get();
            this.ingredients = [];
            if(this.els.tableBody) this.els.tableBody.innerHTML = "";
            
            const currentVal = this.els.select ? this.els.select.value : "";
            if(this.els.ingredientOptions) this.els.ingredientOptions.innerHTML = "";

            snapshot.forEach(doc => {
                const ing = { id: doc.id, ...doc.data() };
                this.ingredients.push(ing);
                this.renderIngredientRow(ing);

                if(this.els.ingredientOptions) {
                    const opt = document.createElement("option");
                    opt.value = ing.name;
                    this.els.ingredientOptions.appendChild(opt);
                }
            });
            
            if(this.els.select && currentVal) this.els.select.value = currentVal;
            if(this.els.select) this.handleIngredientSelect({ target: this.els.select });
            if(window.feather) window.feather.replace();
            
        } catch (error) { console.error("Error loading ingredients:", error); }
    }

   renderIngredientRow(ing) {
        if(!this.els.tableBody) return;
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group";
        
        tr.innerHTML = `
            <td class="p-3 pl-4 font-medium text-slate-700 dark:text-slate-200 text-left">${ing.name}</td>
            <td class="p-3 text-slate-500 text-center">${ing.packageSize}</td>
            <td class="p-3 text-slate-500 text-center">
                <span class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold">${ing.packageUnit}</span>
            </td>
            <td class="p-3 font-medium text-slate-700 dark:text-slate-200 text-center">
                ${formatCurrency(ing.packageCost)}
            </td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                    <button class="edit-btn p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit" data-id="${ing.id}">
                        <i data-feather="edit-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button class="delete-btn p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete" data-id="${ing.id}" data-name="${ing.name}">
                        <i data-feather="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </td>
        `;
        this.els.tableBody.appendChild(tr);
    }

    async handleIngredientSubmit(e) {
        e.preventDefault();
        const name = document.getElementById("ingredientName").value;
        const size = parseFloat(document.getElementById("ingredientSize").value);
        const unit = document.getElementById("ingredientUnit").value;
        const cost = parseFloat(document.getElementById("ingredientCost").value);
        const editingId = this.els.ingBtn ? this.els.ingBtn.dataset.editingId : null;

        if(!name || isNaN(size) || isNaN(cost)) { notyf.error("Check fields"); return; }
        
        const data = { name, packageSize: size, packageUnit: unit, packageCost: cost, allowedUnits: ["g", "kg", "ml", "L"] };

        const originalBtnText = this.els.ingBtn ? this.els.ingBtn.innerHTML : "Save";
        if(this.els.ingBtn) this.els.ingBtn.innerHTML = `<span>Saving...</span> <i data-feather="loader" class="w-5 h-5 animate-spin"></i>`;
        
        try {
            if (editingId) {
                await db.collection("ingredients").doc(editingId).update(data);
                notyf.success("Ingredient Updated");
            } else {
                await db.collection("ingredients").add(data);
                notyf.success("Ingredient Added");
            }
            this.closeModal(); 
            await this.loadIngredients();
            this.resetIngredientFormState();
            
            if(this.els.select) {
                this.els.select.value = name; 
                this.handleIngredientSelect({ target: this.els.select }); 
            }
        } catch(err) { 
            console.error(err);
            notyf.error("Error saving"); 
        } finally { 
            if(this.els.ingBtn) this.els.ingBtn.innerHTML = originalBtnText;
            if(window.feather) window.feather.replace();
        }
    }

    handleIngredientSelect(e) {
        const name = e.target.value;
        const ing = this.findIngredientByInput(name);
        this.els.calcUnit.innerHTML = "";
        if(ing) {
            if(this.els.select) this.els.select.value = ing.name;
            const units = (ing.packageUnit === 'g' || ing.packageUnit === 'kg') ? ['g', 'kg'] : ['ml', 'L'];
            units.forEach(u => {
                const opt = document.createElement("option");
                opt.value = u; opt.textContent = u;
                this.els.calcUnit.appendChild(opt);
            });
            this.els.calcAmount.focus();
        } else { this.els.calcUnit.innerHTML = "<option>Unit</option>"; }
    }

    addToRecipe() {
        const { isValid, amount, name, selectedIngredient } = this.validateRecipeInput();
        if(!isValid) {
            this.setFormError("Fix highlighted fields to add ingredient.");
            return;
        }

        const unit = this.els.calcUnit.value;
        const ing = selectedIngredient || this.findIngredientByInput(name);
        if(!ing) {
            this.setFieldError("ingredientSelect", "Selected ingredient is unavailable.");
            this.setFormError("Please reselect ingredient and try again.");
            return;
        }
        const toBase = (val, u) => (u === 'kg' || u === 'L') ? val * 1000 : val;
        const cost = (toBase(amount, unit) / toBase(ing.packageSize, ing.packageUnit)) * ing.packageCost;

        this.costRows.push({ name: ing.name, amount, unit, cost });
        this.renderCostTable();
        this.saveSession();
        this.els.calcAmount.value = "";
        this.clearFieldError("usedAmount");
        this.clearFormError();
        this.els.calcAmount.focus();
    }

    renderCostTable() {
        if(!this.els.costTableBody) return;
        this.els.costTableBody.innerHTML = "";
        const total = this.costRows.reduce((a, b) => a + b.cost, 0);
        
        const resetBtn = document.getElementById('resetCalcBtn');
        if(resetBtn) {
            if (this.costRows.length > 0) {
                resetBtn.classList.remove('hidden');
            } else {
                resetBtn.classList.add('hidden');
                this.resetButtonState(resetBtn);
            }
        }
        
        this.costRows.forEach((row, idx) => {
            const pct = total > 0 ? (row.cost / total) * 100 : 0;
            const barColor = pct > 40 ? "bg-red-500" : (pct > 20 ? "bg-orange-400" : "bg-blue-400");
            
            const tr = document.createElement("tr");
            tr.className = "relative border-b border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
            
            tr.innerHTML = `
                <td class="p-3 relative z-10 text-slate-700 dark:text-slate-200 font-medium text-left pl-4">${row.name}</td>
                <td class="p-3 relative z-10 text-slate-500 text-center">${row.amount}</td>
                <td class="p-3 relative z-10 text-slate-500 text-sm text-center">${row.unit}</td>
                <td class="p-3 relative z-10 font-bold text-slate-700 dark:text-white text-center">
                    ${formatCurrency(row.cost)}
                    <div class="text-[10px] font-normal opacity-50">${Math.round(pct)}%</div>
                </td>
                <td class="p-3 relative z-10 text-center">
                    <button class="rm-btn p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Remove Ingredient">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </td>
                <td class="impact-bar-bg ${barColor}" style="width: ${pct}%; position: absolute; bottom: 0; left: 0; height: 3px; padding: 0; border: none; pointer-events: none;"></td>
            `;

            const rmBtn = tr.querySelector(".rm-btn");
            if(rmBtn) rmBtn.onclick = () => {
                this.costRows.splice(idx, 1);
                this.renderCostTable();
                this.saveSession();
            };
            
            this.els.costTableBody.appendChild(tr);
        });

        const totalDisplay = document.getElementById('calcSummaryTotal');
        if(totalDisplay) {
             totalDisplay.innerHTML = this.costRows.length > 0 
                ? `<span class="text-xs text-slate-400 font-normal mr-2">Total:</span> ${formatCurrency(total)}` 
                : '';
        }
        
        if(window.feather) window.feather.replace();
        this.renderFinalSummary();
    }

    renderFinalSummary() {
        if(!this.els.finalSummary) return;
        const recipeCost = this.costRows.reduce((a, b) => a + b.cost, 0);
        const overheads = 
            (parseFloat(this.els.labour?.value) || 0) +
            (parseFloat(this.els.maint?.value) || 0) +
            (parseFloat(this.els.license?.value) || 0) +
            (parseFloat(this.els.pack?.value) || 0) +
            (parseFloat(this.els.elec?.value) || 0);

        const rawProfitMargin = parseFloat(this.els.profit?.value);
        const profitMargin = Number.isFinite(rawProfitMargin) ? rawProfitMargin : 0;
        const invalidProfitMargin = profitMargin < 0 || profitMargin >= 100;
        const totalExpenses = recipeCost + overheads;
        
        let sellPrice = totalExpenses;
        if(!invalidProfitMargin) { sellPrice = totalExpenses / (1 - (profitMargin / 100)); }
        const profitAmount = sellPrice - totalExpenses;

        const formattedPrice = formatCurrency(sellPrice);
        const priceSizeClass = formattedPrice.length > 11 
            ? "text-xl" 
            : (formattedPrice.length > 7 ? "text-2xl" : "text-3xl");

        this.els.finalSummary.innerHTML = `
            <div class="summary-grid bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 text-center animate-fade-in-up shadow-sm">
                <div class="summary-stat-box">
                    <div class="text-xs uppercase font-bold text-slate-400 mb-1">Total Expenses</div>
                    <div class="text-2xl font-bold text-slate-700 dark:text-slate-200">${formatCurrency(totalExpenses)}</div>
                </div>
                <div class="summary-stat-box">
                    <div class="text-xs uppercase font-bold text-emerald-500 mb-1">Net Profit</div>
                    <div class="text-2xl font-bold text-emerald-500">${formatCurrency(profitAmount)}</div>
                </div>
                <div class="summary-stat-box bg-blue-600 rounded-lg p-4 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform flex flex-col justify-center">
                    <div class="text-xs uppercase font-bold text-blue-100 mb-1">Recommended Price</div>
                    <div class="${priceSizeClass} font-extrabold text-white break-words leading-tight">
                        ${formattedPrice}
                    </div>
                </div>
            </div>
            ${invalidProfitMargin ? '<p class="mt-3 text-xs font-semibold text-red-500">Profit margin must be between 0 and 99.99% for a valid recommended price.</p>' : ''}
        `;
    }

    saveSession() {
        const data = {
            rows: this.costRows,
            overheads: {
                labour: this.els.labour?.value,
                maint: this.els.maint?.value,
                license: this.els.license?.value,
                pack: this.els.pack?.value,
                elec: this.els.elec?.value,
                profit: this.els.profit?.value
            }
        };
        localStorage.setItem("bakingSession", JSON.stringify(data));
    }

    restoreSession() {
        const saved = localStorage.getItem("bakingSession");
        if(saved) {
            try {
                const data = JSON.parse(saved);
                this.costRows = data.rows || [];
                if(data.overheads) {
                    if(this.els.labour) this.els.labour.value = data.overheads.labour || 0;
                    if(this.els.maint) this.els.maint.value = data.overheads.maint || 0;
                    if(this.els.license) this.els.license.value = data.overheads.license || 0;
                    if(this.els.pack) this.els.pack.value = data.overheads.pack || 0;
                    if(this.els.elec) this.els.elec.value = data.overheads.elec || 0;
                    if(this.els.profit) this.els.profit.value = data.overheads.profit || 20;
                }
            } catch(e) {}
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.bakingApp = new BakingApp();
});
