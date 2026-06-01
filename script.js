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

// Utilities (JSON Backup Engine)
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// =========================================================================
// 2. STATE STORAGE (Clarity Wallet Unified Core Memory)
// =========================================================================
let transactions = JSON.parse(localStorage.getItem('clarity_wallet_transactions')) || [];
let accounts = JSON.parse(localStorage.getItem('clarity_wallet_accounts')) || [];

// =========================================================================
// 3. SPA ROUTER SYSTEM (With Dynamic Dropdown Hook)
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

    // Force refresh the selection dropdown anytime the user switches to the transaction tab
    if (targetPageId === 'transactions-page') {
        populateAccountDropdown();
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', handleNavigation);
});

// =========================================================================
// 4. TRANSACTION LEDGER PROCESSING (With CRUD Splicing)
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
        accountId: Number(selectedAccountId), // Enforce safe integer key alignment
        category: selectedCategory,          // Relational linking for budgets
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

    const newAccount = {
        id: accountId,
        name: accountName,
        balance: 0.00 
    };

    accounts.push(newAccount);
    localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
    
    if (startingBalance > 0) {
        const initialDepositTx = {
            id: Date.now() + 1, 
            description: `Initial Vault Deposit - ${accountName}`,
            amount: startingBalance,
            accountId: accountId,
            category: 'Unassigned',
            type: 'income',
            verified: false // Demands human verification to adjust balance baseline
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
        const verifiedTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === true);
        let currentCalculatedBalance = parseFloat(acc.balance);

        verifiedTransactions.forEach(item => {
            if (item.type === 'expense') {
                currentCalculatedBalance -= item.amount;
            } else if (item.type === 'income') {
                currentCalculatedBalance += item.amount;
            }
        });

        const isNegative = currentCalculatedBalance < 0;
        const balanceColorStyle = isNegative ? 'style="color: #df4759;"' : '';

        const card = document.createElement('div');
        card.className = 'account-card';
        if (isNegative) card.style.borderTop = "4px solid #df4759"; // Inject negative alert badge formatting

        card.innerHTML = `
            <h4 class="account-card-title">🏦 ${acc.name}</h4>
            <p class="account-card-balance" ${balanceColorStyle}>$${currentCalculatedBalance.toFixed(2)}</p>
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
        const categoryLabel = item.category || 'Unassigned';
        
        const isExpense = item.type === 'expense';
        const displaySign = isExpense ? '-' : '+';
        const amountColor = isExpense ? '#df4759' : '#10b981';

        const row = document.createElement('div');
        row.className = 'audit-item-row';
        
        row.innerHTML = `
            <div class="audit-item-details">
                <strong style="color:var(--text-main); font-size:15px;">${item.description}</strong>
                <span class="audit-item-meta">Account: <strong>${accountName}</strong> | Cat: <strong>${categoryLabel}</strong> | Value: <span style="color:${amountColor}; font-weight:600;">${displaySign}$${item.amount.toFixed(2)}</span></span>
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
// 7. DYNAMIC UNIFIED NET WORTH METRIC ENGINE
// =========================================================================
function updateDashboardMetrics() {
    const netWorthDisplay = document.getElementById('total-net-worth');
    const pendingImpactDisplay = document.getElementById('pending-impact-text');
    
    if (!netWorthDisplay || !pendingImpactDisplay) return;

    let totalClearedNetWorth = 0;
    let totalPendingImpact = 0;

    accounts.forEach(acc => {
        const verifiedTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === true);
        const pendingTransactions = transactions.filter(item => item.accountId === acc.id && item.verified === false);

        let accountClearedBalance = parseFloat(acc.balance); 
        verifiedTransactions.forEach(item => {
            if (item.type === 'expense') accountClearedBalance -= item.amount;
            else if (item.type === 'income') accountClearedBalance += item.amount;
        });

        let accountPendingImpact = 0;
        pendingTransactions.forEach(item => {
            if (item.type === 'expense') accountPendingImpact -= item.amount;
            else if (item.type === 'income') accountPendingImpact += item.amount;
        });

        totalClearedNetWorth += accountClearedBalance;
        totalPendingImpact += accountPendingImpact;
    });

    // Update UI
    netWorthDisplay.textContent = `$${totalClearedNetWorth.toFixed(2)}`;
    
    if (totalClearedNetWorth < 0) {
        netWorthDisplay.style.color = "#df4759";
    } else {
        netWorthDisplay.style.color = "var(--text-main)";
    }
    
    if (totalPendingImpact !== 0) {
        const sign = totalPendingImpact > 0 ? '+' : '';
        pendingImpactDisplay.textContent = `(${sign}${totalPendingImpact.toFixed(2)} pending across unverified entries)`;
    } else {
        pendingImpactDisplay.textContent = "All transactions verified.";
    }
}

// =========================================================================
// 8. LOCAL DATA MANAGEMENT WORKFLOWS (Import/Export Backup Engine)
// =========================================================================
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (accounts.length === 0 && transactions.length === 0) {
            alert("There is no ledger data available to back up yet.");
            return;
        }
        const backupPackage = {
            accounts: accounts,
            transactions: transactions,
            exportedAt: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPackage));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `clarity_wallet_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    
    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsedData = JSON.parse(e.target.result);
                
                if (Array.isArray(parsedData.accounts) && Array.isArray(parsedData.transactions)) {
                    if (confirm("Are you sure you want to import this ledger backup? This will completely replace your current local dashboard data.")) {
                        accounts = parsedData.accounts;
                        transactions = parsedData.transactions;
                        
                        localStorage.setItem('clarity_wallet_accounts', JSON.stringify(accounts));
                        localStorage.setItem('clarity_wallet_transactions', JSON.stringify(transactions));
                        
                        populateAccountDropdown();
                        syncAllApplicationViews();
                        alert("Ledger restored successfully!");
                    }
                } else {
                    alert("Import failed: File format does not match Clarity Wallet architecture specifications.");
                }
            } catch (err) {
                alert("Error compiling data file. Please ensure it is a valid JSON backup file.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
}

// =========================================================================
// 9. UNIFIED EVENT PIPELINE SYNC ENGINE
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