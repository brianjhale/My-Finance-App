// =========================================================================
// 1. DOM ELEMENT HOOKS & SELECTIONS
// =========================================================================
const navButtons = document.querySelectorAll('.nav-btn');
const pageViews = document.querySelectorAll('.page-view');

// Transaction elements
const descInput = document.getElementById('desc-input');
const amountInput = document.getElementById('amount-input');
const transactionAccountSelect = document.getElementById('transaction-account-select');
const transactionCategorySelect = document.getElementById('transaction-category-select');
const transactionTypeSelect = document.getElementById('transaction-type-select');
const addBtn = document.getElementById('add-btn');
const transactionList = document.getElementById('transaction-list');

// Account Elements
const accountNameInput = document.getElementById('account-name-input');
const accountBalanceInput = document.getElementById('account-balance-input');
const addAccountBtn = document.getElementById('add-account-btn');
const accountsGrid = document.getElementById('accounts-grid');

// Audit Elements
const auditFeedList = document.getElementById('audit-feed-list');

// Budget Elements
const budgetCategorySelect = document.getElementById('budget-category-select');
const budgetLimitInput = document.getElementById('budget-limit-input');
const addBudgetBtn = document.getElementById('add-budget-btn');
const budgetsGrid = document.getElementById('budgets-grid');

// Utilities (JSON Backup Engine)
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// =========================================================================
// 2. STATE STORAGE (Clarity Wallet Unified Core Memory)
// =========================================================================
let transactions = JSON.parse(localStorage.getItem('clarity_wallet_transactions')) || [];
let accounts = JSON.parse(localStorage.getItem('clarity_wallet_accounts')) || [];
let budgets = JSON.parse(localStorage.getItem('clarity_wallet_budgets')) || [];

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
// 4. TRANSACTION LEDGER PROCESSING
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

    const transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        accountId: Number(selectedAccountId),
        category: selectedCategory,
        type: transactionType,
        verified: false 
    };

    transactions.push(transaction);
    localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    syncAllApplicationViews();
    descInput.value = '';
    amountInput.value = '';
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
        const categoryLabel = item.category || 'Unassigned';
        const isExpense = item.type === 'expense';
        const displaySign = isExpense ? '-' : '+';
        const styleClass = isExpense ? 'expense-style' : 'income-style';
        const opacityStyle = item.verified ? '' : 'style="opacity: 0.9;"';

        const li = document.createElement('li');
        li.innerHTML = `
            <div ${opacityStyle}>
                <span>${item.description} ${item.verified ? '' : '<span style="font-size:11px; color:#f59e0b; background:#fef3c7; padding:1px 5px; border-radius:4px; margin-left:4px;">Pending</span>'}</span>
                <small style="display:block; color:#64748b; font-size:12px; margin-top:2px;">🏦 ${accountLabel} | 🏷️ ${categoryLabel}</small>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="ledger-amount ${styleClass}">${displaySign}$${item.amount.toFixed(2)}</span>
                <button class="delete-btn" title="Delete Entry">🗑️</button>
            </div>
        `;
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(item.id));
        transactionList.appendChild(li);
    });
}

if (addBtn) addBtn.addEventListener('click', addTransaction);

