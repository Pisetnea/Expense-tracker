// Check if user is authenticated
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'Register.html';
}

// Default categories
const defaultCategories = ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'];

// Get categories from localStorage or use defaults
function getCategories() {
    return JSON.parse(localStorage.getItem('expenseCategories') || JSON.stringify(defaultCategories));
}

// Populate category dropdown in transactions page
function populateCategoryDropdown() {
    const catSelect = document.getElementById('cat');
    if (!catSelect) return;
    
    const categories = getCategories();
    catSelect.innerHTML = categories.map(cat => `<option>${cat}</option>`).join('');
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'Register.html';
}

function confirmLogout() {
    Swal.fire({
        title: 'Logout',
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

const profileName = document.getElementById('profile-name');
const currentUsername = localStorage.getItem('currentUsername') || 'User';
profileName.textContent = currentUsername;

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
    
    // Reload settings form when settings page is opened
    if (pageId === 'settings') {
        loadSettings();
    }
    
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
    Swal.fire('Success!', 'Settings saved successfully', 'success');
}

function saveProfile() {
    const profileName = document.getElementById('profileName').value;
    
    if (!profileName || profileName.trim() === '') {
        Swal.fire('Error', 'Please enter a valid name', 'error');
        return;
    }

    localStorage.setItem('currentUsername', profileName);
    document.getElementById('profile-name').textContent = profileName;
    
    // Handle profile image if uploaded
    const profileImageFile = document.getElementById('profileImage').files[0];
    if (profileImageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            localStorage.setItem('profileImage', imageData);
            document.querySelector('.profile img').src = imageData;
            document.getElementById('profileImagePreview').src = imageData;
            Swal.fire('Success!', 'Profile updated successfully', 'success');
        };
        reader.readAsDataURL(profileImageFile);
    } else {
        Swal.fire('Success!', 'Profile updated successfully', 'success');
    }
}

function saveBudget() {
    const dailyBudget = parseFloat(document.getElementById('dailyBudget').value);
    const monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value);

    if ((isNaN(dailyBudget) || dailyBudget < 0) && (isNaN(monthlyBudget) || monthlyBudget < 0)) {
        Swal.fire('Error', 'Please enter at least one valid budget', 'error');
        return;
    }

    if (!isNaN(dailyBudget) && dailyBudget > 0) {
        budgetLimits.daily = dailyBudget;
        budgetLimits.weekly = dailyBudget * 7;
        budgetLimits.monthly = dailyBudget * 30;
        localStorage.setItem('budgetDaily', dailyBudget.toString());
    }

    if (!isNaN(monthlyBudget) && monthlyBudget > 0) {
        budgetLimits.monthly = monthlyBudget;
        localStorage.setItem('budgetMonthly', monthlyBudget.toString());
    }

    updateUI();
    Swal.fire('Success!', 'Budget settings saved', 'success');
}

// Categories Management
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const savedCategories = getCategories();
    
    container.innerHTML = savedCategories.map((cat, idx) => `
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 500;">${cat}</span>
            <button class="btn-icon del-btn" onclick="deleteCategory(${idx})" style="background: none; border: none; cursor: pointer; font-size: 14px;">✕</button>
        </div>
    `).join('');
}

function addCategory() {
    const input = document.getElementById('newCategory');
    const newCat = input.value.trim();

    if (!newCat) {
        Swal.fire('Error', 'Please enter a category name', 'error');
        return;
    }

    const savedCategories = getCategories();
    
    if (savedCategories.includes(newCat)) {
        Swal.fire('Error', 'This category already exists', 'error');
        return;
    }

    savedCategories.push(newCat);
    localStorage.setItem('expenseCategories', JSON.stringify(savedCategories));
    input.value = '';
    renderCategories();
    populateCategoryDropdown();
    Swal.fire('Success!', 'Category added successfully', 'success');
}

function deleteCategory(idx) {
    Swal.fire({
        title: 'Delete Category?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            const savedCategories = getCategories();
            savedCategories.splice(idx, 1);
            localStorage.setItem('expenseCategories', JSON.stringify(savedCategories));
            renderCategories();
            populateCategoryDropdown();
            Swal.fire('Deleted!', 'Category removed', 'success');
        }
    });
}

