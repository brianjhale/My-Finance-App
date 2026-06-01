// =========================================================================
// 1. DOM ELEMENT HOOKS & SELECTIONS
// =========================================================================
const navButtons = document.querySelectorAll('.nav-btn');
const pageViews = document.querySelectorAll('.page-view');

// Transaction elements
const descInput = document.getElementById('desc-input');
const amountInput = document.getElementById('amount-input');
const transactionAccountSelect = document.getElementById('transaction-account-select');
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

// =========================================================================
// 2. STATE STORAGE (Clarity Wallet Unified Core Memory)
// =========================================================================
let transactions = JSON.parse(localStorage.getItem('clarity_wallet_transactions')) || [];
let accounts = JSON.parse(localStorage.getItem('clarity_wallet_accounts')) || [];

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
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    if (targetPageId === 'transactions-page') {
        populateAccountDropdown();
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', handleNavigation);
});

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
        accountId: parseFloat(selectedAccountId),
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

        const isExpense = item.type === 'expense';
        const displaySign = isExpense ? '-' : '+';
        const styleClass = isExpense ? 'expense-style' : 'income-style';
        const opacityStyle = item.verified ? '' : 'style="opacity: 0.9;"';

        const li = document.createElement('li');
        li.innerHTML = `
            <div ${opacityStyle}>
                <span>${item.description} ${item.verified ? '' : '<span style="font-size:11px; color:#f59e0b; background:#fef3c7; padding:1px 5px; border-radius:4px; margin-left:4px;">Pending</span>'}</span>
                <small style="display:block; color:#64748b; font-size:12px; margin-top:2px;">🏦 ${accountLabel}</small>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="ledger-amount ${styleClass}">${displaySign}$${item.amount.toFixed(2)}</span>
                <button class="delete-btn" title="Delete Entry">🗑️</button>
            </div>
        `;

        const trashBtn = li.querySelector('.delete-btn');
        trashBtn.addEventListener('click', () => deleteTransaction(item.id));

        transactionList.appendChild(li);
    });
}

if (addBtn) {
    addBtn.addEventListener('click', addTransaction);
}

// =========================================================================
// 5. BANK & CASH ACCOUNTS PROCESSING (Self-Contained Dynamic Ledger Engine)
// =========================================================================
function addAccount() {
    const accountName = accountNameInput.value.trim();
    const startingBalance = parseFloat(accountBalanceInput.value);

    if (accountName === '' || isNaN(startingBalance)) {
        alert('Please enter a valid account name and initial starting balance.');
        return;
    }

    const accountId = Date.now();

    // 1. Core Profile Instance created at absolute zero baseline ($0.00)
    const newAccount = {
        id: accountId,
        name: accountName,
        balance: 0.00 
    };

    accounts.push(newAccount);
    localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
    
    // 2. AUDIT-READY: Automatically append an Unverified Initial Deposit transaction row
    if (startingBalance > 0) {
        const initialDepositTx = {
            id: Date.now() + 1, // Prevent key collision
            description: `Initial Vault Deposit - ${accountName}`,
            amount: startingBalance,
            accountId: accountId,
            type: 'income',
            verified: false // Must be confirmed via human auditing to move account balances off $0.00
        };
        transactions.push(initialDepositTx);
        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
    }

    syncAllApplicationViews();
    populateAccountDropdown();

    accountNameInput.value = '';
    accountBalanceInput.value = '';
}

