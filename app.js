// CONFIGURATION API
const API_BASE_URL = "https://backendmercury.vercel.app";

// GLOBAL STATE
let currentUser = JSON.parse(localStorage.getItem('tradex_user')) || null;
let currentChart = null;

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  feather.replace();
  initSlider();
  initWatchlist();
  initChart();
  
  if (currentUser) {
    refreshUserData();
  } else {
    updateUIForGuest();
  }
});

// UI & NAVIGATION SWITCHING
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-blue-600');
    btn.classList.add('text-slate-400');
  });
  
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.classList.remove('text-slate-400');
    activeNav.classList.add('text-blue-600');
  }
}

function switchSubTab(subTab) {
  ['deposit', 'withdraw', 'status'].forEach(type => {
    const el = document.getElementById(`subtab-${type}`);
    const btn = document.getElementById(`subtab-btn-${type === 'deposit' ? 'dep' : type === 'withdraw' ? 'wd' : 'status'}`);
    if (el) el.classList.add('hidden');
    if (btn) {
      btn.className = "w-1/3 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition";
    }
  });

  const activeEl = document.getElementById(`subtab-${subTab}`);
  const activeBtn = document.getElementById(`subtab-btn-${subTab === 'deposit' ? 'dep' : subTab === 'withdraw' ? 'wd' : 'status'}`);
  
  if (activeEl) activeEl.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = "w-1/3 py-2 rounded-lg bg-blue-600 text-white font-bold transition";
  }

  if (subTab === 'status' && currentUser) {
    fetchTransactionHistory();
  }
}

function goToTransaction(type) {
  switchTab('order');
  switchSubTab(type);
}

// AUTHENTICATION MODAL HANDLERS
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden'), modal.classList.add('flex');
  toggleAuthForm(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden'), modal.classList.remove('flex');
}

function toggleAuthForm(type) {
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');
  const tabLogin = document.getElementById('modal-tab-login');
  const tabReg = document.getElementById('modal-tab-reg');

  if (type === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabLogin.className = "w-1/2 text-center font-bold text-blue-600 border-b-2 border-blue-600 pb-1 text-xs";
    tabReg.className = "w-1/2 text-center font-bold text-slate-400 pb-1 text-xs";
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabReg.className = "w-1/2 text-center font-bold text-blue-600 border-b-2 border-blue-600 pb-1 text-xs";
    tabLogin.className = "w-1/2 text-center font-bold text-slate-400 pb-1 text-xs";
  }
}

function handleAuthHeaderClick() {
  if (currentUser) {
    switchTab('profile');
  } else {
    openAuthModal('login');
  }
}

function handleLogoutOrLogin() {
  if (currentUser) {
    localStorage.removeItem('tradex_user');
    currentUser = null;
    updateUIForGuest();
    alert('Anda telah log keluar.');
  } else {
    openAuthModal('login');
  }
}

// REAL API AUTHENTICATION
async function handleRealLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email-input').value;
  const password = document.getElementById('login-password-input').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem('tradex_user', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeAuthModal();
      alert('Log masuk berjaya!');
    } else {
      alert(data.message || 'Log masuk gagal');
    }
  } catch (err) {
    alert('Gagal berhubung dengan pelayan');
  }
}

async function handleRealRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-fullname-input').value;
  const email = document.getElementById('reg-email-input').value;
  const password = document.getElementById('reg-password-input').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem('tradex_user', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeAuthModal();
      alert('Pendaftaran berjaya!');
    } else {
      alert(data.message || 'Pendaftaran gagal');
    }
  } catch (err) {
    alert('Gagal berhubung dengan pelayan');
  }
}

