// Check if user is authenticated
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'Register.html';
}

function confirmLogout() {
    Swal.fire({
        title: 'Logout Confirmation',
        text: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            logout();
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'Register.html';
}

const profileName = document.getElementById('profile-name');
const currentUsername = localStorage.getItem('currentUsername') || 'User';
profileName.textContent = currentUsername;

// Handle profile picture upload
document.getElementById('profilePictureInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const imageData = event.target.result;
        localStorage.setItem('profilePicture', imageData);
        
        // Update both sidebar and settings preview
        document.getElementById('profilePicture').src = imageData;
        const settingsPic = document.getElementById('settingsProfilePicture');
        if (settingsPic) settingsPic.src = imageData;
        
        Swal.fire('Success!', 'Profile picture updated', 'success');
    };
    reader.readAsDataURL(file);
});

// Load profile picture on page load
function loadProfilePicture() {
    const savedPicture = localStorage.getItem('profilePicture');
    if (savedPicture && savedPicture.trim()) {
        try {
            const profilePicElement = document.getElementById('profilePicture');
            const settingsPicElement = document.getElementById('settingsProfilePicture');
            
            if (profilePicElement) {
                profilePicElement.src = savedPicture;
            }
            if (settingsPicElement) {
                settingsPicElement.src = savedPicture;
            }
        } catch (error) {
            console.error('Error loading profile picture:', error);
        }
    }
}

let transactions = JSON.parse(localStorage.getItem('spendwise_final')) || [];
let currentPeriod = 'daily';
const budgetLimits = { daily: 60, weekly: 400, monthly: 1600 };

const donutChart = new Chart(document.getElementById('expenseDonut').getContext('2d'), {
    type: 'doughnut',
    data: {
        labels: ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'],
        datasets: [{ backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#ef4444', '#f59e0b', '#94a3b8'], data: [0, 0, 0, 0, 0, 0] }]
    },
    options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
});

const trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
    type: 'bar',
    data: {
        labels: [], datasets: [
            { label: 'Income', backgroundColor: '#10b981', data: [], borderRadius: 5 },
            { label: 'Expense', backgroundColor: '#ef4444', data: [], borderRadius: 5 }
        ]
    },
    options: { responsive: true, scales: { x: { grid: { display: false } } } }
});

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    document.getElementById('nav-' + pageId).classList.add('active');
    updateUI();
}

function updateUI() {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    document.getElementById('income').textContent = `$${inc.toFixed(2)}`;
    document.getElementById('expenses').textContent = `$${exp.toFixed(2)}`;
    document.getElementById('balance').textContent = `$${(inc - exp).toFixed(2)}`;

    const todayExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'day')).reduce((s, t) => s + t.amount, 0);
    const weekExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'week')).reduce((s, t) => s + t.amount, 0);
    const monthExp = transactions.filter(t => t.type === 'expense' && moment(t.date).isSame(moment(), 'month')).reduce((s, t) => s + t.amount, 0);

    let usage = (currentPeriod === 'daily') ? todayExp : (currentPeriod === 'weekly' ? weekExp : monthExp);
    let limit = budgetLimits[currentPeriod];
    let pct = Math.min(100, (usage / limit) * 100);

    document.getElementById('budgetLabel').textContent = `${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Progress`;
    document.getElementById('budgetUsed').textContent = Math.round(pct) + '%';
    document.getElementById('budgetBar').style.width = pct + '%';
    document.getElementById('budgetBar').style.background = pct > 90 ? 'var(--danger)' : 'var(--primary)';

    const cats = ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];
    const data = cats.map(c => transactions.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + t.amount, 0));
    donutChart.data.datasets[0].data = data;
    donutChart.update();

    updateTrend();
    renderTable();
}


