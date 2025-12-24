        Chart.register(ChartDataLabels);

        // Transaction data structure
        let transactions = [];
        let monthlyBudget = 3300; // Example budget (can be made editable later)

        // Category mapping for donut chart
        const categoryMap = {
            Rent: 0,
            Food: 1,
            Bills: 2,
            Shopping: 3,
            Travel: 4,
            Other: 5
        };

        // Initialize charts
        const donutCtx = document.getElementById('expenseDonut').getContext('2d');
        const expenseDonutChart = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Rent', 'Food', 'Bills', 'Shopping', 'Travel', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: ['#f45d12', '#00bcbc', '#006d6d', '#ffa500', '#007a7a', '#fdd99b'],
                    borderWidth: 4,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: '800', size: 12 },
                        formatter: (value, ctx) => {
                            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let percentage = sum > 0 ? (value * 100 / sum).toFixed(1) + "%" : '';
                            return value > 0 ? percentage : '';
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
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    { label: 'Income', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#00bcbc', borderRadius: 5 },
                    { label: 'Expenses', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#f45d12', borderRadius: 5 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
            }
        });

        // Load initial dummy data
        function loadInitialData() {
            const initial = [
                { date: '2025-12-20', name: 'Supermarket Purchase', category: 'Food', type: 'expense', amount: 120.50 },
                { date: '2025-12-19', name: 'Monthly Salary', category: 'Other', type: 'income', amount: 6000.00 },
                { date: '2025-12-15', name: 'Electricity Bill', category: 'Bills', type: 'expense', amount: 180.00 },
                { date: '2025-12-10', name: 'Rent Payment', category: 'Rent', type: 'expense', amount: 1200.00 },
                { date: '2025-12-05', name: 'Online Shopping', category: 'Shopping', type: 'expense', amount: 350.00 }
            ];
            initial.forEach(t => addTransaction(t, false));
        }

        // Add transaction (from form or initial data)
        function addEntry() {
            const name = document.getElementById('desc').value.trim();
            const amountStr = document.getElementById('amt').value;
            const category = document.getElementById('cat').value;
            const type = document.getElementById('type').value;

            if (!name || !amountStr) {
                alert("Please fill in transaction name and amount");
                return;
            }

            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
                alert("Please enter a valid positive amount");
                return;
            }

            const transaction = {
                date: new Date().toISOString().split('T')[0],
                name,
                category,
                type,
                amount: type === 'expense' ? -amount : amount  // negative for expense in calculations
            };

            addTransaction(transaction, true);

            // Clear form
            document.getElementById('desc').value = '';
            document.getElementById('amt').value = '';
        }

        function addTransaction(trans, updateUI = true) {
            transactions.push(trans);

            if (updateUI) {
                // Add row to table
                const tbody = document.getElementById('transactionList');
                const sign = trans.amount > 0 ? '+' : '-';
                const absAmount = Math.abs(trans.amount).toFixed(2);
                const row = document.createElement('tr');
                row.dataset.id = transactions.length - 1;
                row.innerHTML = `
                    <td>${trans.date}</td>
                    <td>${trans.name}</td>
                    <td>${trans.category}</td>
                    <td><span class="badge ${trans.type}">${trans.type.charAt(0).toUpperCase() + trans.type.slice(1)}</span></td>
                    <td>${sign}$${absAmount}</td>
                    <td class="actions">
                        <button onclick="deleteTransaction(${transactions.length - 1})" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.insertBefore(row, tbody.firstChild);

                updateAllSummaries();
            }
        }

        function deleteTransaction(index) {
            if (confirm("Are you sure you want to delete this transaction?")) {
                transactions.splice(index, 1);
                document.querySelector(`tr[data-id="${index}"]`).remove();
                // Re-index remaining rows
                document.querySelectorAll('#transactionList tr').forEach((tr, i) => {
                    tr.dataset.id = i;
                    tr.querySelector('button').setAttribute('onclick', `deleteTransaction(${i})`);
                });
                updateAllSummaries();
            }
        }

        // Update all charts and stats
        function updateAllSummaries() {
            // Calculate totals
            const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
            const balance = totalIncome - totalExpense;

            // Monthly values (simple: all transactions)
            document.getElementById('monthlyIncome').textContent = '$' + totalIncome.toFixed(2);
            document.getElementById('monthlyExpense').textContent = '$' + totalExpense.toFixed(2);
            document.getElementById('totalBalance').textContent = '$' + balance.toFixed(2);

            // Budget progress
            const budgetUsed = totalExpense / monthlyBudget * 100;
            document.getElementById('budgetPercent').textContent = budgetUsed.toFixed(0) + '%';
            document.getElementById('budgetBar').style.width = Math.min(100, budgetUsed) + '%';

            // Update Donut Chart - only expenses
            const expenseByCat = [0, 0, 0, 0, 0, 0];
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const idx = categoryMap[t.category] || 5;
                expenseByCat[idx] += Math.abs(t.amount);
            });
            expenseDonutChart.data.datasets[0].data = expenseByCat;
            expenseDonutChart.update();

            // Update Bar Chart - weekly (simple mock based on current data)
            // For demo, we'll reset and add some random distribution
            const weeklyIncome = [0, 0, 0, 0, 0, 0, 0];
            const weeklyExpense = [0, 0, 0, 0, 0, 0, 0];
            transactions.forEach(t => {
                const day = new Date(t.date).getDay(); // 0=Sun, 1=Mon...
                const adjustedDay = (day + 6) % 7; // Make Mon=0
                if (t.amount > 0) weeklyIncome[adjustedDay] += t.amount;
                else weeklyExpense[adjustedDay] += Math.abs(t.amount);
            });
            barChart.data.datasets[0].data = weeklyIncome;
            barChart.data.datasets[1].data = weeklyExpense;
            barChart.update();
        }

        // Initial load
        loadInitialData();