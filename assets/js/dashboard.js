        // Display username from signup
        const currentUsername = localStorage.getItem('currentUsername');
        if (currentUsername) {
            document.getElementById('name').textContent = currentUsername;
        }

        Chart.register(ChartDataLabels);

        // Data & Config
        let transactions = [];
        let monthlyBudget = 3000; // Editable in future

        const categoryMap = { Rent: 0, Food: 1, Bills: 2, Shopping: 3, Travel: 4, Other: 5 };
        const categoryLabels = ['Rent', 'Food & Drinks', 'Bills', 'Shopping', 'Travel', 'Other'];

        // Load from LocalStorage
        if (localStorage.getItem('expenseTransactions')) {
            transactions = JSON.parse(localStorage.getItem('expenseTransactions'));
        }

        // Charts
        const donutCtx = document.getElementById('expenseDonut').getContext('2d');
        const expenseDonut = new Chart(donutCtx, {
            type: 'doughnut',
            data: { labels: categoryLabels, datasets: [{ data: [0,0,0,0,0,0], backgroundColor: ['#f45d12','#00bcbc','#006d6d','#ffa500','#007a7a','#fdd99b'], borderWidth: 4, borderColor: '#fff' }] },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: {
                        color: '#fff',
                        formatter: (val, ctx) => {
                            const sum = ctx.dataset.data.reduce((a,b) => a+b, 0);
                            return sum > 0 ? (val*100/sum).toFixed(1) + '%' : '';
                        }
                    }
                },
                cutout: '65%'
            }
        });

        const barCtx = document.getElementById('mainBarChart').getContext('2d');
        const barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                datasets: [
                    { label: 'Income', data: [0,0,0,0,0,0,0], backgroundColor: '#00bcbc' },
                    { label: 'Expenses', data: [0,0,0,0,0,0,0], backgroundColor: '#f45d12' }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });

        // Render table
        function renderTransactions(filtered = transactions) {
            const tbody = document.getElementById('transactionList');
            tbody.innerHTML = '';
            filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach((t, idx) => {
                const sign = t.amount > 0 ? '+' : '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${moment(t.date).format('MMM DD, YYYY')}</td>
                    <td>${t.name}</td>
                    <td>${t.category}</td>
                    <td><span class="badge ${t.type}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</span></td>
                    <td>${sign}$${Math.abs(t.amount).toFixed(2)}</td>
                    <td class="actions">
                        <button onclick="editTransaction(${idx})" title="Edit">✏️</button>
                        <button onclick="deleteTransaction(${idx})" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Update summaries and charts based on accurate date logic
        function updateSummaries() {
            const now = moment(); // Uses current real date (Dec 24, 2025 today)
            const monthStart = now.clone().startOf('month');
            const monthEnd = now.clone().endOf('month');

            const monthlyTrans = transactions.filter(t => moment(t.date).isBetween(monthStart, monthEnd, null, '[]'));

            const income = monthlyTrans.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
            const expense = Math.abs(monthlyTrans.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
            const balance = transactions.reduce((s, t) => s + t.amount, 0);

            document.getElementById('monthlyIncome').textContent = '$' + income.toFixed(2);
            document.getElementById('monthlyExpense').textContent = '$' + expense.toFixed(2);
            document.getElementById('totalBalance').textContent = '$' + balance.toFixed(2);

            const budgetPct = monthlyBudget > 0 ? (expense / monthlyBudget * 100) : 0;
            document.getElementById('budgetPercent').textContent = budgetPct.toFixed(0) + '%';
            document.getElementById('budgetBar').style.width = Math.min(100, budgetPct) + '%';

            // Donut: current month expenses by category
            const catData = [0,0,0,0,0,0];
            monthlyTrans.filter(t => t.type === 'expense').forEach(t => {
                const key = t.category.replace(' & Drinks', '');
                const idx = categoryMap[key] ?? 5;
                catData[idx] += Math.abs(t.amount);
            });
            expenseDonut.data.datasets[0].data = catData;
            expenseDonut.update();

            // Bar: last 7 days (accurate day mapping)
            const last7Income = [0,0,0,0,0,0,0];
            const last7Expense = [0,0,0,0,0,0,0];
            for (let i = 6; i >= 0; i--) {
                const day = now.clone().subtract(i, 'days');
                const dayStr = day.format('YYYY-MM-DD');
                const dayTrans = transactions.filter(t => t.date === dayStr);
                const dayIncome = dayTrans.filter(t => t.amount > 0).reduce((s,v) => s + v.amount, 0);
                const dayExpense = Math.abs(dayTrans.filter(t => t.amount < 0).reduce((s,v) => s + v.amount, 0));
                last7Income[6 - i] = dayIncome;
                last7Expense[6 - i] = dayExpense;
            }
            barChart.data.datasets[0].data = last7Income;
            barChart.data.datasets[1].data = last7Expense;
            barChart.update();
        }

        function saveToStorage() {
            localStorage.setItem('expenseTransactions', JSON.stringify(transactions));
        }

        function addEntry() {
            const name = document.getElementById('desc').value.trim();
            const amtStr = document.getElementById('amt').value;
            const category = document.getElementById('cat').value;
            const type = document.getElementById('type').value;
            const date = document.getElementById('transDate').value || moment().format('YYYY-MM-DD');

            if (!name || !amtStr) {
                Swal.fire('Error', 'Please fill description and amount', 'error');
                return;
            }
            const amount = parseFloat(amtStr);
            if (isNaN(amount) || amount <= 0) {
                Swal.fire('Error', 'Enter a valid positive amount', 'error');
                return;
            }

            const trans = {
                date,
                name,
                category: category === 'Food' ? 'Food & Drinks' : category,
                type,
                amount: type === 'expense' ? -amount : amount
            };

            transactions.push(trans);
            saveToStorage();
            renderTransactions();
            updateSummaries();

            document.getElementById('desc').value = '';
            document.getElementById('amt').value = '';
            document.getElementById('transDate').value = '';

            Swal.fire('Success', 'Transaction added!', 'success');
        }

        function editTransaction(index) {
            const t = transactions[index];
            Swal.fire({
                title: 'Edit Transaction',
                html: `
                    <input id="swal-desc" class="swal2-input" value="${t.name}">
                    <input id="swal-amt" type="number" step="0.01" class="swal2-input" value="${Math.abs(t.amount)}">
                    <select id="swal-cat" class="swal2-input">
                        ${['Rent','Food','Bills','Shopping','Travel','Other'].map(c => `<option value="${c}" ${t.category.replace(' & Drinks','')===c?'selected':''}>${c}</option>`).join('')}
                    </select>
                    <select id="swal-type" class="swal2-input">
                        <option value="expense" ${t.type==='expense'?'selected':''}>Expense</option>
                        <option value="income" ${t.type==='income'?'selected':''}>Income</option>
                    </select>
                    <input id="swal-date" type="date" class="swal2-input" value="${t.date}">
                `,
                showCancelButton: true,
                confirmButtonText: 'Save',
                preConfirm: () => {
                    const newAmt = parseFloat(document.getElementById('swal-amt').value);
                    if (isNaN(newAmt) || newAmt <= 0) {
                        Swal.showValidationMessage('Valid amount required');
                        return false;
                    }
                    return {
                        name: document.getElementById('swal-desc').value.trim(),
                        amount: document.getElementById('swal-type').value === 'expense' ? -newAmt : newAmt,
                        category: document.getElementById('swal-cat').value,
                        type: document.getElementById('swal-type').value,
                        date: document.getElementById('swal-date').value
                    };
                }
            }).then(result => {
                if (result.isConfirmed) {
                    transactions[index] = {
                        ...transactions[index],
                        ...result.value,
                        category: result.value.category === 'Food' ? 'Food & Drinks' : result.value.category
                    };
                    saveToStorage();
                    renderTransactions();
                    updateSummaries();
                    Swal.fire('Updated!', '', 'success');
                }
            });
        }

        function deleteTransaction(index) {
            Swal.fire({
                title: 'Delete?',
                text: 'This cannot be undone',
                icon: 'warning',
                showCancelButton: true
            }).then(result => {
                if (result.isConfirmed) {
                    transactions.splice(index, 1);
                    saveToStorage();
                    renderTransactions();
                    updateSummaries();
                    Swal.fire('Deleted!', '', 'success');
                }
            });
        }

        function applyFilters() {
            const search = document.getElementById('searchInput').value.toLowerCase();
            const cat = document.getElementById('categoryFilter').value;
            const date = document.getElementById('dateFilter').value;

            let filtered = transactions;
            if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search));
            if (cat) filtered = filtered.filter(t => t.category === (cat === 'Food' ? 'Food & Drinks' : cat));
            if (date) filtered = filtered.filter(t => t.date === date);

            renderTransactions(filtered);
        }

        // Initial load
        renderTransactions();
        updateSummaries();