function deleteAccount(accountId) {
    if (!confirm('Are you sure you want to delete this account? This will also purge any logged transactions tied directly to it to avoid corrupt ledger memory.')) {
        return;
    }

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
        // Dynamic balance presentation layers
        const verifiedTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === true);
        const pendingTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === false);

        let clearedBalance = parseFloat(acc.balance); // Always starts at 0.00
        verifiedTransactions.forEach(item => {
            if (item.type === 'expense') clearedBalance -= item.amount;
            else if (item.type === 'income') clearedBalance += item.amount;
        });

        let workingBalance = clearedBalance;
        pendingTransactions.forEach(item => {
            if (item.type === 'expense') workingBalance -= item.amount;
            else if (item.type === 'income') workingBalance += item.amount;
        });

        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <h4 class="account-card-title">🏦 ${acc.name}</h4>
            <p class="account-card-balance" style="font-size:22px;" title="Cleared Balance">$${clearedBalance.toFixed(2)}</p>
            <small style="color: #64748b; display: block; margin-top: 2px;">Working: <strong>$${workingBalance.toFixed(2)}</strong></small>
            <div class="account-card-footer">
                <button class="card-action-btn danger">Close Vault</button>
            </div>
        `;

        const closeVaultBtn = card.querySelector('.card-action-btn.danger');
        closeVaultBtn.addEventListener('click', () => deleteAccount(acc.id));

        accountsGrid.appendChild(card);
    });
}

if (addAccountBtn) {
    addAccountBtn.addEventListener('click', addAccount);
}

// =========================================================================
// 6. AUDIT VERIFICATION HOOKS & RENDERING
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
        const accountName = linkedAccount ? linkedAccount.name : 'Unknown Vault';
        
        const isExpense = item.type === 'expense';
        const displaySign = isExpense ? '-' : '+';
        const amountColor = isExpense ? '#df4759' : '#10b981';

        const row = document.createElement('div');
        row.className = 'audit-item-row';
        
        row.innerHTML = `
            <div class="audit-item-details">
                <strong style="color:var(--text-main); font-size:15px;">${item.description}</strong>
                <span class="audit-item-meta">Account: <strong>${accountName}</strong> | Value: <span style="color:${amountColor}; font-weight:600;">${displaySign}$${item.amount.toFixed(2)}</span></span>
            </div>
            <button class="audit-status-badge ${item.verified ? 'status-verified' : 'status-unverified'}">
                ${item.verified ? '✅ Verified' : '⚠️ Unverified'}
            </button>
        `;
        
        const badgeButton = row.querySelector('.audit-status-badge');
        badgeButton.addEventListener('click', () => {
            toggleVerification(item.id);
        });
        
        auditFeedList.appendChild(row);
    });
}

// =========================================================================
// 7. DYNAMIC DUAL NET WORTH METRIC ENGINE
// =========================================================================
function updateDashboardMetrics() {
    const netWorthDisplay = document.getElementById('total-net-worth');
    const pendingImpactDisplay = document.getElementById('pending-impact-text');
    
    if (!netWorthDisplay || !pendingImpactDisplay) return;

    let totalCleared = 0;
    let totalPendingImpact = 0;

    accounts.forEach(acc => {
        const verifiedTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === true);
        const pendingTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === false);

        // Calculate Cleared Balance
        let accCleared = parseFloat(acc.balance);
        verifiedTransactions.forEach(item => {
            if (item.type === 'expense') accCleared -= item.amount;
            else if (item.type === 'income') accCleared += item.amount;
        });

        // Calculate Pending Impact
        let accPending = 0;
        pendingTransactions.forEach(item => {
            if (item.type === 'expense') accPending -= item.amount;
            else if (item.type === 'income') accPending += item.amount;
        });

        totalCleared += accCleared;
        totalPendingImpact += accPending;
    });

    // Update UI
    netWorthDisplay.textContent = `$${totalCleared.toFixed(2)}`;
    
    if (totalPendingImpact !== 0) {
        const sign = totalPendingImpact > 0 ? '+' : '';
        pendingImpactDisplay.textContent = `${sign}${totalPendingImpact.toFixed(2)} pending across unverified entries`;
    } else {
        pendingImpactDisplay.textContent = "All transactions verified.";
    }
}

// =========================================================================
// 8. UNIFIED EVENT PIPELINE SYNC ENGINE
// =========================================================================
function syncAllApplicationViews() {
    renderTransactions();
    renderAccounts();
    renderAuditFeed();
    updateDashboardMetrics();
}

// INITIALIZATION RUN ON BOOT
populateAccountDropdown();
syncAllApplicationViews();