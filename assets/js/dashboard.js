// Income vs Expenses Chart (last 12 months example)
document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('incomeExpenseChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Income',
          data: [4500, 6200, 5800, 7100, 8900, 9500, 8200, 7800, 9200, 10500, 9800, 14579],
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expenses',
          data: [3200, 4100, 3800, 4900, 6200, 6800, 5500, 5100, 6500, 7800, 7200, 9500],
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
});