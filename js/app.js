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

// ==================== EXPORTAR/IMPORTAR ====================
function exportData(format) {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('Backup gerado com sucesso!');
}

function importData() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      state = imported;
      saveState();
      initApp();
      showToast('Dados importados com sucesso!');
    } catch (err) {
      showToast('Erro ao importar dados', 'error');
    }
  };
  reader.readAsText(file);
}

function confirmClearData() {
  if (confirm('Tem certeza? Todos os dados serão apagados permanentemente!')) {
    localStorage.clear();
    location.reload();
  }
}

// ==================== FILTROS ====================
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
    const option = document.createElement('option');
    option.value = m;
    option.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    select.appendChild(option);
  });
}

function populateCategoryFilters() {
  const categories = [...new Set(state.transactions.map(t => t.category))];
  const select = document.getElementById('filter-category');
  select.innerHTML = '<option value="">Todas categorias</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}
