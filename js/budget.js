// ==================== ORÇAMENTO ====================

function renderBudget() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const thisMonthExpenses = state.transactions.filter(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return monthKey === currentMonth && t.type === 'expense';
  });
  
  const totalSpent = thisMonthExpenses.reduce((sum, t) => sum + t.value, 0);
  const limit = state.budget.monthlyLimit || 0;
  const remaining = limit - totalSpent;
  const percent = limit > 0 ? (totalSpent / limit) * 100 : 0;
  
  document.getElementById('budget-spent').textContent = `R$ ${totalSpent.toFixed(2)}`;
  document.getElementById('budget-limit').textContent = `R$ ${limit.toFixed(2)}`;
  document.getElementById('budget-remaining').textContent = `R$ ${remaining.toFixed(2)}`;
  
  const progressBar = document.querySelector('.budget-progress-fill');
  progressBar.style.width = `${Math.min(percent, 100)}%`;
  
  if (percent > 100) {
    progressBar.style.background = 'var(--danger)';
  } else if (percent > 80) {
    progressBar.style.background = 'var(--warning)';
  } else {
    progressBar.style.background = 'var(--success)';
  }
  
  renderCategoryBudgets(thisMonthExpenses);
}

function renderCategoryBudgets(expenses) {
  const list = document.getElementById('category-budgets');
  const categories = {};
  
  expenses.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = 0;
    }
    categories[t.category] += t.value;
  });
  
  if (Object.keys(categories).length === 0) {
    list.innerHTML = '<p class="muted">Nenhuma despesa neste mês</p>';
    return;
  }
  
  let html = '';
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, value]) => {
    const limit = state.budget.categories[cat] || 0;
    const percent = limit > 0 ? (value / limit) * 100 : 0;
    const icon = getCategoryIcon(cat);
    
    let status = 'good';
    if (percent > 100) status = 'bad';
    else if (percent > 80) status = 'warning';
    
    html += `
      <div class="category-budget-item">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 24px;">${icon}</span>
          <div style="flex: 1;">
            <b>${cat}</b>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <small class="muted">R$ ${value.toFixed(2)} ${limit > 0 ? `/ R$ ${limit.toFixed(2)}` : ''}</small>
              ${limit > 0 ? `<small class="${status}">${percent.toFixed(0)}%</small>` : ''}
            </div>
          </div>
        </div>
        ${limit > 0 ? `
          <div class="progress-bar">
            <div class="progress-fill ${status}" style="width: ${Math.min(percent, 100)}%"></div>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  list.innerHTML = html;
}

function showBudgetModal() {
  document.getElementById('budget-modal').classList.add('active');
  document.getElementById('budget-monthly-limit').value = state.budget.monthlyLimit || '';
  
  const container = document.getElementById('category-limits');
  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];
  
  let html = '';
  categories.forEach(cat => {
    const value = state.budget.categories[cat] || '';
    const icon = getCategoryIcon(cat);
    html += `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 20px;">${icon}</span>
        <label style="flex: 1;">${cat}</label>
        <input type="number" step="0.01" placeholder="Limite" value="${value}" 
               id="budget-cat-${cat}" style="width: 120px;">
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function saveBudget(event) {
  event.preventDefault();
  
  const monthlyLimit = parseFloat(document.getElementById('budget-monthly-limit').value) || 0;
  state.budget.monthlyLimit = monthlyLimit;
  
  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];
  categories.forEach(cat => {
    const value = parseFloat(document.getElementById(`budget-cat-${cat}`).value) || 0;
    if (value > 0) {
      state.budget.categories[cat] = value;
    } else {
      delete state.budget.categories[cat];
    }
  });
  
  saveState();
  closeModal('budget-modal');
  renderBudget();
  showToast('Orçamento atualizado!');
}
