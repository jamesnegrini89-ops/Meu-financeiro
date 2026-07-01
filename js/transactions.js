// Gerenciamento de transações

let editingTransactionId = null;

// Abrir modal de nova transação
function openTransactionModal() {
  editingTransactionId = null;
  document.getElementById('transaction-modal-title').textContent = 'Nova Transação';
  document.getElementById('transaction-form').reset();
  document.getElementById('trans-date').valueAsDate = new Date();
  document.getElementById('transaction-modal').classList.add('active');
}

// Fechar modal de transação
function closeTransactionModal() {
  document.getElementById('transaction-modal').classList.remove('active');
  document.getElementById('transaction-form').reset();
  editingTransactionId = null;
}

// Atualizar opções de categoria baseado no tipo
function updateCategoryOptions() {
  const type = document.getElementById('trans-type').value;
  const categorySelect = document.getElementById('trans-category');
  
  categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  if (type === 'income') {
    CATEGORIES.income.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  } else if (type === 'expense') {
    CATEGORIES.expense.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
}

// Salvar transação
function saveTransaction() {
  const type = document.getElementById('trans-type').value;
  const category = document.getElementById('trans-category').value;
  const value = parseFloat(document.getElementById('trans-value').value);
  const date = document.getElementById('trans-date').value;
  const description = document.getElementById('trans-description').value;

  if (!type || !category || !value || !date) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  const transaction = {
    id: editingTransactionId || Date.now(),
    type,
    category,
    value,
    date,
    description
  };

  let transactions = getTransactions();

  if (editingTransactionId) {
    const index = transactions.findIndex(t => t.id === editingTransactionId);
    transactions[index] = transaction;
  } else {
    transactions.push(transaction);
  }

  saveTransactions(transactions);
  closeTransactionModal();
  renderTransactions();
  updateDashboard();
}

// Renderizar lista de transações
function renderTransactions() {
  const transactions = getFilteredTransactions();
  const container = document.getElementById('transactions-list');

  if (transactions.length === 0) {
    container.innerHTML = '<p class="muted" style="text-align: center; padding: 40px 0;">Nenhuma transação encontrada</p>';
    return;
  }

  let html = '<div class="transaction-list">';

  transactions.forEach(t => {
    const typeIcon = t.type === 'income' ? '💰' : '💸';
    const typeClass = t.type === 'income' ? 'good' : 'bad';
    const formattedValue = formatCurrency(t.value);
    const formattedDate = formatDate(t.date);

    html += `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-header">
            <span class="transaction-icon">${typeIcon}</span>
            <div>
              <div class="transaction-category">${t.category}</div>
              ${t.description ? `<div class="transaction-description">${t.description}</div>` : ''}
            </div>
          </div>
          <div class="transaction-meta">
            <span class="transaction-date">${formattedDate}</span>
          </div>
        </div>
        <div class="transaction-actions">
          <span class="transaction-value ${typeClass}">${formattedValue}</span>
          <button class="btn-icon" onclick="editTransaction(${t.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="deleteTransaction(${t.id})" title="Excluir">🗑️</button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// Editar transação
function editTransaction(id) {
  const transactions = getTransactions();
  const transaction = transactions.find(t => t.id === id);

  if (!transaction) return;

  editingTransactionId = id;
  document.getElementById('transaction-modal-title').textContent = 'Editar Transação';
  document.getElementById('trans-type').value = transaction.type;
  updateCategoryOptions();
  document.getElementById('trans-category').value = transaction.category;
  document.getElementById('trans-value').value = transaction.value;
  document.getElementById('trans-date').value = transaction.date;
  document.getElementById('trans-description').value = transaction.description || '';
  document.getElementById('transaction-modal').classList.add('active');
}

// Excluir transação
function deleteTransaction(id) {
  if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

  let transactions = getTransactions();
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(transactions);
  renderTransactions();
  updateDashboard();
}

// Aplicar filtros
function applyFilters() {
  renderTransactions();
}

// Limpar filtros
function clearFilters() {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-month').value = '';
  renderTransactions();
}

// Obter transações filtradas
function getFilteredTransactions() {
  let transactions = getTransactions();
  
  const typeFilter = document.getElementById('filter-type').value;
  const categoryFilter = document.getElementById('filter-category').value;
  const monthFilter = document.getElementById('filter-month').value;

  if (typeFilter) {
    transactions = transactions.filter(t => t.type === typeFilter);
  }

  if (categoryFilter) {
    transactions = transactions.filter(t => t.category === categoryFilter);
  }

  if (monthFilter) {
    transactions = transactions.filter(t => t.date.startsWith(monthFilter));
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Preencher select de categorias no filtro
function populateFilterCategories() {
  const select = document.getElementById('filter-category');
  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
  
  allCategories.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}
