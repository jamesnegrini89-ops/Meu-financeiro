// ==================== ESTADO GLOBAL ====================
let state = {
  balance: 0,
  transactions: [],
  goals: [],
  creditCards: [],
  healthRecords: [],
  budget: {
    monthlyLimit: 0,
    categories: {}
  },
  settings: {
    pinEnabled: false,
    pin: null,
    theme: 'light',
    currency: 'BRL'
  }
};

let currentView = 'home';
let currentPIN = '';
let isFirstVisit = true;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  checkFirstVisit();
  updateCurrentDate();
  initApp();
});

function loadState() {
  const saved = localStorage.getItem('financeiro_v2');
  if (saved) {
    try {
      state = JSON.parse(saved);
      isFirstVisit = false;
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }
}

function saveState() {
  localStorage.setItem('financeiro_v2', JSON.stringify(state));
}

function checkFirstVisit() {
  if (isFirstVisit) {
    showOnboarding();
  } else if (state.settings.pinEnabled) {
    showPINScreen();
  } else {
    showApp();
  }
}

function updateCurrentDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  document.getElementById('current-date').textContent = formatted;
}

function initApp() {
  populateMonthFilter();
  populateCategoryFilters();
  renderHome();
  renderTransactions();
  renderBudget();
  renderGoals();
  renderCards();
  renderHealth();
  updateCharts();
  generateTips();
}

// ==================== ONBOARDING ====================
function showOnboarding() {
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'none';
}

function nextOnboardingStep() {
  const steps = document.querySelectorAll('.onboarding-step');
  let currentStep = 1;
  
  steps.forEach((step, index) => {
    if (step.classList.contains('active')) {
      currentStep = index + 1;
      step.classList.remove('active');
    }
  });

  if (currentStep === 1) {
    steps[1].classList.add('active');
  } else if (currentStep === 2) {
    const balance = parseFloat(document.getElementById('onboard-balance').value) || 0;
    state.balance = balance;
    saveState();
    steps[2].classList.add('active');
  }
}

function skipOnboarding() {
  finishOnboarding();
}

function finishOnboarding() {
  const goalName = document.getElementById('onboard-goal-name').value.trim();
  const goalValue = parseFloat(document.getElementById('onboard-goal-value').value) || 0;

  if (goalName && goalValue > 0) {
    state.goals.push({
      id: Date.now(),
      name: goalName,
      target: goalValue,
      current: 0,
      date: new Date().toISOString()
    });
  }

  isFirstVisit = false;
  saveState();
  document.getElementById('onboarding').style.display = 'none';
  showApp();
  initApp();
}

// ==================== PIN ====================
function showPINScreen() {
  document.getElementById('pin-screen').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
  currentPIN = '';
  updatePINDots();
}

function showApp() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
}

function pinInput(num) {
  if (currentPIN.length < 4) {
    currentPIN += num;
    updatePINDots();
  }
}

function pinClear() {
  currentPIN = currentPIN.slice(0, -1);
  updatePINDots();
}

function pinSubmit() {
  if (currentPIN.length !== 4) return;

  if (currentPIN === state.settings.pin) {
    showApp();
    initApp();
  } else {
    document.getElementById('pin-error').style.display = 'block';
    setTimeout(() => {
      document.getElementById('pin-error').style.display = 'none';
      currentPIN = '';
      updatePINDots();
    }, 1500);
  }
}

function updatePINDots() {
  const dots = document.querySelectorAll('.pin-dots .dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < currentPIN.length);
  });
}

// ==================== NAVEGAÇÃO ====================
function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  
  if (view === 'reports') updateCharts();
  if (view === 'health') renderHealth();
}

