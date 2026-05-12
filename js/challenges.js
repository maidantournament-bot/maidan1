/* ============================================
   MAIDAN - Challenge System
   ============================================ */

// ===== OPEN POST CHALLENGE MODAL =====
function openPostChallenge() {
  if (!MAIDAN.isLoggedIn) { showPage('auth'); return; }
  document.getElementById('modal-challenge').classList.add('open');

  // Live preview of commission
  document.getElementById('ch-amount').addEventListener('input', function() {
    const amt = parseInt(this.value) || 0;
    const preview = document.getElementById('ch-amount-preview');
    if (amt >= 20) {
      const total = amt * 2;
      const commission = Math.floor(total * 0.05);
      const prize = total - commission;
      preview.innerHTML = `Total pot: <strong>${total} MP</strong> | Commission (5%): <strong>${commission} MP</strong> | Winner gets: <strong style="color:var(--accent-green)">${prize} MP</strong>`;
    } else {
      preview.innerHTML = amt > 0 ? '<span style="color:#ff4444">Minimum 20 MP per side</span>' : '';
    }
  });
}

// ===== POST CHALLENGE =====
function postChallenge() {
  const game = document.getElementById('ch-game').value;
  const type = document.getElementById('ch-type').value;
  const mode = document.getElementById('ch-mode').value;
  const amount = parseInt(document.getElementById('ch-amount').value);
  const title = document.getElementById('ch-title').value.trim();
  const rules = document.getElementById('ch-rules').value.trim();
  const ingame = document.getElementById('ch-ingame').value.trim();

  if (!game) { showToast('❌ Select a game', 'error'); return; }
  if (!title) { showToast('❌ Enter a challenge title', 'error'); return; }
  if (!amount || amount < 20) { showToast('❌ Minimum bet is 20 MP', 'error'); return; }
  if (!ingame) { showToast('❌ Enter your in-game username', 'error'); return; }
  if (MAIDAN.currentUser.balance < amount) {
    showToast('❌ Insufficient balance. Deposit more MP first.', 'error');
    closeModal('modal-challenge');
    setTimeout(() => { showDashSection('wallet', null); openDeposit(); }, 500);
    return;
  }

  // Deduct bet amount (held in escrow)
  MAIDAN.deductBalance(amount);
  MAIDAN.addTransaction('debit', amount, 'Challenge posted: ' + title, 'completed', 'escrow');

  const ch = MAIDAN.postChallenge({ game, type, mode, amount, title, rules, ingame });

  closeModal('modal-challenge');
  showToast('⚔️ Challenge posted! ID: ' + ch.id, 'success');

  // Reset form
  ['ch-game','ch-type','ch-mode','ch-amount','ch-title','ch-rules','ch-ingame'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0]?.value || '' : '';
  });
  document.getElementById('ch-amount-preview').innerHTML = '';

  // Refresh lists
  loadChallengesGrid();
  loadHomeChallenges();
}

// ===== ACCEPT CHALLENGE =====
function openAcceptChallenge(challengeId) {
  if (!MAIDAN.isLoggedIn) { showPage('auth'); return; }

  const ch = MAIDAN.challenges.find(c => c.id === challengeId);
  if (!ch) { showToast('❌ Challenge not found', 'error'); return; }
  if (ch.createdById === MAIDAN.currentUser.id) {
    showToast('❌ You cannot accept your own challenge', 'error'); return;
  }
  if (ch.status !== 'open') {
    showToast('❌ This challenge is no longer available', 'error'); return;
  }

  const total = ch.amount * 2;
  const commission = Math.floor(total * 0.05);
  const prize = total - commission;
  const userBalance = MAIDAN.currentUser.balance;
  const canAfford = userBalance >= ch.amount;

  const gameIcons = { freefire: '🔥', pubg: '🪖', mlbb: '⚔️', cod: '🎯' };

  document.getElementById('accept-modal-body').innerHTML = `
    <div class="accept-details">
      <div class="acc-game-header">
        <span class="acc-game-icon">${gameIcons[ch.game] || '🎮'}</span>
        <div>
          <h4>${ch.title}</h4>
          <p style="color:var(--text-muted);font-size:0.85rem">${ch.game.toUpperCase()} · ${ch.type} · ${ch.mode}</p>
        </div>
      </div>
      <div class="acc-info-grid">
        <div class="acc-info-item"><span>Posted by</span><strong>${ch.createdBy}</strong></div>
        <div class="acc-info-item"><span>Your bet</span><strong style="color:var(--accent-orange)">${ch.amount} MP</strong></div>
        <div class="acc-info-item"><span>Prize pool</span><strong style="color:var(--accent-green)">${prize} MP</strong></div>
        <div class="acc-info-item"><span>Commission</span><strong>${commission} MP (5%)</strong></div>
        <div class="acc-info-item"><span>Your balance</span><strong ${!canAfford ? 'style="color:#ff4444"' : ''}>${userBalance} MP</strong></div>
      </div>
      ${ch.rules ? `<div class="acc-rules"><strong>Rules:</strong> ${ch.rules}</div>` : ''}
      <div class="acc-ingame">
        <strong>Opponent In-Game: ${ch.ingame}</strong>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">Send friend request or join their room after accepting.</p>
      </div>
      ${!canAfford ? `
        <div class="acc-insufficient">
          ❌ Insufficient balance! You need <strong>${ch.amount} MP</strong> but have <strong>${userBalance} MP</strong>.
          <br/><button class="btn-outline" style="margin-top:0.75rem" onclick="closeModal('modal-accept');showDashSection('wallet',null);openDeposit()">Deposit Now</button>
        </div>
      ` : `
        <button class="btn-form" onclick="confirmAcceptChallenge('${ch.id}')">⚔️ Accept Challenge & Join</button>
      `}
    </div>
  `;

  document.getElementById('modal-accept').classList.add('open');
}