// =========================================================================
// 5. BANK & CASH ACCOUNTS PROCESSING
// =========================================================================
function addAccount() {
    const accountName = accountNameInput.value.trim();
    const startingBalance = parseFloat(accountBalanceInput.value);

    if (accountName === '' || isNaN(startingBalance)) {
        alert('Please enter a valid account name and initial starting balance.');
        return;
    }

    const accountId = Date.now();
    const newAccount = { id: accountId, name: accountName, balance: 0.00 };

    accounts.push(newAccount);
    localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
    
    if (startingBalance > 0) {
        transactions.push({
            id: Date.now() + 1, 
            description: `Initial Vault Deposit - ${accountName}`,
            amount: startingBalance,
            accountId: accountId,
            category: 'Unassigned',
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
        let currentCalculatedBalance = parseFloat(acc.balance);
        verifiedTransactions.forEach(item => {
            if (item.type === 'expense') currentCalculatedBalance -= item.amount;
            else if (item.type === 'income') currentCalculatedBalance += item.amount;
        });

        const isNegative = currentCalculatedBalance < 0;
        const card = document.createElement('div');
        card.className = 'account-card';
        if (isNegative) card.style.borderTop = "4px solid #df4759";

        card.innerHTML = `
            <h4 class="account-card-title">🏦 ${acc.name}</h4>
            <p class="account-card-balance" ${isNegative ? 'style="color:#df4759"' : ''}>$${currentCalculatedBalance.toFixed(2)}</p>
            <div class="account-card-footer">
                <button class="card-action-btn danger">Close Vault</button>
            </div>
        `;
        card.querySelector('.card-action-btn.danger').addEventListener('click', () => deleteAccount(acc.id));
        accountsGrid.appendChild(card);
    });
}

if (addAccountBtn) addAccountBtn.addEventListener('click', addAccount);

// =========================================================================
// 6. AUDIT VERIFICATION HOOKS
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
    if (transactions.length === 0) {
        auditFeedList.innerHTML = '<p style="color:#64748b; text-align:center; padding: 20px;">No transactions logged yet.</p>';
        return;
    }
    transactions.forEach(item => {
        const linkedAccount = accounts.find(acc => acc.id === item.accountId);
        const row = document.createElement('div');
        row.className = 'audit-item-row';
        row.innerHTML = `
            <div class="audit-item-details">
                <strong>${item.description}</strong>
                <span class="audit-item-meta">Account: <strong>${linkedAccount?.name || 'Unknown'}</strong> | Cat: <strong>${item.category || 'Unassigned'}</strong></span>
            </div>
            <button class="audit-status-badge ${item.verified ? 'status-verified' : 'status-unverified'}">
                ${item.verified ? '✅ Verified' : '⚠️ Unverified'}
            </button>
        `;
        row.querySelector('.audit-status-badge').addEventListener('click', () => toggleVerification(item.id));
        auditFeedList.appendChild(row);
    });
}

// =========================================================================
// 7. BUDGET ENGINE (New Implementation)
// =========================================================================
function addBudget() {
    const category = budgetCategorySelect.value;
    const limit = parseFloat(budgetLimitInput.value);
    if (isNaN(limit) || limit <= 0) { alert('Enter valid budget limit.'); return; }
    
    budgets = budgets.filter(b => b.category !== category);
    budgets.push({ category, limit });
    localStorage.setItem('clarity_wallet_budgets', JSON.stringify(budgets));
    syncAllApplicationViews();
    budgetLimitInput.value = '';
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
            <button onclick="removeBudget('${b.category}')">Remove</button>
        `;
        budgetsGrid.appendChild(div);
    });
}

function removeBudget(category) {
    budgets = budgets.filter(b => b.category !== category);
    localStorage.setItem('clarity_wallet_budgets', JSON.stringify(budgets));
    syncAllApplicationViews();
}

if (addBudgetBtn) addBudgetBtn.addEventListener('click', addBudget);

// =========================================================================
// 8. DYNAMIC DASHBOARD METRICS
// =========================================================================
function updateDashboardMetrics() {
    const netWorthDisplay = document.getElementById('total-net-worth');
    const pendingImpactDisplay = document.getElementById('pending-impact-text');
    if (!netWorthDisplay) return;

    let totalCleared = 0;
    let totalPending = 0;

    accounts.forEach(acc => {
        transactions.filter(t => t.accountId === acc.id).forEach(item => {
            const amount = item.type === 'expense' ? -item.amount : item.amount;
            if (item.verified) totalCleared += amount;
            else totalPending += amount;
        });
    });

    netWorthDisplay.textContent = `$${totalCleared.toFixed(2)}`;
    if (pendingImpactDisplay) {
        pendingImpactDisplay.textContent = totalPending !== 0 ? `Pending Impact: $${totalPending.toFixed(2)}` : '';
    }
}

// =========================================================================
// 9. IMPORT/EXPORT BACKUP ENGINE
// =========================================================================
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ accounts, transactions, budgets }));
        const a = document.createElement('a');
        a.href = dataStr; a.download = 'clarity_wallet_backup.json'; a.click();
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
        };
        reader.readAsText(e.target.files[0]);
    });
}

// =========================================================================
// 10. UNIFIED SYNC ENGINE (RUN ON BOOT)
// =========================================================================
function syncAllApplicationViews() {
    renderTransactions();
    renderAccounts();
    renderAuditFeed();
    renderBudgets();
    updateDashboardMetrics();
}

populateAccountDropdown();
syncAllApplicationViews();