/* ============================================
   MAIDAN - Authentication Logic
   ============================================ */

let otpCountdown = null;
let generatedOTP = null;

// ===== PAGE NAVIGATION =====
function showPage(page) {
  // Guard: dashboard requires login
  if (page === 'dashboard' && !MAIDAN.isLoggedIn) {
    showPage('auth');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    MAIDAN.currentPage = page;
    window.scrollTo(0, 0);
  }

  // Update nav
  const navbar = document.getElementById('navbar');
  const navActions = document.getElementById('navActions');
  if (page === 'dashboard') {
    navbar.style.display = 'none';
    loadDashboard();
  } else {
    navbar.style.display = '';
    if (MAIDAN.isLoggedIn && navActions) {
      navActions.innerHTML = `
        <div class="wallet-badge" style="cursor:pointer" onclick="showPage('dashboard')">
          <span>💎</span><span>${MAIDAN.currentUser.balance} MP</span>
        </div>
        <button class="btn-primary" onclick="showPage('dashboard')">Dashboard</button>
      `;
    } else if (navActions) {
      navActions.innerHTML = `
        <button class="btn-outline" onclick="showPage('auth')">Login</button>
        <button class="btn-primary" onclick="showPage('auth')">Sign Up</button>
      `;
    }
  }

  // Load public stats
  if (page === 'stats') loadPublicStats();
}

// ===== AUTH TAB SWITCH =====
function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('auth-' + tab).classList.add('active');
}

// ===== LOGIN METHOD SWITCH =====
function switchLoginMethod(method, btn) {
  document.querySelectorAll('.otp-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('email-login-form').style.display = method === 'email' ? 'block' : 'none';
  document.getElementById('mobile-login-form').style.display = method === 'mobile' ? 'block' : 'none';
}

// ===== SOCIAL LOGIN =====
function socialLogin(provider) {
  showToast('⚡ Connecting to ' + provider.charAt(0).toUpperCase() + provider.slice(1) + '...', 'info');

  // Simulate OAuth flow
  setTimeout(() => {
    const names = { google: 'Google User', facebook: 'Facebook User', apple: 'Apple User', twitter: 'Twitter User' };
    const emails = { google: 'user@gmail.com', facebook: 'user@fb.com', apple: 'user@icloud.com', twitter: 'user@twitter.com' };

    const user = MAIDAN.createUser({
      name: names[provider],
      username: provider + '_' + Math.floor(Math.random() * 9999),
      email: emails[provider],
      provider: provider
    });

    showToast('✅ Logged in with ' + provider + '! Welcome, ' + user.name, 'success');
    setTimeout(() => showPage('dashboard'), 800);
  }, 1500);
}

// ===== EMAIL LOGIN =====
function emailLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('❌ Please enter email and password', 'error');
    return;
  }
  if (!validateEmail(email)) {
    showToast('❌ Invalid email address', 'error');
    return;
  }

  // Check if user exists in storage
  const storedUser = MAIDAN.load('user');
  if (storedUser && storedUser.email === email) {
    MAIDAN.currentUser = storedUser;
    MAIDAN.isLoggedIn = true;
    MAIDAN.save('user', storedUser);
    showToast('✅ Welcome back, ' + storedUser.name + '!', 'success');
    setTimeout(() => showPage('dashboard'), 800);
  } else {
    // Demo: create account if not found
    const user = MAIDAN.createUser({ name: email.split('@')[0], email: email });
    showToast('✅ Logged in as ' + user.name, 'success');
    setTimeout(() => showPage('dashboard'), 800);
  }
}

// ===== SEND OTP =====
function sendOTP() {
  const mobile = document.getElementById('mobile-number').value.trim();
  if (!mobile || mobile.length < 7) {
    showToast('❌ Enter a valid mobile number', 'error');
    return;
  }

  // Generate 6-digit OTP
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // In production: send via SMS API (Sparrow SMS, etc.)
  // For demo: show OTP in toast
  showToast('📱 OTP sent to +977 ' + mobile + ' | Demo OTP: ' + generatedOTP, 'info');

  document.getElementById('otp-field').style.display = 'block';
  document.getElementById('send-otp-btn').textContent = 'Resend OTP';
  document.getElementById('send-otp-btn').disabled = true;

  // Setup OTP box auto-advance
  setupOTPBoxes();

  // Start countdown
  startOTPCountdown(60);
}

