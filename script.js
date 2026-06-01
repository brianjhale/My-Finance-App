// =========================================================================
// 1. DOM ELEMENT HOOKS & SELECTIONS
// =========================================================================
const navButtons = document.querySelectorAll('.nav-btn');
const pageViews = document.querySelectorAll('.page-view');

const descInput = document.getElementById('desc-input');
const amountInput = document.getElementById('amount-input');
const transactionAccountSelect = document.getElementById('transaction-account-select');
const transactionCategorySelect = document.getElementById('transaction-category-select');
const transactionTypeSelect = document.getElementById('transaction-type-select');
const addBtn = document.getElementById('add-btn');
const transactionList = document.getElementById('transaction-list');

const accountNameInput = document.getElementById('account-name-input');
const accountBalanceInput = document.getElementById('account-balance-input');
const addAccountBtn = document.getElementById('add-account-btn');
const accountsGrid = document.getElementById('accounts-grid');

const auditFeedList = document.getElementById('audit-feed-list');

const budgetCategorySelect = document.getElementById('budget-category-select');
const budgetLimitInput = document.getElementById('budget-limit-input');
const addBudgetBtn = document.getElementById('add-budget-btn');
const budgetsGrid = document.getElementById('budgets-grid');

const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// =========================================================================
// 2. STATE STORAGE
// =========================================================================
let transactions = JSON.parse(localStorage.getItem('clarity_wallet_transactions')) || [];
let accounts = JSON.parse(localStorage.getItem('clarity_wallet_accounts')) || [];
let budgets = JSON.parse(localStorage.getItem('clarity_wallet_budgets')) || [];
let currentEditId = null; 

// =========================================================================
// 3. SPA ROUTER SYSTEM
// =========================================================================
function handleNavigation(event) {
    const clickedBtn = event.currentTarget;
    const targetPageId = clickedBtn.getAttribute('data-target');

    navButtons.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');

    pageViews.forEach(view => view.classList.add('hidden'));
    
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) targetPage.classList.remove('hidden');

    if (targetPageId === 'transactions-page') populateAccountDropdown();
}
navButtons.forEach(btn => btn.addEventListener('click', handleNavigation));

// =========================================================================
// 4. TRANSACTION LEDGER PROCESSING (CRUD)
// =========================================================================
function populateAccountDropdown() {
    if (!transactionAccountSelect) return;
    transactionAccountSelect.innerHTML = '';
    
    if (accounts.length === 0) {
        const option = document.createElement('option');
        option.text = '-- Create an Account First --';
        option.value = '';
        transactionAccountSelect.appendChild(option);
        return;
    }
    
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.text = acc.name;
        transactionAccountSelect.appendChild(option);
    });
}

function addTransaction() {
    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const selectedAccountId = transactionAccountSelect.value;
    const selectedCategory = transactionCategorySelect ? transactionCategorySelect.value : 'Unassigned';
    const transactionType = transactionTypeSelect.value;

    if (description === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and a positive numerical value.');
        return;
    }
    
    if (!selectedAccountId) {
        alert('Please navigate to the Accounts page and create a wallet first!');
        return;
    }

    transactions.push({
        id: Date.now(),
        description,
        amount,
        accountId: Number(selectedAccountId),
        category: selectedCategory,
        type: transactionType,
        verified: false 
    });

    localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    syncAllApplicationViews();
    descInput.value = '';
    amountInput.value = '';
}

// Edit Modal Functions
function openEditModal(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    currentEditId = id;
    document.getElementById('edit-desc').value = t.description;
    document.getElementById('edit-amount').value = t.amount;
    document.getElementById('edit-category').value = t.category; // Set current value
    document.getElementById('edit-type').value = t.type;         // Set current value
    document.getElementById('edit-modal').style.display = 'flex';
}

