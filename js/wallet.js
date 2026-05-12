/* ============================================
   MAIDAN - Wallet System
   ============================================ */

let selectedPaymentMethod = null;

// ===== OPEN DEPOSIT =====
function openDeposit() {
  document.getElementById('deposit-section').style.display = 'block';
  document.getElementById('withdraw-section').style.display = 'none';
  document.getElementById('txn-section').style.display = 'none';
  document.getElementById('deposit-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== OPEN WITHDRAW =====
function openWithdraw() {
  document.getElementById('deposit-section').style.display = 'none';
  document.getElementById('withdraw-section').style.display = 'block';
  document.getElementById('txn-section').style.display = 'none';
  document.getElementById('withdraw-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== OPEN TRANSACTIONS =====
function openTransactions() {
  document.getElementById('deposit-section').style.display = 'none';
  document.getElementById('withdraw-section').style.display = 'none';
  document.getElementById('txn-section').style.display = 'block';
  loadTransactionHistory();
  document.getElementById('txn-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== SELECT PAYMENT METHOD =====
function selectPayment(method) {
  selectedPaymentMethod = method;

  // Highlight selected
  document.querySelectorAll('.deposit-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  const detailsEl = document.getElementById('payment-details');
  const formEl = document.getElementById('deposit-form');
  detailsEl.style.display = 'block';
  formEl.style.display = 'block';

  const details = {
    esewa: {
      title: '📱 Pay via eSewa',
      content: `
        <h4>eSewa Payment Instructions</h4>
        <p>1. Open your <strong>eSewa app</strong></p>
        <p>2. Go to <strong>Send Money</strong></p>
        <p>3. Enter eSewa ID: <strong style="color:var(--accent-blue);font-size:1.1rem">9700372419</strong></p>
        <p>4. Enter the amount you want to deposit</p>
        <p>5. Complete payment and take a screenshot</p>
        <p>6. Fill the form below and submit</p>
        <p style="margin-top:0.75rem;color:var(--accent-green)">✅ Min: 20 NPR | Processing: 30–60 mins</p>
      `
    },
    khalti: {
      title: '💜 Pay via Khalti',
      content: `
        <h4>Khalti Payment Instructions</h4>
        <p>1. Open your <strong>Khalti app</strong></p>
        <p>2. Go to <strong>Send Money</strong></p>
        <p>3. Enter Khalti ID: <strong style="color:var(--accent-blue);font-size:1.1rem">9860742231</strong></p>
        <p>4. Enter the amount you want to deposit</p>
        <p>5. Complete payment and take a screenshot</p>
        <p>6. Fill the form below and submit</p>
        <p style="margin-top:0.75rem;color:var(--accent-green)">✅ Min: 20 NPR | Processing: 30–60 mins</p>
      `
    },
    binance: {
      title: '₿ Pay via Binance Pay',
      content: `
        <h4>Binance Pay Instructions</h4>
        <p>1. Open your <strong>Binance app</strong></p>
        <p>2. Go to <strong>Pay → Send</strong></p>
        <p>3. Contact us on WhatsApp: <strong style="color:var(--accent-blue)">+977 9700372419</strong> for our Binance Pay ID</p>
        <p>4. Send USDT equivalent of your deposit amount</p>
        <p>5. Exchange rate: 1 USDT ≈ 135 NPR (varies daily)</p>
        <p>6. Take screenshot and submit below</p>
        <p style="margin-top:0.75rem;color:var(--accent-green)">✅ Worldwide | Processing: 1–3 hrs</p>
      `
    },
    international: {
      title: '🌍 International Payment',
      content: `
        <h4>International Deposit Guide</h4>
        <p><strong>Option 1 – Wise/Remitly to eSewa:</strong></p>
        <p>Send NPR to our eSewa: <strong style="color:var(--accent-blue)">9700372419</strong></p>
        <br/>
        <p><strong>Option 2 – Crypto (Binance):</strong></p>
        <p>Contact WhatsApp: <strong style="color:var(--accent-blue)">+977 9700372419</strong> for wallet address</p>
        <br/>
        <p><strong>Option 3 – Any method → eSewa/Khalti:</strong></p>
        <p>Use any Nepali remittance service to send to eSewa ID <strong>9700372419</strong> or Khalti ID <strong>9860742231</strong></p>
        <br/>
        <p>After payment, submit proof below. For help: <a href="mailto:maidantournament@gmail.com" style="color:var(--accent-blue)">maidantournament@gmail.com</a></p>
        <p style="margin-top:0.75rem;color:var(--accent-green)">✅ Worldwide | Processing: 1–12 hrs</p>
      `
    }
  };

  const d = details[method];
  detailsEl.innerHTML = `<div class="payment-details">${d.content}</div>`;
}

// ===== PREVIEW SCREENSHOT =====
function previewScreenshot(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:8px;object-fit:cover" />
        <p style="margin-top:0.5rem;font-size:0.8rem;color:var(--accent-green)">✅ Screenshot selected</p>`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ===== SUBMIT DEPOSIT =====
function submitDeposit() {
  if (!selectedPaymentMethod) {
    showToast('❌ Select a payment method first', 'error'); return;
  }

  const amount = parseInt(document.getElementById('deposit-amount').value);
  const txnId = document.getElementById('deposit-txn').value.trim();
  const ssFile = document.getElementById('deposit-ss').files[0];

  if (!amount || amount < 20) {
    showToast('❌ Minimum deposit is 20 NPR (20 MP)', 'error'); return;
  }
  if (!txnId) {
    showToast('❌ Enter your transaction ID', 'error'); return;
  }
  if (!ssFile) {
    showToast('❌ Upload payment screenshot', 'error'); return;
  }

  // Save deposit request
  const depositRequest = {
    id: 'DEP' + Date.now(),
    userId: MAIDAN.currentUser.id,
    userName: MAIDAN.currentUser.name,
    method: selectedPaymentMethod,
    amount: amount,
    txnId: txnId,
    status: 'pending',
    time: Date.now()
  };

  // Add to pending transactions list
  const pending = MAIDAN.load('pending_deposits') || [];
  pending.unshift(depositRequest);
  MAIDAN.save('pending_deposits', pending);

  MAIDAN.addTransaction('credit', amount, 'Deposit via ' + selectedPaymentMethod + ' (pending verification)', 'pending', selectedPaymentMethod);

  showToast('✅ Deposit request submitted! We\'ll verify within 30–60 mins.', 'success');

  // Reset form
  document.getElementById('deposit-amount').value = '';
  document.getElementById('deposit-txn').value = '';
  document.getElementById('deposit-ss').value = '';
  document.getElementById('ss-preview').innerHTML = '📸 Click to upload screenshot';
  document.getElementById('payment-details').style.display = 'none';
  document.getElementById('deposit-form').style.display = 'none';
  selectedPaymentMethod = null;
  document.querySelectorAll('.deposit-card').forEach(c => c.classList.remove('selected'));

  // Send alert to customer care instructions
  setTimeout(() => {
    showToast('📱 Also send screenshot to WhatsApp: +977 9700372419 for faster verification!', 'info');
  }, 2000);
}

// ===== SUBMIT WITHDRAW =====
function submitWithdraw() {
  const amount = parseInt(document.getElementById('withdraw-amount').value);
  const method = document.getElementById('withdraw-method').value;
  const number = document.getElementById('withdraw-number').value.trim();

  if (!amount || amount < 100) {
    showToast('❌ Minimum withdrawal is 100 MP', 'error'); return;
  }
  if (!method) {
    showToast('❌ Select withdrawal method', 'error'); return;
  }
  if (!number || number.length < 10) {
    showToast('❌ Enter valid eSewa/Khalti number', 'error'); return;
  }
  if (MAIDAN.currentUser.balance < amount) {
    showToast('❌ Insufficient balance', 'error'); return;
  }

  // Deduct balance
  MAIDAN.deductBalance(amount);
  MAIDAN.addTransaction('debit', amount, 'Withdrawal to ' + method + ' (' + number + ')', 'pending', method);

  // Save withdrawal request
  const withdrawRequest = {
    id: 'WTH' + Date.now(),
    userId: MAIDAN.currentUser.id,
    userName: MAIDAN.currentUser.name,
    method, number, amount,
    status: 'pending',
    time: Date.now()
  };
  const pending = MAIDAN.load('pending_withdrawals') || [];
  pending.unshift(withdrawRequest);
  MAIDAN.save('pending_withdrawals', pending);

  showToast('✅ Withdrawal request submitted! Processing in 1–24 hours.', 'success');

  document.getElementById('withdraw-amount').value = '';
  document.getElementById('withdraw-method').value = '';
  document.getElementById('withdraw-number').value = '';
}

// ===== LOAD TRANSACTION HISTORY =====
function loadTransactionHistory() {
  const container = document.getElementById('txn-list');
  if (!container) return;

  const txns = MAIDAN.transactions;

  if (!txns || txns.length === 0) {
    container.innerHTML = '<div class="empty-state">No transactions yet.</div>';
    return;
  }

  const typeIcons = {
    credit: '💰', debit: '💸', pending: '⏳'
  };

  container.innerHTML = txns.map(t => `
    <div class="txn-item">
      <div class="txn-icon">${typeIcons[t.type] || '💳'}</div>
      <div class="txn-info">
        <div class="txn-label">${t.label}</div>
        <div class="txn-date">${new Date(t.time).toLocaleString('en-NP')} · ${t.method || 'system'}</div>
      </div>
      <div>
        <div class="txn-amount ${t.type}">${t.type === 'credit' ? '+' : '-'}${t.amount} MP</div>
        <div class="txn-status ${t.status}">${t.status}</div>
      </div>
    </div>
  `).join('');
}

// ===== SUBMIT WIN RECORD =====
function submitWinRecord() {
  const matchId = document.getElementById('wr-match-id').value.trim();
  const game = document.getElementById('wr-game').value;
  const opponent = document.getElementById('wr-opponent').value.trim();
  const notes = document.getElementById('wr-notes').value.trim();
  const ssFile = document.getElementById('wr-ss').files[0];

  if (!matchId) { showToast('❌ Enter the match/challenge ID', 'error'); return; }
  if (!game) { showToast('❌ Select a game', 'error'); return; }
  if (!opponent) { showToast('❌ Enter opponent username', 'error'); return; }
  if (!ssFile) { showToast('❌ Upload win proof screenshot', 'error'); return; }

  // Find the challenge to determine prize
  const ch = MAIDAN.challenges.find(c => c.id === matchId);
  let prize = 0;
  if (ch) {
    const total = ch.amount * 2;
    prize = total - Math.floor(total * 0.05);
    ch.status = 'win_pending';
    MAIDAN.save('challenges', MAIDAN.challenges);
  }

  const record = {
    id: 'WR' + Date.now(),
    userId: MAIDAN.currentUser.id,
    matchId, game, opponent, notes,
    prize,
    status: 'pending',
    time: Date.now()
  };

  MAIDAN.winRecords.unshift(record);
  MAIDAN.save('winRecords', MAIDAN.winRecords);

  showToast('✅ Win record submitted! Admin will verify within 30 minutes.', 'success');

  // Reset form
  ['wr-match-id','wr-game','wr-opponent','wr-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('wr-ss').value = '';
  document.getElementById('wr-preview').innerHTML = '📸 Upload screenshot(s) of your win';

  loadWinRecordsList();
}

function loadWinRecordsList() {
  const container = document.getElementById('win-records-list');
  if (!container) return;

  if (MAIDAN.winRecords.length === 0) {
    container.innerHTML = '<div class="empty-state">No win records submitted yet.</div>';
    return;
  }

  const statusColors = { pending: 'orange', approved: 'var(--accent-green)', rejected: '#ff4444' };

  container.innerHTML = MAIDAN.winRecords.map(r => `
    <div class="wr-item ${r.status}">
      <div class="activity-icon">🏆</div>
      <div class="txn-info" style="flex:1">
        <div class="txn-label">Match: ${r.matchId} vs ${r.opponent}</div>
        <div class="txn-date">${r.game.toUpperCase()} · ${new Date(r.time).toLocaleString('en-NP')}</div>
        ${r.prize ? `<div style="font-size:0.8rem;color:var(--accent-green);font-weight:700">Prize: +${r.prize} MP</div>` : ''}
      </div>
      <div class="txn-status ${r.status}" style="color:${statusColors[r.status]}">${r.status.toUpperCase()}</div>
    </div>
  `).join('');
}

// ===== SUBMIT REPORT =====
function submitReport() {
  const player = document.getElementById('rp-player').value.trim();
  const type = document.getElementById('rp-type').value;
  const match = document.getElementById('rp-match').value.trim();
  const desc = document.getElementById('rp-desc').value.trim();
  const evidenceFile = document.getElementById('rp-evidence').files[0];

  if (!player) { showToast('❌ Enter the player username/ID', 'error'); return; }
  if (!type) { showToast('❌ Select report type', 'error'); return; }
  if (!desc || desc.length < 20) { showToast('❌ Describe the incident in at least 20 characters', 'error'); return; }

  const report = {
    id: 'RPT' + Date.now(),
    reporterId: MAIDAN.currentUser.id,
    reporterName: MAIDAN.currentUser.username,
    reportedPlayer: player,
    type, match, desc,
    hasEvidence: !!evidenceFile,
    status: 'open',
    time: Date.now()
  };

  MAIDAN.reports.unshift(report);
  MAIDAN.save('reports', MAIDAN.reports);

  showToast('✅ Report submitted. ID: ' + report.id + '. Our team will review within 24 hours.', 'success');

  ['rp-player','rp-type','rp-match','rp-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('rp-evidence').value = '';
  document.getElementById('rp-preview').innerHTML = '📎 Upload screenshots or video clips as evidence';
}