function confirmAcceptChallenge(challengeId) {
  const ch = MAIDAN.challenges.find(c => c.id === challengeId);
  if (!ch) return;

  if (MAIDAN.currentUser.balance < ch.amount) {
    showToast('❌ Insufficient balance', 'error'); return;
  }

  // Deduct challenger's bet
  MAIDAN.deductBalance(ch.amount);
  MAIDAN.addTransaction('debit', ch.amount, 'Challenge accepted: ' + ch.title, 'completed', 'escrow');

  // Update challenge status
  ch.status = 'in_progress';
  ch.acceptedBy = MAIDAN.currentUser.username;
  ch.acceptedById = MAIDAN.currentUser.id;
  ch.acceptedAt = Date.now();
  MAIDAN.save('challenges', MAIDAN.challenges);

  // Update my stats
  MAIDAN.currentUser.stats.played++;
  MAIDAN.save('user', MAIDAN.currentUser);

  closeModal('modal-accept');
  showToast('✅ Challenge accepted! Contact ' + ch.createdBy + ' in-game: ' + ch.ingame, 'success');

  loadChallengesGrid();
  loadHomeChallenges();
}

// ===== GAME SELECT FROM GAME SECTION =====
function selectGame(game) {
  MAIDAN.selectedGame = game;
  // Go to challenges section with filter applied
  showDashSection('challenges', document.querySelector('.snav-item:nth-child(3)'));
  setTimeout(() => {
    const gameFilter = document.getElementById('cf-game');
    if (gameFilter) { gameFilter.value = game; filterChallenges(); }
  }, 100);
}

// ===== LOAD HOME CHALLENGES (mini list) =====
function loadHomeChallenges() {
  const container = document.getElementById('home-challenges');
  if (!container) return;

  const openChallenges = MAIDAN.challenges.filter(c => c.status === 'open').slice(0, 4);

  if (openChallenges.length === 0) {
    container.innerHTML = '<div class="empty-state">No open challenges yet. <a href="#" class="link-blue" onclick="openPostChallenge()">Post the first one!</a></div>';
    return;
  }

  container.innerHTML = openChallenges.map(ch => buildChallengeCard(ch)).join('');
}

// ===== LOAD CHALLENGES GRID =====
function loadChallengesGrid() {
  filterChallenges();
}

