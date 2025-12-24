 Chart.register(ChartDataLabels);

        // 1. Donut Chart (Based on your image percentages)
        const donutCtx = document.getElementById('expenseDonut').getContext('2d');
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Rent', 'Food', 'Bills', 'Shopping', 'Travel', 'Other'],
                datasets: [{
                    data: [32.2, 25, 24.2, 14.6, 3.29, 0.635],
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
                        formatter: (val) => val > 5 ? val + '%' : '',
                        font: { weight: '800', size: 12 }
                    }
                },
                cutout: '65%'
            }
        });

        // 2. Bar Chart (Comparison)
        const barCtx = document.getElementById('mainBarChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    { label: 'Income', data: [500, 0, 0, 1200, 0, 400, 0], backgroundColor: '#00bcbc', borderRadius: 5 },
                    { label: 'Expenses', data: [120, 300, 150, 400, 200, 800, 100], backgroundColor: '#f45d12', borderRadius: 5 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
            }
        });

        function addEntry() {
            const name = document.getElementById('desc').value;
            const val = document.getElementById('amt').value;
            if(!name || !val) return alert("Please fill details");
            
            const tbody = document.getElementById('transactionList');
            const row = `<tr>
                <td>Just Now</td>
                <td>${name}</td>
                <td>${document.getElementById('cat').value}</td>
                <td><span class="badge ${document.getElementById('type').value}">${document.getElementById('type').value}</span></td>
                <td>$${val}</td>
            </tr>`;
            tbody.insertAdjacentHTML('afterbegin', row);
        }