function updateTrend() {
    let labels = [], incD = [], expD = [];
    if (currentPeriod === 'daily') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const start = moment().startOf('isoWeek');
        for (let i = 0; i < 7; i++) {
            const d = start.clone().add(i, 'days');
            const dayT = transactions.filter(t => moment(t.date).isSame(d, 'day'));
            incD.push(dayT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(dayT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    } else if (currentPeriod === 'weekly') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const start = moment().startOf('month');
        for (let i = 0; i < 4; i++) {
            const weekT = transactions.filter(t => moment(t.date).isBetween(start.clone().add(i, 'weeks'), start.clone().add(i + 1, 'weeks'), null, '[)'));
            incD.push(weekT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(weekT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    } else {
        labels = moment.monthsShort();
        for (let i = 0; i < 12; i++) {
            const monthT = transactions.filter(t => moment(t.date).month() === i);
            incD.push(monthT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expD.push(monthT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
    }
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = incD;
    trendChart.data.datasets[1].data = expD;
    trendChart.update();
}

function saveTransaction() {
    const desc = document.getElementById('desc').value;
    const amt = parseFloat(document.getElementById('amt').value);
    const idx = parseInt(document.getElementById('editIndex').value);
    const date = document.getElementById('transDate').value || moment().format('YYYY-MM-DD');

    if (!desc || isNaN(amt)) return Swal.fire('Error', 'Invalid details', 'error');

    const item = { name: desc, amount: amt, category: document.getElementById('cat').value, type: document.getElementById('type').value, date: date };
    if (idx === -1) transactions.push(item); else transactions[idx] = item;

    localStorage.setItem('spendwise_final', JSON.stringify(transactions));
    clearForm();
    updateUI();
    Swal.fire('Saved!', 'Transaction updated successfully', 'success');
}

function editT(idx) {
    const t = transactions[idx];
    document.getElementById('desc').value = t.name;
    document.getElementById('amt').value = t.amount;
    document.getElementById('cat').value = t.category;
    document.getElementById('type').value = t.type;
    document.getElementById('transDate').value = t.date;
    document.getElementById('editIndex').value = idx;

    // UI changes for Edit Mode
    document.getElementById('formTitle').textContent = "Edit Record";
    document.getElementById('saveBtn').textContent = "Update";
    document.getElementById('cancelBtn').style.display = "inline-block"; // Show Cancel button
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function clearForm() {
    document.getElementById('desc').value = '';
    document.getElementById('amt').value = '';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('transDate').value = '';
    document.getElementById('formTitle').textContent = "Add Record";
    document.getElementById('saveBtn').textContent = "Save";
    document.getElementById('cancelBtn').style.display = "none"; // Hide Cancel button
}

function deleteT(idx) {
    Swal.fire({
        title: 'Delete this record?',
        text: "You won't be able to recover this transaction.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    }).then((res) => {
        if (res.isConfirmed) {
            transactions.splice(idx, 1);
            localStorage.setItem('spendwise_final', JSON.stringify(transactions));
            updateUI();
            Swal.fire('Deleted', 'Transaction removed.', 'success');
        }
    });
}

function renderTable() {
    const list = document.getElementById('transactionList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Map with original indices to ensure edit/delete works on the right item
    const mappedData = transactions.map((t, i) => ({ ...t, originalIndex: i }));

    // Filter by search term
    const filtered = mappedData.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm)
    );

    list.innerHTML = filtered.slice().reverse().map((t) => {
        return `<tr>
                    <td>${t.date}</td>
                    <td style="font-weight:700">${t.name}</td>
                    <td><span class="badge ${t.type === 'income' ? 'badge-inc' : 'badge-exp'}">${t.category}</span></td>
                    <td style="font-weight:bold; color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
                        ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                    </td>
                    <td>
                        <button class="btn-icon edit-btn" onclick="editT(${t.originalIndex})">✏️</button>
                        <button class="btn-icon del-btn" onclick="deleteT(${t.originalIndex})">🗑</button>
                    </td>
                </tr>`;
    }).join('');
}

function exportToCSV() {
    let csv = "Date,Item,Category,Type,Amount\n";
    transactions.forEach(t => csv += `${t.date},${t.name},${t.category},${t.type},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SpendWise_History.csv'; a.click();
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("SpendWise Transaction History", 14, 15);
    doc.autoTable({
        startY: 20,
        head: [['Date', 'Item', 'Category', 'Type', 'Amount']],
        body: transactions.map(t => [t.date, t.name, t.category, t.type, `$${t.amount.toFixed(2)}`])
    });
    doc.save("SpendWise_History.pdf");
}

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        updateUI();
    };
});

function saveSettings() {
    const profileName = document.getElementById('profileName').value;
    const dailyBudget = parseFloat(document.getElementById('dailyBudget').value);

    if (!profileName || isNaN(dailyBudget) || dailyBudget <= 0) {
        Swal.fire('Error', 'Please fill in all fields correctly', 'error');
        return;
    }

    localStorage.setItem('currentUsername', profileName);
    budgetLimits.daily = dailyBudget;
    budgetLimits.weekly = dailyBudget * 7;
    budgetLimits.monthly = dailyBudget * 30;
    
    document.getElementById('profile-name').textContent = profileName;
    updateUI();
    Swal.fire('Success!', 'Profile settings saved successfully', 'success');
}

function saveBudgetSettings() {
    const weeklyBudget = parseFloat(document.getElementById('weeklyBudget').value);
    const monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value);
    const alertThreshold = parseInt(document.getElementById('budgetAlert').value);

    if (isNaN(weeklyBudget) || isNaN(monthlyBudget) || weeklyBudget < 0 || monthlyBudget < 0) {
        Swal.fire('Error', 'Please enter valid budget amounts', 'error');
        return;
    }

    budgetLimits.weekly = weeklyBudget;
    budgetLimits.monthly = monthlyBudget;
    localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
    localStorage.setItem('budgetAlertThreshold', alertThreshold);

    Swal.fire('Success!', 'Budget settings saved successfully', 'success');
}

function saveDisplaySettings() {
    const currency = document.getElementById('currencySelect').value;
    const reportingPeriod = document.getElementById('reportingPeriod').value;

    localStorage.setItem('currency', currency);
    localStorage.setItem('reportingPeriod', reportingPeriod);
    currentPeriod = reportingPeriod;
    updateUI();

    Swal.fire('Success!', 'Display settings saved successfully', 'success');
}

function saveVisualizationSettings() {
    const chartType = document.getElementById('chartType').value;
    const enableNotifications = document.getElementById('enableNotifications').checked;

    localStorage.setItem('chartType', chartType);
    localStorage.setItem('enableNotifications', enableNotifications);

    Swal.fire('Success!', 'Visualization settings saved successfully', 'success');
}

function addCategory() {
    const newCategory = document.getElementById('newCategory').value.trim();
    
    if (!newCategory) {
        Swal.fire('Error', 'Please enter a category name', 'error');
        return;
    }

    let categories = JSON.parse(localStorage.getItem('spendwise_categories')) || 
        ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];

    if (categories.includes(newCategory)) {
        Swal.fire('Error', 'This category already exists', 'error');
        return;
    }

    categories.push(newCategory);
    localStorage.setItem('spendwise_categories', JSON.stringify(categories));
    document.getElementById('newCategory').value = '';
    loadCategories();

    Swal.fire('Success!', 'Category added successfully', 'success');
}

function removeCategory(category) {
    Swal.fire({
        title: 'Delete Category?',
        text: `Remove "${category}" from categories?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            let categories = JSON.parse(localStorage.getItem('spendwise_categories')) || [];
            categories = categories.filter(c => c !== category);
            localStorage.setItem('spendwise_categories', JSON.stringify(categories));
            loadCategories();
            Swal.fire('Deleted!', 'Category removed successfully', 'success');
        }
    });
}

function loadCategories() {
    const categories = JSON.parse(localStorage.getItem('spendwise_categories')) || 
        ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];
    
    const list = document.getElementById('categoriesList');
    list.innerHTML = categories.map(cat => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f3f4f6; border-radius: 6px;">
            <span>${cat}</span>
            <button class="btn-icon del-btn" onclick="removeCategory('${cat}')" style="padding: 4px 8px;">✕</button>
        </div>
    `).join('');
}

function addRecurringExpense() {
    const name = document.getElementById('recurringName').value.trim();
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const frequency = document.getElementById('recurringFrequency').value;

    if (!name || isNaN(amount) || amount <= 0) {
        Swal.fire('Error', 'Please fill in all fields correctly', 'error');
        return;
    }

    let recurringExpenses = JSON.parse(localStorage.getItem('spendwise_recurring')) || [];
    recurringExpenses.push({ name, amount, frequency, id: Date.now() });
    localStorage.setItem('spendwise_recurring', JSON.stringify(recurringExpenses));

    document.getElementById('recurringName').value = '';
    document.getElementById('recurringAmount').value = '';
    loadRecurringExpenses();

    Swal.fire('Success!', 'Recurring expense added successfully', 'success');
}

function removeRecurringExpense(id) {
    Swal.fire({
        title: 'Delete Recurring Expense?',
        text: 'This recurring expense will be removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            let recurringExpenses = JSON.parse(localStorage.getItem('spendwise_recurring')) || [];
            recurringExpenses = recurringExpenses.filter(r => r.id !== id);
            localStorage.setItem('spendwise_recurring', JSON.stringify(recurringExpenses));
            loadRecurringExpenses();
            Swal.fire('Deleted!', 'Recurring expense removed successfully', 'success');
        }
    });
}

function loadRecurringExpenses() {
    const recurringExpenses = JSON.parse(localStorage.getItem('spendwise_recurring')) || [];
    const list = document.getElementById('recurringList');

    if (recurringExpenses.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 14px;">No recurring expenses added yet.</p>';
        return;
    }

    list.innerHTML = recurringExpenses.map(expense => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
            <div>
                <div style="font-weight: 500;">${expense.name}</div>
                <div style="font-size: 12px; color: #666;">$${expense.amount.toFixed(2)} / ${expense.frequency}</div>
            </div>
            <button class="btn-icon del-btn" onclick="removeRecurringExpense(${expense.id})" style="padding: 4px 8px;">🗑️</button>
        </div>
    `).join('');
}

function exportSettingsJSON() {
    const settings = {
        profile: {
            username: localStorage.getItem('currentUsername'),
            budgetLimits: budgetLimits
        },
        categories: JSON.parse(localStorage.getItem('spendwise_categories')),
        recurring: JSON.parse(localStorage.getItem('spendwise_recurring')),
        display: {
            currency: localStorage.getItem('currency'),
            reportingPeriod: localStorage.getItem('reportingPeriod'),
            chartType: localStorage.getItem('chartType'),
            enableNotifications: localStorage.getItem('enableNotifications')
        },
        transactions: JSON.parse(localStorage.getItem('spendwise_final'))
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpendWise_Backup_${moment().format('YYYY-MM-DD_HHmmss')}.json`;
    a.click();
    Swal.fire('Success!', 'Settings exported successfully', 'success');
}

function importSettingsJSON() {
    document.getElementById('importFile').click();
}

document.getElementById('importFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const settings = JSON.parse(event.target.result);
            
            localStorage.setItem('currentUsername', settings.profile.username);
            localStorage.setItem('spendwise_categories', JSON.stringify(settings.categories));
            localStorage.setItem('spendwise_recurring', JSON.stringify(settings.recurring));
            localStorage.setItem('currency', settings.display.currency);
            localStorage.setItem('reportingPeriod', settings.display.reportingPeriod);
            localStorage.setItem('chartType', settings.display.chartType);
            localStorage.setItem('enableNotifications', settings.display.enableNotifications);
            localStorage.setItem('spendwise_final', JSON.stringify(settings.transactions));

            Swal.fire('Success!', 'Settings imported successfully. Please refresh the page.', 'success');
        } catch (error) {
            Swal.fire('Error', 'Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
});

function clearAllData() {
    Swal.fire({
        title: 'Clear All Data?',
        text: 'This will delete all your transactions, settings, and preferences. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, clear everything!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            Swal.fire('Cleared!', 'All data has been cleared. Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'Register.html';
            }, 2000);
        }
    });
}

function loadSettings() {
    const profileName = localStorage.getItem('currentUsername') || 'User';
    const currency = localStorage.getItem('currency') || 'USD';
    const reportingPeriod = localStorage.getItem('reportingPeriod') || 'daily';
    const chartType = localStorage.getItem('chartType') || 'donut';
    const enableNotifications = localStorage.getItem('enableNotifications') !== 'false';

    document.getElementById('profileName').value = profileName;
    document.getElementById('dailyBudget').value = budgetLimits.daily || 60;
    document.getElementById('weeklyBudget').value = budgetLimits.weekly || 400;
    document.getElementById('monthlyBudget').value = budgetLimits.monthly || 1600;
    document.getElementById('currencySelect').value = currency;
    document.getElementById('reportingPeriod').value = reportingPeriod;
    document.getElementById('chartType').value = chartType;
    document.getElementById('enableNotifications').checked = enableNotifications;
    document.getElementById('loggedInUser').textContent = profileName;

    loadProfilePicture();
    loadCategories();
    loadRecurringExpenses();
}

function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        Swal.fire('Error', 'Please select both start and end dates', 'error');
        return;
    }

    const start = moment(startDate);
    const end = moment(endDate);

    if (start.isAfter(end)) {
        Swal.fire('Error', 'Start date must be before end date', 'error');
        return;
    }

    // Filter transactions within date range
    const reportTrans = transactions.filter(t => 
        moment(t.date).isBetween(start, end, null, '[]')
    );

    if (reportTrans.length === 0) {
        Swal.fire('No Data', 'No transactions found in the selected date range', 'info');
        return;
    }

    // Calculate category breakdown
    const cats = ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];
    const catData = cats.map(c => {
        const total = reportTrans
            .filter(t => t.type === 'expense' && t.category === c)
            .reduce((s, t) => s + t.amount, 0);
        return { category: c, amount: total };
    }).filter(d => d.amount > 0);

    const totalExpense = catData.reduce((s, d) => s + d.amount, 0);
    const totalIncome = reportTrans
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    // Generate report HTML
    let reportHTML = `
        <div style="font-size: 14px; line-height: 1.6;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Income</div>
                    <div style="font-size: 20px; font-weight: bold; color: #10b981;">$${totalIncome.toFixed(2)}</div>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Expenses</div>
                    <div style="font-size: 20px; font-weight: bold; color: #ef4444;">$${totalExpense.toFixed(2)}</div>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Net Balance</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${totalBalance >= 0 ? '#10b981' : '#ef4444'};">$${totalBalance.toFixed(2)}</div>
                </div>
            </div>

            <h4 style="margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Breakdown</h4>
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">This section explains the numbers behind the summary:</p>
    `;

    catData.forEach(item => {
        const percentage = ((item.amount / totalExpense) * 100).toFixed(0);
        reportHTML += `
            <div style="margin-bottom: 15px; padding: 12px; background: #fafafa; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="font-weight: bold;">${item.category}</div>
                    <div style="font-weight: bold; color: #3b82f6;">$${item.amount.toFixed(2)} (${percentage}%)</div>
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${getCategoryDescription(item.category, item.amount)}
                </div>
            </div>
        `;
    });

    reportHTML += `
            <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong>Report Period:</strong> ${startDate} to ${endDate}<br>
                <strong>Total Transactions:</strong> ${reportTrans.length}
            </div>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHTML;
    document.getElementById('reportResult').style.display = 'block';
    Swal.fire('Success', 'Report generated successfully', 'success');
}

function getCategoryDescription(category, amount) {
    const descriptions = {
        'Food & Drinks': `Includes groceries and dining out. Current spending: $${amount.toFixed(2)}.`,
        'Rent': `Housing and accommodation costs. Current amount: $${amount.toFixed(2)}.`,
        'Bills': `Utilities including electricity, water, and internet. Current amount: $${amount.toFixed(2)}.`,
        'Shopping': `Retail and personal purchases. Current spending: $${amount.toFixed(2)}.`,
        'Travel': `Transportation costs including fuel and public transit. Current amount: $${amount.toFixed(2)}.`,
        'Other': `Miscellaneous expenses. Current amount: $${amount.toFixed(2)}.`
    };
    return descriptions[category] || `${category} expenses: $${amount.toFixed(2)}.`;
}

function exportReportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    doc.text("SpendWise - Financial Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Report Period: ${startDate} to ${endDate}`, 14, 25);

    const reportContent = document.getElementById('reportContent').innerText;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(reportContent, 180);
    doc.text(lines, 14, 35);

    doc.save(`SpendWise_Report_${startDate}_to_${endDate}.pdf`);
}

// Form event listeners
document.getElementById('saveBtn')?.addEventListener('click', saveTransaction);
document.getElementById('cancelBtn')?.addEventListener('click', clearForm);
document.getElementById('searchInput')?.addEventListener('input', renderTable);
document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);
document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
document.getElementById('logoutBtn')?.addEventListener('click', logout);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProfilePicture();
    loadSettings();
    updateUI();
    renderTable();
    showPage('dashboard');
});