function setupOTPBoxes() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, i) => {
    box.value = '';
    box.addEventListener('input', function() {
      if (this.value.length === 1 && i < boxes.length - 1) {
        boxes[i + 1].focus();
      }
    });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !this.value && i > 0) {
        boxes[i - 1].focus();
      }
    });
  });
  if (boxes.length) boxes[0].focus();
}

function startOTPCountdown(seconds) {
  if (otpCountdown) clearInterval(otpCountdown);
  let remaining = seconds;
  const timerEl = document.getElementById('otp-timer');

  otpCountdown = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = '(' + remaining + 's)';
    if (remaining <= 0) {
      clearInterval(otpCountdown);
      const btn = document.getElementById('send-otp-btn');
      if (btn) { btn.disabled = false; btn.textContent = 'Resend OTP'; }
      if (timerEl) timerEl.textContent = '';
    }
  }, 1000);
}

function verifyOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  const enteredOTP = Array.from(boxes).map(b => b.value).join('');

  if (enteredOTP.length < 6) {
    showToast('❌ Enter the 6-digit OTP', 'error');
    return;
  }

  if (enteredOTP === generatedOTP) {
    const mobile = document.getElementById('mobile-number').value.trim();
    const storedUser = MAIDAN.load('user');

    if (storedUser && storedUser.mobile === mobile) {
      MAIDAN.currentUser = storedUser;
      MAIDAN.isLoggedIn = true;
    } else {
      MAIDAN.createUser({ name: 'Player_' + mobile.slice(-4), mobile: mobile });
    }

    showToast('✅ OTP verified! Welcome to MAIDAN!', 'success');
    setTimeout(() => showPage('dashboard'), 800);
  } else {
    showToast('❌ Wrong OTP. Try again.', 'error');
    document.querySelectorAll('.otp-box').forEach(b => {
      b.value = '';
      b.style.borderColor = '#ff4444';
      setTimeout(() => b.style.borderColor = '', 1500);
    });
  }
}

// ===== REGISTER =====
function registerUser() {
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const mobile = document.getElementById('reg-mobile').value.trim();
  const password = document.getElementById('reg-password').value;
  const cpassword = document.getElementById('reg-cpassword').value;
  const terms = document.getElementById('reg-terms').checked;

  if (!name || !username || !email || !password) {
    showToast('❌ Please fill all required fields', 'error'); return;
  }
  if (!validateEmail(email)) {
    showToast('❌ Invalid email address', 'error'); return;
  }
  if (password.length < 8) {
    showToast('❌ Password must be at least 8 characters', 'error'); return;
  }
  if (password !== cpassword) {
    showToast('❌ Passwords do not match', 'error'); return;
  }
  if (!terms) {
    showToast('❌ Please accept Terms of Service', 'error'); return;
  }
  if (username.length < 3) {
    showToast('❌ Username must be at least 3 characters', 'error'); return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showToast('❌ Username: only letters, numbers, underscore', 'error'); return;
  }

  const user = MAIDAN.createUser({ name, username, email, mobile });
  showToast('🎉 Account created! Welcome to MAIDAN, ' + name + '!', 'success');
  setTimeout(() => showPage('dashboard'), 1000);
}

// ===== LOGOUT =====
function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  MAIDAN.currentUser = null;
  MAIDAN.isLoggedIn = false;
  showPage('landing');
  showToast('👋 Logged out successfully', 'info');
}

// ===== PASSWORD TOGGLE =====
function togglePwd(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== HELPERS =====
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== MOBILE NAV =====
function toggleMobileMenu() {
  const links = document.getElementById('navLinks');
  links.classList.toggle('mobile-open');
}