// REFRESH DATA USER
async function refreshUserData() {
  if (!currentUser) return updateUIForGuest();

  const idToFetch = currentUser.userId || currentUser._id;

  if (!idToFetch) {
    updateUIForLoggedInUser();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(idToFetch)}`);
    
    if (res.ok) {
      const serverUser = await res.json();
      currentUser = { ...currentUser, ...serverUser };
      localStorage.setItem('tradex_user', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
    } else if (res.status === 404) {
      localStorage.removeItem('tradex_user');
      currentUser = null;
      updateUIForGuest();
    } else {
      updateUIForLoggedInUser();
    }
  } catch (err) {
    console.error('Error refreshing user data:', err);
    updateUIForLoggedInUser();
  }
}

// UI STATE MANAGERS
function updateUIForLoggedInUser() {
  if (!currentUser) return updateUIForGuest();

  document.getElementById('btn-head-login').textContent = currentUser.name ? currentUser.name.split(' ')[0] : 'User';
  document.getElementById('user-status-badge').textContent = 'Aktif';
  document.getElementById('user-status-badge').className = 'text-[10px] text-blue-700 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20';
  
  const balanceVal = currentUser.balance || 0;
  const formattedBalance = `RM ${balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  document.getElementById('display-total-balance').textContent = formattedBalance;
  document.getElementById('display-withdrawable').textContent = formattedBalance;
  
  document.getElementById('profile-fullname').textContent = currentUser.name || '';
  document.getElementById('profile-email').textContent = currentUser.email || '';
  document.getElementById('profile-avatar').textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  document.getElementById('profile-kyc-badge').textContent = currentUser.kycStatus || 'Unverified';
  document.getElementById('btn-logout-or-login').textContent = 'Log Keluar';

  if (currentUser.bankInfo) {
    if (document.getElementById('user-bank-select')) document.getElementById('user-bank-select').value = currentUser.bankInfo.bankName || 'Maybank';
    if (document.getElementById('user-acc-input')) document.getElementById('user-acc-input').value = currentUser.bankInfo.accNumber || '';
    if (document.getElementById('user-holder-input')) document.getElementById('user-holder-input').value = currentUser.bankInfo.holderName || '';
    if (currentUser.bankInfo.accNumber && document.getElementById('ph-bank')) {
      document.getElementById('ph-bank').value = `${currentUser.bankInfo.bankName} - ${currentUser.bankInfo.accNumber} (${currentUser.bankInfo.holderName})`;
    }
  }
}

function updateUIForGuest() {
  currentUser = null;
  document.getElementById('btn-head-login').textContent = 'Log Masuk';
  document.getElementById('user-status-badge').textContent = 'Belum Log Masuk';
  document.getElementById('user-status-badge').className = 'text-[10px] text-amber-700 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20';
  
  document.getElementById('display-total-balance').textContent = 'RM 0.00';
  document.getElementById('display-withdrawable').textContent = 'RM 0.00';
  document.getElementById('display-trading').textContent = 'RM 0.00';
  document.getElementById('display-profit').textContent = 'RM 0.00';

  document.getElementById('profile-fullname').textContent = 'Sila Log Masuk';
  document.getElementById('profile-email').textContent = 'Log masuk untuk akses akaun';
  document.getElementById('profile-avatar').textContent = '?';
  document.getElementById('profile-kyc-badge').textContent = 'Unverified';
  document.getElementById('btn-logout-or-login').textContent = 'Log Masuk / Daftar';

  if (document.getElementById('ph-bank')) document.getElementById('ph-bank').value = '';
}

// TRANSACTIONS HANDLING
async function handleDepositSubmit(event) {
  event.preventDefault();
  if (!currentUser) return openAuthModal('login');

  const amount = parseFloat(document.getElementById('dep-amount-input').value);
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.userId || currentUser._id,
        userName: currentUser.name,
        type: 'Deposit',
        amount: amount,
        bankDetails: 'Deposit via Gateway/Manual'
      })
    });

    if (res.ok) {
      document.getElementById('pop-dep-amount').textContent = `RM ${amount.toFixed(2)}`;
      document.getElementById('depositModal').classList.remove('hidden');
      document.getElementById('depositModal').classList.add('flex');
      document.getElementById('dep-amount-input').value = '';
    } else {
      const data = await res.json();
      alert(data.message || 'Pengajuan deposit gagal');
    }
  } catch (err) {
    alert('Gagal membuat transaksi');
  }
}

async function handleWithdrawSubmit(event) {
  event.preventDefault();
  if (!currentUser) return openAuthModal('login');

  const amount = parseFloat(document.getElementById('wd-amount-input').value);
  const bankInfo = document.getElementById('ph-bank').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.userId || currentUser._id,
        userName: currentUser.name,
        type: 'Withdraw',
        amount: amount,
        bankDetails: bankInfo
      })
    });

    if (res.ok) {
      alert('Permohonan pengeluaran berjaya dihantar');
      document.getElementById('wd-amount-input').value = '';
      switchSubTab('status');
    } else {
      const data = await res.json();
      alert(data.message || 'Pengeluaran gagal');
    }
  } catch (err) {
    alert('Gagal membuat transaksi pengeluaran');
  }
}

