// ==========================================
// 1. DOM ELEMENT HOOKS
// ==========================================
// We connect our JavaScript code to the specific HTML tags using their ID attributes
const descInput = document.getElementById('desc-input');
const amountInput = document.getElementById('amount-input');
const addBtn = document.getElementById('add-btn');
const transactionList = document.getElementById('transaction-list');

// ==========================================
// 2. STATE MANAGEMENT (Local Storage)
// ==========================================
// Check the device's storage vault first. If data exists, pull it. If not, start with an empty array [].
let transactions = JSON.parse(localStorage.getItem('localFinanceData')) || [];

// ==========================================
// 3. CORE PROCESSING FUNCTIONS
// ==========================================

// Function 1: Handle taking input from the screen and converting it to data
function addTransaction() {
    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // Guard Clause: Stop the engine if inputs are empty or invalid numbers
    if (description === '' || isNaN(amount)) {
        alert('Please enter a valid description and amount.');
        return;
    }

    // Package the raw input data into a clean JavaScript Object profile
    const transaction = {
        id: Date.now(), // Unique ID using millisecond tracking
        description: description,
        amount: amount
    };

    // Add our new data object to our primary data tracking list
    transactions.push(transaction);

    // Commit changes directly to the browser hard drive space
    saveToDevice();

    // Redraw the screen to display the updated ledger list
    renderUI();

    // Flush the text boxes so the user can type their next entry
    descInput.value = '';
    amountInput.value = '';
}

// Function 2: Stringify data and vacuum seal it into LocalStorage
function saveToDevice() {
    localStorage.setItem('localFinanceData', JSON.stringify(transactions));
}

// Function 3: Clear the visible list and redraw it completely using current data
function renderUI() {
    // Empty out any old HTML rows sitting inside the <ul> wrapper tag
    transactionList.innerHTML = '';

    // Step through each transaction item inside our array list
    transactions.forEach(function(item) {
        // Construct a completely new <li> item inside the browser's layout RAM
        const li = document.createElement('li');
        
        // Populate the list item structure with values from the object
        li.innerHTML = `
            <span>${item.description}</span>
            <strong>$${item.amount.toFixed(2)}</strong>
        `;

        // Physical append step: Insert the finished row onto the visible <ul> container
        transactionList.appendChild(li);
    });
}

// ==========================================
// 4. EVENTS & APP INITIALIZATION
// ==========================================
// Wire up the button element to watch for mouse clicks
addBtn.addEventListener('click', addTransaction);

// Initial Execution: Draw whatever data was left on the computer from past sessions
renderUI();