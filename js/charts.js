// ==================== GRÁFICOS ====================

let expenseChart = null;
let incomeChart = null;

function updateCharts() {
  updateExpenseChart();
  updateIncomeChart();
}

function updateExpenseChart() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const expenses = state.transactions.filter(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return monthKey === currentMonth && t.type === 'expense';
  });
  
  const categories = {};
  expenses.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = 0;
    }
    categories[t.category] += t.value;
  });
  
  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const colors = generateColors(labels.length);
  
  const canvas = document.getElementById('expense-chart');
  const ctx = canvas.getContext('2d');
  
  if (expenseChart) {
    expenseChart.destroy();
  }
  
  if (labels.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.font = '14px system-ui';
    ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': R$ ' + context.parsed.toFixed(2);
            }
          }
        }
      }
    }
  });
}

function updateIncomeChart() {
  const months = [];
  const incomeData = [];
  const expenseData = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    
    months.push(monthName);
    
    const monthTransactions = state.transactions.filter(t => {
      const tDate = new Date(t.date);
      const tMonthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      return tMonthKey === monthKey;
    });
    
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
    
    incomeData.push(income);
    expenseData.push(expense);
  }
  
  const canvas = document.getElementById('income-chart');
  const ctx = canvas.getContext('2d');
  
  if (incomeChart) {
    incomeChart.destroy();
  }
  
  incomeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': R$ ' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#999',
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        x: {
          ticks: {
            color: '#999'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        }
      }
    }
  });
}

function generateColors(count) {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}