function filterChallenges() {
  const container = document.getElementById('challenges-grid');
  if (!container) return;

  const gameFilter = (document.getElementById('cf-game')?.value || '').toLowerCase();
  const typeFilter = (document.getElementById('cf-type')?.value || '').toLowerCase();
  const amountFilter = document.getElementById('cf-amount')?.value || '';
  const search = (document.getElementById('cf-search')?.value || '').toLowerCase();

  let filtered = MAIDAN.challenges.filter(ch => {
    if (ch.status !== 'open') return false;
    if (gameFilter && ch.game !== gameFilter) return false;
    if (typeFilter && ch.type !== typeFilter) return false;
    if (search && !ch.title.toLowerCase().includes(search) && !ch.game.includes(search)) return false;
    if (amountFilter === '20-100' && (ch.amount < 20 || ch.amount > 100)) return false;
    if (amountFilter === '100-500' && (ch.amount < 100 || ch.amount > 500)) return false;
    if (amountFilter === '500+' && ch.amount < 500) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      No challenges found matching your filters.<br/>
      <button class="btn-outline" style="margin-top:1rem" onclick="openPostChallenge()">Post a Challenge</button>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map(ch => buildChallengeCard(ch)).join('');
}

// ===== BUILD CHALLENGE CARD HTML =====
function buildChallengeCard(ch) {
  const gameIcons = { freefire: '🔥', pubg: '🪖', mlbb: '⚔️', cod: '🎯' };
  const total = ch.amount * 2;
  const commission = Math.floor(total * 0.05);
  const prize = total - commission;
  const timeAgo = getTimeAgo(ch.time);
  const isOwn = MAIDAN.currentUser && ch.createdById === MAIDAN.currentUser.id;

  return `
    <div class="challenge-card ${ch.game}">
      <div class="cc-game-icon">${gameIcons[ch.game] || '🎮'}</div>
      <div class="cc-info">
        <div class="cc-title">${ch.title}</div>
        <div class="cc-meta">
          <span class="cc-badge">${ch.type.toUpperCase()}</span>
          <span class="cc-badge">${ch.mode}</span>
          <span>${ch.game.toUpperCase()}</span>
          <span>·</span>
          <span>${timeAgo}</span>
        </div>
        <div class="cc-meta" style="margin-top:0.3rem;font-size:0.75rem">
          By: <strong style="color:var(--text-primary)">${ch.createdBy}</strong>
          ${ch.rules ? '· ' + ch.rules.substring(0, 50) + (ch.rules.length > 50 ? '...' : '') : ''}
        </div>
      </div>
      <div class="cc-amount">
        <span class="cc-prize">+${prize} MP</span>
        <span class="cc-mp">Bet: ${ch.amount} MP each</span>
      </div>
      <div class="cc-actions">
        ${isOwn
          ? `<span style="font-size:0.75rem;color:var(--accent-blue);text-align:center">Your<br/>Challenge</span>
             <button class="btn-outline" style="font-size:0.7rem;padding:0.4rem 0.75rem" onclick="cancelChallenge('${ch.id}')">Cancel</button>`
          : `<button class="cc-accept-btn" onclick="openAcceptChallenge('${ch.id}')">⚔️ Accept</button>`
        }
        <div class="cc-posted-by">ID: ${ch.id}</div>
      </div>
    </div>
  `;
}

// ===== CANCEL OWN CHALLENGE =====
function cancelChallenge(challengeId) {
  const ch = MAIDAN.challenges.find(c => c.id === challengeId);
  if (!ch) return;
  if (ch.createdById !== MAIDAN.currentUser.id) return;
  if (!confirm('Cancel this challenge? Your bet (' + ch.amount + ' MP) will be refunded.')) return;

  // Refund
  MAIDAN.addBalance(ch.amount);
  MAIDAN.addTransaction('credit', ch.amount, 'Challenge cancelled (refund): ' + ch.title, 'completed', 'refund');

  ch.status = 'cancelled';
  MAIDAN.save('challenges', MAIDAN.challenges);

  showToast('✅ Challenge cancelled. ' + ch.amount + ' MP refunded.', 'success');
  loadChallengesGrid();
  loadHomeChallenges();
}

// ===== LOAD HOME ACTIVITY =====
function loadHomeActivity() {
  const container = document.getElementById('home-activity');
  if (!container) return;

  const activities = [];
  MAIDAN.transactions.slice(0, 5).forEach(t => {
    activities.push({
      icon: t.type === 'credit' ? '💰' : '💸',
      text: t.label,
      amount: (t.type === 'credit' ? '+' : '-') + t.amount + ' MP',
      time: getTimeAgo(t.time),
      color: t.type === 'credit' ? 'var(--accent-green)' : '#ff4444'
    });
  });

  if (activities.length === 0) {
    container.innerHTML = '<div class="empty-state">No activity yet. Post a challenge to get started!</div>';
    return;
  }

  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon">${a.icon}</div>
      <div class="activity-text">${a.text}</div>
      <div style="color:${a.color};font-weight:700;font-family:var(--font-display);font-size:0.9rem">${a.amount}</div>
      <div class="activity-time">${a.time}</div>
    </div>
  `).join('');
}

// ===== CLOSE MODAL =====
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ===== TIME AGO HELPER =====
function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  return days + 'd ago';
}
