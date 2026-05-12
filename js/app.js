/* ============================================
   MAIDAN - Main Application Controller
   ============================================ */

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  MAIDAN.init();

  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2200);

  // Start particles
  createParticles();

  // Animate hero stat counters
  setTimeout(animateCounters, 2400);

  // Scroll reveal
  setupScrollReveal();

  // Init page
  if (MAIDAN.isLoggedIn) {
    showPage('dashboard');
  } else {
    showPage('landing');
  }

  // OTP box global handler
  document.addEventListener('keyup', handleOTPInput);
});

// ===== DASHBOARD LOAD =====
function loadDashboard() {
  if (!MAIDAN.currentUser) return;
  const u = MAIDAN.currentUser;

  // Set user info everywhere
  setText('sb-username', u.username || u.name);
  setText('sb-userid', u.id);
  setText('welcome-name', u.name);
  setText('home-userid', u.id);
  setText('home-points', u.balance + ' MP');
  setText('topbar-points', u.balance + ' MP');
  setText('wallet-balance', u.balance);

  // Quick stats
  setText('qs-played', u.stats?.played || 0);
  setText('qs-won', u.stats?.won || 0);
  setText('qs-earned', '₹' + (u.stats?.earned || 0));
  const played = u.stats?.played || 0;
  const won = u.stats?.won || 0;
  setText('qs-winrate', played > 0 ? Math.round((won/played)*100) + '%' : '0%');

  // Profile fields
  setVal('pf-name', u.name);
  setVal('pf-username', u.username || u.id);
  setVal('pf-email', u.email || '');
  setVal('pf-mobile', u.mobile || '');
  setVal('pf-ff-id', u.inGameIds?.freefire || '');
  setVal('pf-pubg-id', u.inGameIds?.pubg || '');
  setVal('pf-mlbb-id', u.inGameIds?.mlbb || '');
  setVal('pf-cod-id', u.inGameIds?.cod || '');

  // Load sections
  loadHomeChallenges();
  loadHomeActivity();
  loadChallengesGrid();
  loadTransactionHistory();
  loadWinRecordsList();
  loadDashStats();

  // Show default section
  showDashSection('home', document.querySelector('.snav-item:first-child'));
}

// ===== SHOW DASHBOARD SECTION =====
function showDashSection(section, clickedEl) {
  document.querySelectorAll('.dsection').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));

  const target = document.getElementById('dsec-' + section);
  if (target) target.classList.add('active');
  if (clickedEl) clickedEl.classList.add('active');

  // Update topbar title
  const titles = {
    home: 'Dashboard', games: 'Select Game', challenges: 'Challenge Arena',
    wallet: 'My Wallet', stats: 'Statistics', profile: 'My Profile',
    winrecords: 'Win Records', report: 'Report Player'
  };
  setText('topbarTitle', titles[section] || section);
  MAIDAN.currentDashSection = section;

  // Refresh data per section
  if (section === 'challenges') loadChallengesGrid();
  if (section === 'stats') loadDashStats();
  if (section === 'winrecords') loadWinRecordsList();

  // Mobile: close sidebar
  if (window.innerWidth < 900) {
    document.getElementById('sidebar').classList.remove('open');
  }

  return false;
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('hidden');
}

// ===== SAVE PROFILE =====
function saveProfile() {
  const name = document.getElementById('pf-name').value.trim();
  const email = document.getElementById('pf-email').value.trim();
  const mobile = document.getElementById('pf-mobile').value.trim();

  MAIDAN.updateUser({
    name: name || MAIDAN.currentUser.name,
    email: email || MAIDAN.currentUser.email,
    mobile: mobile || MAIDAN.currentUser.mobile,
    inGameIds: {
      freefire: document.getElementById('pf-ff-id').value.trim(),
      pubg: document.getElementById('pf-pubg-id').value.trim(),
      mlbb: document.getElementById('pf-mlbb-id').value.trim(),
      cod: document.getElementById('pf-cod-id').value.trim()
    }
  });

  setText('sb-username', MAIDAN.currentUser.username || MAIDAN.currentUser.name);
  setText('welcome-name', MAIDAN.currentUser.name);
  showToast('✅ Profile saved successfully!', 'success');
}

// ===== UPLOAD AVATAR =====
function uploadAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const avatarEl = document.getElementById('profile-avatar');
    avatarEl.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    const suAvatar = document.querySelector('.su-avatar');
    if (suAvatar) suAvatar.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    MAIDAN.updateUser({ avatarUrl: e.target.result });
    showToast('✅ Avatar updated!', 'success');
  };
  reader.readAsDataURL(input.files[0]);
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    const delay = Math.random() * 8;
    const duration = Math.random() * 10 + 8;
    const left = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200;
    const colors = ['var(--accent-blue)', 'var(--accent-orange)', '#ffffff33'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      background:${color};
      animation-duration:${duration}s;
      animation-delay:${delay}s;
      --drift:${drift}px;
    `;
    container.appendChild(p);
  }
}

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll('.hstat-num').forEach(el => {
    const target = parseInt(el.getAttribute('data-target') || '0');
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString();
    }, 30);
  });
}

// ===== SCROLL REVEAL =====
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .game-big-card, .stat-box, .shg-card').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// ===== HELPERS =====
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(7,11,20,0.98)'
      : 'rgba(7,11,20,0.9)';
  }
});

// ===== OTP INPUT HANDLING =====
function handleOTPInput(e) {
  if (e.target.classList.contains('otp-box')) {
    const boxes = Array.from(document.querySelectorAll('.otp-box'));
    const idx = boxes.indexOf(e.target);
    if (e.key === 'Backspace' && !e.target.value && idx > 0) {
      boxes[idx - 1].focus();
    }
  }
}

// ===== AMOUNT PREVIEW HANDLER =====
document.addEventListener('input', function(e) {
  if (e.target.id === 'ch-amount') {
    const amt = parseInt(e.target.value) || 0;
    const preview = document.getElementById('ch-amount-preview');
    if (!preview) return;
    if (amt >= 20) {
      const total = amt * 2;
      const commission = Math.floor(total * 0.05);
      const prize = total - commission;
      preview.innerHTML = `Pot: <strong>${total} MP</strong> | Fee 5%: <strong>${commission} MP</strong> | <span style="color:var(--accent-green)">Winner: ${prize} MP</span>`;
    } else {
      preview.innerHTML = amt > 0 ? '<span style="color:#ff4444">Min 20 MP per side</span>' : '';
    }
  }
});