function saveEditedTransaction() {
    const t = transactions.find(tx => tx.id === currentEditId);
    if (t) {
        t.description = document.getElementById('edit-desc').value;
        t.amount = parseFloat(document.getElementById('edit-amount').value);
        t.category = document.getElementById('edit-category').value;
        t.type = document.getElementById('edit-type').value;
        
        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
        syncAllApplicationViews();
        closeEditModal();
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function saveEditedTransaction() {
    const t = transactions.find(tx => tx.id === currentEditId);
    if (t) {
        t.description = document.getElementById('edit-desc').value;
        t.amount = parseFloat(document.getElementById('edit-amount').value);
        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
        syncAllApplicationViews();
        closeEditModal();
    }
}

function deleteTransaction(transactionId) {
    transactions = transactions.filter(item => item.id !== transactionId);
    localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    syncAllApplicationViews();
}

function renderTransactions() {
    if (!transactionList) return;
    transactionList.innerHTML = '';
    transactions.forEach(item => {
        const linkedAccount = accounts.find(acc => acc.id === item.accountId);
        const accountLabel = linkedAccount ? linkedAccount.name : 'Unknown Vault';
        const isExpense = item.type === 'expense';
        const displaySign = isExpense ? '-' : '+';
        const styleClass = isExpense ? 'expense-style' : 'income-style';

        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <span>${item.description} ${item.verified ? '' : '<span style="font-size:11px; color:#f59e0b; background:#fef3c7; padding:1px 5px; border-radius:4px; margin-left:4px;">Pending</span>'}</span>
                <small style="display:block; color:#64748b; font-size:12px; margin-top:2px;">🏦 ${accountLabel} | 🏷️ ${item.category || 'Unassigned'}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <span class="ledger-amount ${styleClass}">${displaySign}$${item.amount.toFixed(2)}</span>
                <button class="wallet-btn" onclick="openEditModal(${item.id})">✏️</button>
                <button class="wallet-btn btn-danger" onclick="deleteTransaction(${item.id})">🗑️</button>
            </div>
        `;
        transactionList.appendChild(li);
    });
}
if (addBtn) addBtn.addEventListener('click', addTransaction);

// =========================================================================
// 5. BANK & CASH ACCOUNTS (With Automatic Starting Balance Category)
// =========================================================================
function addAccount() {
    const accountName = accountNameInput.value.trim();
    const startingBalance = parseFloat(accountBalanceInput.value);

    if (accountName === '' || isNaN(startingBalance)) {
        alert('Please enter a valid account name and initial starting balance.');
        return;
    }

    const accountId = Date.now();
    accounts.push({ id: accountId, name: accountName, balance: 0.00 });
    localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
    
    if (startingBalance > 0) {
        transactions.push({
            id: Date.now() + 1, 
            description: `Initial Vault Deposit - ${accountName}`,
            amount: startingBalance,
            accountId: accountId,
            category: 'Starting Balance', // Auto-categorized
            type: 'income',
            verified: false 
        });
        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    }

    syncAllApplicationViews();
    populateAccountDropdown(); 
    accountNameInput.value = '';
    accountBalanceInput.value = '';
}

function deleteAccount(accountId) {
    if (!confirm('Are you sure? This will also purge transactions tied to this account.')) return;
    accounts = accounts.filter(acc => acc.id !== accountId);
    localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
    transactions = transactions.filter(item => item.accountId !== accountId);
    localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    syncAllApplicationViews();
    populateAccountDropdown(); 
}

function renderAccounts() {
    if (!accountsGrid) return;
    accountsGrid.innerHTML = '';
    accounts.forEach(acc => {
        const verifiedTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === true);
        let currentCalculatedBalance = 0;
        verifiedTransactions.forEach(item => {
            currentCalculatedBalance += (item.type === 'expense' ? -item.amount : item.amount);
        });

        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <h4>🏦 ${acc.name}</h4>
            <p>$${currentCalculatedBalance.toFixed(2)}</p>
            <button class="wallet-btn btn-danger" onclick="deleteAccount(${acc.id})">Close Vault</button>
        `;
        accountsGrid.appendChild(card);
    });
}
if (addAccountBtn) addAccountBtn.addEventListener('click', addAccount);

// =========================================================================
// 6. AUDIT VERIFICATION & BUDGETS
// =========================================================================
function toggleVerification(transactionId) {
    const match = transactions.find(item => item.id === transactionId);
    if (match) {
        match.verified = !match.verified;
        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
        syncAllApplicationViews();
    }
}

function renderAuditFeed() {
    if (!auditFeedList) return;
    auditFeedList.innerHTML = '';
    transactions.forEach(item => {
        const linkedAccount = accounts.find(acc => acc.id === item.accountId);
        const row = document.createElement('div');
        row.className = 'audit-item-row';
        row.innerHTML = `
            <div><strong>${item.description}</strong><br><small>Cat: ${item.category}</small></div>
            <button class="wallet-btn" onclick="toggleVerification(${item.id})">
                ${item.verified ? '✅ Verified' : '⚠️ Unverified'}
            </button>
        `;
        auditFeedList.appendChild(row);
    });
}

function renderBudgets() {
    if (!budgetsGrid) return;
    budgetsGrid.innerHTML = '';
    budgets.forEach(b => {
        const div = document.createElement('div');
        div.className = 'budget-card';
        div.innerHTML = `
            <h4>🏷️ ${b.category}</h4>
            <p>Limit: $${b.limit.toFixed(2)}</p>
            <button class="wallet-btn btn-danger" onclick="removeBudget('${b.category}')">Remove</button>
        `;
        budgetsGrid.appendChild(div);
    });
}

function addBudget() {
    const category = budgetCategorySelect.value;
    const limit = parseFloat(budgetLimitInput.value);
    if (isNaN(limit) || limit <= 0) return;
    budgets = budgets.filter(b => b.category !== category);
    budgets.push({ category, limit });
    localStorage.setItem('clarity_wallet_budgets', JSON.stringify(budgets));
    syncAllApplicationViews();
}
if (addBudgetBtn) addBudgetBtn.addEventListener('click', addBudget);

function removeBudget(category) {
    budgets = budgets.filter(b => b.category !== category);
    localStorage.setItem('clarity_wallet_budgets', JSON.stringify(budgets));
    syncAllApplicationViews();
}

// =========================================================================
// 7. DASHBOARD & SYNC ENGINE
// =========================================================================
function updateDashboardMetrics() {
    const display = document.getElementById('total-net-worth');
    if (!display) return;
    let total = transactions.filter(t => t.verified).reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
    display.textContent = `$${total.toFixed(2)}`;
}

function syncAllApplicationViews() {
    renderTransactions();
    renderAccounts();
    renderAuditFeed();
    renderBudgets();
    updateDashboardMetrics();
}

// =========================================================================
// 8. IMPORT/EXPORT BACKUP ENGINE
// =========================================================================
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ 
            accounts, 
            transactions, 
            budgets 
        }));
        const a = document.createElement('a');
        a.href = dataStr; 
        a.download = 'clarity_wallet_backup.json'; 
        a.click();
    });
}

if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = JSON.parse(ev.target.result);
            accounts = data.accounts || [];
            transactions = data.transactions || [];
            budgets = data.budgets || [];
            
            localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
            localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
            localStorage.setItem('clarity_wallet_budgets', JSON.stringify(budgets));
            
            syncAllApplicationViews();
            populateAccountDropdown();
            alert("Data imported successfully!");
        };
        reader.readAsText(e.target.files[0]);
    });
}

populateAccountDropdown();
syncAllApplicationViews();