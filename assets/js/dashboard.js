        // Display username from signup
        const currentUsername = localStorage.getItem('currentUsername');
        if (currentUsername) {
            document.getElementById('name').textContent = currentUsername;
        }

        Chart.register(ChartDataLabels);
        let transactions = JSON.parse(localStorage.getItem('spendwise_final')) || [];
        let currentPeriod = 'daily';
        const budgetLimits = { daily: 60, weekly: 400, monthly: 1600 };

        const donutChart = new Chart(document.getElementById('expenseDonut').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Food & Drinks', 'Rent', 'Bills', 'Shopping', 'Travel', 'Other'],
                datasets: [{ backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#ef4444', '#f59e0b', '#94a3b8'], data: [0,0,0,0,0,0] }]
            },
            options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });

        const trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
            type: 'bar',
            data: { labels: [], datasets: [
                { label: 'Income', backgroundColor: '#10b981', data: [], borderRadius: 5 },
                { label: 'Expense', backgroundColor: '#ef4444', data: [], borderRadius: 5 }
            ]},
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
                for(let i=0; i<7; i++) {
                    const d = start.clone().add(i, 'days');
                    const dayT = transactions.filter(t => moment(t.date).isSame(d, 'day'));
                    incD.push(dayT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
                    expD.push(dayT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
                }
            } else if (currentPeriod === 'weekly') {
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                const start = moment().startOf('month');
                for(let i=0; i<4; i++) {
                    const weekT = transactions.filter(t => moment(t.date).isBetween(start.clone().add(i, 'weeks'), start.clone().add(i+1, 'weeks'), null, '[)'));
                    incD.push(weekT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
                    expD.push(weekT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
                }
            } else {
                labels = moment.monthsShort();
                for(let i=0; i<12; i++) {
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

            if(!desc || isNaN(amt)) return Swal.fire('Error', 'Invalid details', 'error');

            const item = { name: desc, amount: amt, category: document.getElementById('cat').value, type: document.getElementById('type').value, date: date };
            if(idx === -1) transactions.push(item); else transactions[idx] = item;

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
                if(res.isConfirmed) {
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
                        <button class="btn-icon del-btn" onclick="deleteT(${t.originalIndex})">🗑️</button>
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

        updateUI();