function saveCurrency() {
    const currency = document.getElementById('currency').value;
    localStorage.setItem('preferredCurrency', currency);
    Swal.fire('Success!', `Currency changed to ${currency}`, 'success');
}

function saveReportSettings() {
    const period = document.getElementById('reportPeriod').value;
    const chartPie = document.getElementById('chartPie').checked;
    const chartBar = document.getElementById('chartBar').checked;
    const chartLine = document.getElementById('chartLine').checked;
    const exportPDF = document.getElementById('exportPDF').checked;
    const exportCSV = document.getElementById('exportCSV').checked;
    const exportExcel = document.getElementById('exportExcel').checked;

    localStorage.setItem('reportPeriod', period);
    localStorage.setItem('chartSettings', JSON.stringify({ pie: chartPie, bar: chartBar, line: chartLine }));
    localStorage.setItem('exportSettings', JSON.stringify({ pdf: exportPDF, csv: exportCSV, excel: exportExcel }));

    Swal.fire('Success!', 'Report settings saved', 'success');
}

// Recurring Expenses
function renderRecurringExpenses() {
    const container = document.getElementById('recurringContainer');
    const recurring = JSON.parse(localStorage.getItem('recurringExpenses') || '[]');
    
    if (recurring.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 13px;">No recurring expenses yet</p>';
        return;
    }

    container.innerHTML = recurring.map((exp, idx) => `
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 500;">${exp.name}</div>
                <div style="font-size: 12px; color: #666;">${exp.frequency} • $${exp.amount.toFixed(2)}</div>
            </div>
            <button class="btn-icon del-btn" onclick="deleteRecurringExpense(${idx})" style="background: none; border: none; cursor: pointer; font-size: 14px;">✕</button>
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

    const recurring = JSON.parse(localStorage.getItem('recurringExpenses') || '[]');
    recurring.push({ name, amount, frequency });
    localStorage.setItem('recurringExpenses', JSON.stringify(recurring));
    
    document.getElementById('recurringName').value = '';
    document.getElementById('recurringAmount').value = '';
    renderRecurringExpenses();
    Swal.fire('Success!', 'Recurring expense added', 'success');
}

function deleteRecurringExpense(idx) {
    const recurring = JSON.parse(localStorage.getItem('recurringExpenses') || '[]');
    recurring.splice(idx, 1);
    localStorage.setItem('recurringExpenses', JSON.stringify(recurring));
    renderRecurringExpenses();
    Swal.fire('Deleted!', 'Recurring expense removed', 'success');
}

function loadSettings() {
    const profileName = localStorage.getItem('currentUsername') || 'User';
    const profileImage = localStorage.getItem('profileImage');
    
    document.getElementById('profileName').value = profileName;
    document.getElementById('dailyBudget').value = budgetLimits.daily || 60;
    document.getElementById('monthlyBudget').value = budgetLimits.monthly || 1600;
    document.getElementById('currency').value = localStorage.getItem('preferredCurrency') || 'USD';
    document.getElementById('reportPeriod').value = localStorage.getItem('reportPeriod') || 'monthly';

    // Load profile image
    if (profileImage) {
        document.getElementById('profileImagePreview').src = profileImage;
        document.querySelector('.profile img').src = profileImage;
    }

    const chartSettings = JSON.parse(localStorage.getItem('chartSettings') || '{"pie":true,"bar":true,"line":false}');
    document.getElementById('chartPie').checked = chartSettings.pie;
    document.getElementById('chartBar').checked = chartSettings.bar;
    document.getElementById('chartLine').checked = chartSettings.line;

    const exportSettings = JSON.parse(localStorage.getItem('exportSettings') || '{"pdf":true,"csv":true,"excel":false}');
    document.getElementById('exportPDF').checked = exportSettings.pdf;
    document.getElementById('exportCSV').checked = exportSettings.csv;
    document.getElementById('exportExcel').checked = exportSettings.excel;

    renderCategories();
    renderRecurringExpenses();
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
    populateCategoryDropdown();
    loadSettings();
    updateUI();
    renderTable();
    showPage('dashboard');
});