// ==================== THEME ====================
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  state.settings.theme = next;
  saveState();
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== MODALS ====================
function showTransactionModal(id = null) {
  const modal = document.getElementById('transaction-modal');
  modal.style.display = 'flex';
  
  if (id) {
    const trans = state.transactions.find(t => t.id === id);
    if (trans) {
      document.getElementById('trans-id').value = trans.id;
      document.getElementById('trans-type').value = trans.type;
      document.getElementById('trans-value').value = trans.value;
      document.getElementById('trans-category').value = trans.category;
      document.getElementById('trans-account').value = trans.account || '';
      document.getElementById('trans-date').value = trans.date.split('T')[0];
      document.getElementById('trans-description').value = trans.description || '';
      document.getElementById('trans-recurring').checked = trans.recurring || false;
      document.getElementById('trans-tags').value = (trans.tags || []).join(', ');
      
      selectType(trans.type);
      document.getElementById('transaction-modal-title').textContent = 'Editar Lançamento';
    }
  } else {
    document.getElementById('transaction-form').reset();
    document.getElementById('trans-id').value = '';
    document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
    selectType('expense');
    document.getElementById('transaction-modal-title').textContent = 'Novo Lançamento';
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function selectType(type) {
  document.getElementById('trans-type').value = type;
  document.querySelectorAll('.quick-type').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

// ==================== FILTERS ====================
function populateMonthFilter() {
  const select = document.getElementById('filter-month');
  const months = new Set();
  
  state.transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(key);
  });
  
  select.innerHTML = '<option value="">Todos os meses</option>';
  Array.from(months).sort().reverse().forEach(m => {
    const [year, month] = m.split('-');
    const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    select.innerHTML += `<option value="${m}">${monthName}</option>`;
  });
}

function populateCategoryFilters() {
  const categories = [...new Set(state.transactions.map(t => t.category))];
  const select = document.getElementById('filter-category');
  select.innerHTML = '<option value="">Todas categorias</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

// ==================== SETTINGS ====================
function showSettings() {
  navigate('settings');
  document.getElementById('enable-pin').checked = state.settings.pinEnabled;
  document.getElementById('change-pin-btn').style.display = state.settings.pinEnabled ? 'block' : 'none';
  document.getElementById('settings-monthly-limit').value = state.budget.monthlyLimit || '';
}

function togglePIN() {
  const enabled = document.getElementById('enable-pin').checked;
  
  if (enabled && !state.settings.pin) {
    const pin = prompt('Crie um PIN de 4 dígitos:');
    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
      state.settings.pin = pin;
      state.settings.pinEnabled = true;
      document.getElementById('change-pin-btn').style.display = 'block';
      showToast('PIN ativado com sucesso!');
    } else {
      document.getElementById('enable-pin').checked = false;
      showToast('PIN inválido. Use 4 dígitos.', 'error');
      return;
    }
  } else if (!enabled) {
    state.settings.pinEnabled = false;
    document.getElementById('change-pin-btn').style.display = 'none';
  }
  
  saveState();
}

function changePIN() {
  const oldPin = prompt('Digite o PIN atual:');
  if (oldPin !== state.settings.pin) {
    showToast('PIN incorreto!', 'error');
    return;
  }
  
  const newPin = prompt('Digite o novo PIN de 4 dígitos:');
  if (newPin && newPin.length === 4 && /^\d{4}$/.test(newPin)) {
    state.settings.pin = newPin;
    saveState();
    showToast('PIN alterado com sucesso!');
  } else {
    showToast('PIN inválido. Use 4 dígitos.', 'error');
  }
}

function saveMonthlyLimit() {
  const limit = parseFloat(document.getElementById('settings-monthly-limit').value) || 0;
  state.budget.monthlyLimit = limit;
  saveState();
  showToast('Orçamento mensal atualizado!');
  renderHome();
}

// ==================== EXPORT/IMPORT ====================
function exportData(format) {
  if (format === 'json') {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `financeiro_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Backup gerado com sucesso!');
  } else if (format === 'csv') {
    let csv = 'Data,Tipo,Valor,Categoria,Conta,Descrição\n';
    state.transactions.forEach(t => {
      csv += `${t.date},${t.type},${t.value},${t.category},${t.account || ''},${t.description || ''}\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const exportFileDefaultName = `financeiro_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('CSV exportado com sucesso!');
  }
}

function importData() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm('Isso substituirá todos os dados atuais. Continuar?')) {
        state = imported;
        saveState();
        initApp();
        showToast('Dados importados com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao importar dados!', 'error');
    }
  };
  reader.readAsText(file);
}

function confirmClearData() {
  if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados permanentemente. Continuar?')) {
    if (confirm('Tem certeza ABSOLUTA? Não há como desfazer.')) {
      localStorage.clear();
      location.reload();
    }
  }
}

// ==================== UTILITY ====================
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