async function fetchTransactionHistory() {
  if (!currentUser) return;
  const container = document.getElementById('transaction-history-list');
  const userId = currentUser.userId || currentUser._id;
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions/user/${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (data.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Tiada sejarah transaksi.</p>`;
      return;
    }

    container.innerHTML = data.map(trx => `
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
        <div>
          <div class="flex items-center space-x-1.5">
            <span class="font-bold ${trx.type === 'Deposit' ? 'text-blue-600' : 'text-rose-600'}">${trx.type}</span>
            <span class="text-[10px] text-slate-400">${trx.trxId}</span>
          </div>
          <p class="text-[10px] text-slate-500 mt-0.5">${new Date(trx.createdAt).toLocaleString()}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-slate-900">RM ${trx.amount.toFixed(2)}</p>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${
            trx.status === 'Berhasil' ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' :
            trx.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' :
            'bg-amber-500/10 text-amber-700 border border-amber-500/20'
          }">${trx.status}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-rose-600 text-center py-2">Gagal memuat sejarah</p>`;
  }
}

async function handleBankInfoSubmit(event) {
  event.preventDefault();
  if (!currentUser) return openAuthModal('login');

  const bankName = document.getElementById('user-bank-select').value;
  const accNumber = document.getElementById('user-acc-input').value;
  const holderName = document.getElementById('user-holder-input').value;
  const userId = currentUser.userId || currentUser._id;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}/bank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankName, accNumber, holderName })
    });

    if (res.ok) {
      currentUser = await res.json();
      localStorage.setItem('tradex_user', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      alert('Akaun bank berjaya disimpan!');
    }
  } catch (err) {
    alert('Gagal menyimpan maklumat bank');
  }
}

function closeDepositModal() {
  const modal = document.getElementById('depositModal');
  if (modal) modal.classList.add('hidden'), modal.classList.remove('flex');
}

function redirectToCustomerService() {
  window.open('https://wa.me/00000', '_blank');
}

// SLIDER LOGIC
function initSlider() {
  let currentSlide = 0;
  const slider = document.getElementById('slider-container');
  const dot0 = document.getElementById('dot-0');
  const dot1 = document.getElementById('dot-1');

  setInterval(() => {
    currentSlide = currentSlide === 0 ? 1 : 0;
    if (slider) slider.style.transform = `translateX(-${currentSlide * 50}%)`;
    if (dot0 && dot1) {
      dot0.className = `w-2 h-2 rounded-full ${currentSlide === 0 ? 'bg-blue-600' : 'bg-slate-300'}`;
      dot1.className = `w-2 h-2 rounded-full ${currentSlide === 1 ? 'bg-blue-600' : 'bg-slate-300'}`;
    }
  }, 4000);
}

// WATCHLIST DATA & RENDER
const watchlistData = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$68,400.00', change: '+3.12%', positive: true, cat: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,520.50', change: '+1.85%', positive: true, cat: 'crypto' },
  { symbol: 'MAYBANK.KL', name: 'Malayan Banking', price: 'RM 9.92', change: '-0.20%', positive: false, cat: 'saham-my' },
  { symbol: 'TENAGA.KL', name: 'Tenaga Nasional', price: 'RM 13.80', change: '+0.44%', positive: true, cat: 'saham-my' },
  { symbol: 'NVDA', name: 'Nvidia Corporation', price: '$128.20', change: '+4.15%', positive: true, cat: 'saham-us' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: '1.0892', change: '-0.05%', positive: false, cat: 'forex' }
];

function initWatchlist(category = 'all') {
  const container = document.getElementById('watchlist-container');
  if (!container) return;

  const filtered = category === 'all' ? watchlistData : watchlistData.filter(i => i.cat === category);
  container.innerHTML = filtered.map(item => `
    <div onclick="updateChartSymbol('${item.symbol}')" class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-md cursor-pointer transition">
      <div>
        <p class="font-bold text-xs text-slate-900">${item.symbol}</p>
        <p class="text-[10px] text-slate-500">${item.name}</p>
      </div>
      <div class="text-right">
        <p class="font-bold text-xs text-slate-900">${item.price}</p>
        <p class="text-[10px] font-bold ${item.positive ? 'text-blue-600' : 'text-rose-600'}">${item.change}</p>
      </div>
    </div>
  `).join('');
}

function filterCategory(cat) {
  ['all', 'saham-my', 'saham-us', 'crypto', 'forex'].forEach(c => {
    const btn = document.getElementById(`cat-${c}`);
    if (btn) btn.className = "bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition";
  });
  const activeBtn = document.getElementById(`cat-${cat}`);
  if (activeBtn) activeBtn.className = "bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition";

  initWatchlist(cat);
}

// CHART SYSTEM (CHART.JS)
function initChart() {
  const ctx = document.getElementById('tradingChart');
  if (!ctx) return;

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      datasets: [{
        label: 'Price',
        data: [66200, 66800, 67400, 67100, 68000, 67900, 68400],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } },
        y: { grid: { color: 'rgba(226, 232, 240, 0.8)' }, ticks: { color: '#64748b', font: { size: 9 } } }
      }
    }
  });
}

function updateChartSymbol(symbol) {
  const symbolLbl = document.getElementById('lbl-symbol');
  if (symbolLbl) symbolLbl.textContent = symbol;
  
  if (currentChart) {
    const randomMultiplier = symbol.includes('USD') ? 1000 : 10;
    const newData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + randomMultiplier);
    currentChart.data.datasets[0].data = newData;
    currentChart.update();
  }
}

function changeTimeframe(tf) {
  ['1D', '1W', '1M', '1Y'].forEach(t => {
    const btn = document.getElementById(`tf-${t}`);
    if (btn) btn.className = "bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded transition";
  });
  const activeBtn = document.getElementById(`tf-${tf}`);
  if (activeBtn) activeBtn.className = "bg-blue-600 text-white font-bold px-2 py-0.5 rounded transition";

  if (currentChart) {
    const newData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 500);
    currentChart.data.datasets[0].data = newData;
    currentChart.update();
  }
}

function changeLanguage(lang) {
  console.log("Bahasa ditukar ke:", lang);
}
