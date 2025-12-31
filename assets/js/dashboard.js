 Chart.register(ChartDataLabels);

        let transactions = JSON.parse(localStorage.getItem('spendwise_transactions')) || [];
        let monthlyBudget = 3500;
        let currentPeriod = 'daily';

        const categoryMap = { 'Rent': 0, 'Food & Drinks': 1, 'Bills': 2, 'Shopping': 3, 'Travel': 4, 'Other': 5 };
        const categoryColors = ['#f45d12', '#00bcbc', '#006d6d', '#ffa500', '#007a7a', '#fdd99b'];
        const currencySymbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'KHR': '៛' };

        function showPage(pageId) {
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            document.getElementById(pageId + '-page').classList.add('active');
            if(document.getElementById('nav-' + pageId)) document.getElementById('nav-' + pageId).classList.add('active');
            updateUI();
        }

        const donutChart = new Chart(document.getElementById('expenseDonut'), {
            type: 'doughnut',
            data: { 
                labels: Object.keys(categoryMap), 
                datasets: [{ data: [], backgroundColor: categoryColors }] 
            },
            options: { 
                responsive: true, 
                cutout: '65%', 
                plugins: { 
                    legend: { position: 'bottom' },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            let percentage = sum > 0 ? (value * 100 / sum).toFixed(0) : 0;
                            return (value > 0) ? percentage + "%" : null;
                        }
                    }
                } 
            }
        });

        const trendChart = new Chart(document.getElementById('trendChart'), {
            type: 'bar',
            data: { labels: [], datasets: [
                { label: 'Income', data: [], backgroundColor: '#00bcbc' },
                { label: 'Expenses', data: [], backgroundColor: '#f45d12' }
            ]},
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });

        function getPeriodRange(period) {
            const now = moment();
            if (period === 'daily')   return { start: now.clone().startOf('day'), end: now.clone().endOf('day') };
            if (period === 'weekly')  return { start: now.clone().startOf('week'), end: now.clone().endOf('week') };
            if (period === 'monthly') return { start: now.clone().startOf('month'), end: now.clone().endOf('month') };
        }

        function updateUI() {
            const { start, end } = getPeriodRange(currentPeriod);
            let filtered = transactions.filter(t => moment(t.date).isBetween(start, end, null, '[]'));

            const search = document.getElementById('searchDesc').value.toLowerCase();
            const cat = document.getElementById('filterCategory').value;
            const date = document.getElementById('filterDate').value;
            const min = parseFloat(document.getElementById('minAmount').value) || 0;
            const max = parseFloat(document.getElementById('maxAmount').value) || Infinity;

            if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search));
            if (cat)    filtered = filtered.filter(t => t.category === cat);
            if (date)   filtered = filtered.filter(t => t.date === date);
            filtered = filtered.filter(t => Math.abs(t.amount) >= min && Math.abs(t.amount) <= max);

            const inc = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
            const exp = Math.abs(filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
            
            document.getElementById('income').textContent = '$' + inc.toFixed(2);
            document.getElementById('expenses').textContent = '$' + exp.toFixed(2);
            document.getElementById('balance').textContent = '$' + (inc - exp).toFixed(2);

            const budgetUsed = currentPeriod === 'monthly' ? (exp / monthlyBudget * 100) : 0;
            document.getElementById('budgetUsed').textContent = budgetUsed.toFixed(0) + '%';
            document.getElementById('budgetBar').style.width = Math.min(100, budgetUsed) + '%';

            const catData = new Array(6).fill(0);
            filtered.filter(t => t.amount < 0).forEach(t => { catData[categoryMap[t.category] ?? 5] += Math.abs(t.amount); });
            donutChart.data.datasets[0].data = catData;
            donutChart.update();

            const labels = [], incData = [], expData = [];
            if (currentPeriod === 'daily') {
                labels.push('Today'); incData.push(inc); expData.push(exp);
            } else if (currentPeriod === 'weekly') {
                for (let i = 0; i < 7; i++) {
                    const d = moment().startOf('week').add(i, 'days');
                    labels.push(d.format('ddd'));
                    const dayT = transactions.filter(t => moment(t.date).isSame(d, 'day'));
                    incData.push(dayT.filter(t=>t.amount>0).reduce((s,v)=>s+v.amount,0));
                    expData.push(Math.abs(dayT.filter(t=>t.amount<0).reduce((s,v)=>s+v.amount,0)));
                }
            } else {
                // Guaranteed 4-week look for Monthly view
                let startOfMonth = moment().startOf('month');
                for (let i = 0; i < 4; i++) {
                    let startOfWeek = startOfMonth.clone().add(i, 'weeks').startOf('week');
                    let endOfWeek = startOfWeek.clone().endOf('week');
                    
                    labels.push(`Week ${i+1}`);
                    
                    const weekT = transactions.filter(t => 
                        moment(t.date).isBetween(startOfWeek, endOfWeek, null, '[]')
                    );
                    
                    incData.push(weekT.filter(t => t.amount > 0).reduce((s, v) => s + v.amount, 0));
                    expData.push(Math.abs(weekT.filter(t => t.amount < 0).reduce((s, v) => s + v.amount, 0)));
                }
            }
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = incData;
            trendChart.data.datasets[1].data = expData;
            trendChart.update();

            renderTransactions(filtered);
        }

        function renderTransactions(list) {
            const tbody = document.getElementById('transactionList');
            tbody.innerHTML = '';
            list.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach((t, i) => {
                const symbol = currencySymbols[t.currency] || '$';
                const originalIndex = transactions.indexOf(t);
                tbody.innerHTML += `
                    <tr>
                        <td>${moment(t.date).format('MMM DD, YYYY')}</td>
                        <td>${t.name}</td>
                        <td>${t.category}</td>
                        <td><span class="badge ${t.type}">${t.type}</span></td>
                        <td style="color:${t.amount>0?'green':'red'}">${t.amount>0?'+':''}${symbol}${Math.abs(t.amount).toLocaleString()}</td>
                        <td>${t.currency}</td>
                        <td>
                            <button class="btn-edit" onclick="editTransaction(${originalIndex})">✏️</button>
                            <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">🗑️</button>
                        </td>
                    </tr>`;
            });
        }

        function saveTransaction() {
            const desc = document.getElementById('desc').value;
            const amt = parseFloat(document.getElementById('amt').value);
            const type = document.getElementById('type').value;
            const index = parseInt(document.getElementById('editIndex').value);

            if (!desc || isNaN(amt)) return Swal.fire('Error', 'Missing fields', 'error');

            const transactionData = {
                date: document.getElementById('transDate').value || moment().format('YYYY-MM-DD'),
                name: desc,
                category: document.getElementById('cat').value,
                type: type,
                amount: type === 'income' ? amt : -amt,
                currency: document.getElementById('currency').value
            };

            if (index === -1) {
                transactions.push(transactionData);
                Swal.fire('Added!', 'Transaction successfully added.', 'success');
            } else {
                transactions[index] = transactionData;
                Swal.fire('Updated!', 'Transaction successfully updated.', 'success');
            }

            localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
            resetForm();
            updateUI();
        }

        function editTransaction(idx) {
            const t = transactions[idx];
            document.getElementById('desc').value = t.name;
            document.getElementById('amt').value = Math.abs(t.amount);
            document.getElementById('cat').value = t.category;
            document.getElementById('type').value = t.type;
            document.getElementById('currency').value = t.currency;
            document.getElementById('transDate').value = t.date;
            document.getElementById('editIndex').value = idx;

            document.getElementById('formTitle').innerText = "Edit Transaction";
            document.getElementById('submitBtn').innerText = "Update";
            document.getElementById('cancelBtn').style.display = "inline-block";
            
            window.scrollTo({ top: document.querySelector('.transaction-section').offsetTop, behavior: 'smooth' });
        }

        function resetForm() {
            document.getElementById('desc').value = '';
            document.getElementById('amt').value = '';
            document.getElementById('editIndex').value = '-1';
            document.getElementById('formTitle').innerText = "Add New Transaction";
            document.getElementById('submitBtn').innerText = "Add";
            document.getElementById('cancelBtn').style.display = "none";
        }

        function deleteTransaction(idx) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#00bcbc',
                cancelButtonColor: '#dc3545',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    transactions.splice(idx, 1);
                    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
                    updateUI();
                    Swal.fire('Deleted!', 'Your transaction has been removed.', 'success');
                }
            });
        }

        function clearFilters() {
            document.getElementById('searchDesc').value = '';
            document.getElementById('filterCategory').value = '';
            document.getElementById('filterDate').value = '';
            document.getElementById('minAmount').value = '';
            document.getElementById('maxAmount').value = '';
            updateUI();
        }

        function exportToCSV() {
            const csv = ["Date,Desc,Cat,Type,Amt,Currency"].concat(transactions.map(t => `${t.date},${t.name},${t.category},${t.type},${t.amount},${t.currency}`)).join("\n");
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'report.csv';
            a.click();
        }

        function exportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("SpendWise Report", 20, 20);
            doc.autoTable({
                head: [['Date', 'Description', 'Category', 'Amount', 'Currency']],
                body: transactions.map(t => [t.date, t.name, t.category, t.amount, t.currency])
            });
            doc.save("report.pdf");
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