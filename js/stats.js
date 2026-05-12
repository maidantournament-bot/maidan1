/* ============================================
   MAIDAN - Stats System
   ============================================ */

function loadPublicStats() {
  const lb = document.getElementById('public-leaderboard');
  if (!lb) return;
  const leaders = MAIDAN.generateLeaderboard();
  lb.innerHTML = leaders.map(p => `
    <div class="lb-item" style="animation:fadeInUp 0.4s ease ${p.rank * 0.05}s both">
      <div class="lb-rank">${p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : '#' + p.rank}</div>
      <div class="lb-avatar">${p.avatar}</div>
      <div class="lb-info">
        <div class="lb-name">${p.name}</div>
        <div class="lb-id">${p.id}</div>
      </div>
      <div class="lb-stats">
        <div class="lb-wins">${p.wins} Wins</div>
        <div class="lb-wr">${p.wr} win rate</div>
        <div style="font-size:0.75rem;color:var(--accent-green);font-weight:700">${p.earned}</div>
      </div>
    </div>
  `).join('');
}

function loadDashStats() {
  const leaders = MAIDAN.generateLeaderboard();
  const lbEl = document.getElementById('leaderboard-list');
  if (lbEl) {
    lbEl.innerHTML = leaders.map(p => `
      <div class="lb-item">
        <div class="lb-rank">${p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : '#' + p.rank}</div>
        <div class="lb-avatar">${p.avatar}</div>
        <div class="lb-info">
          <div class="lb-name">${p.name}</div>
          <div class="lb-id">${p.id}</div>
        </div>
        <div class="lb-stats">
          <div class="lb-wins">${p.wins} Wins</div>
          <div class="lb-wr">${p.wr} · ${p.earned}</div>
        </div>
      </div>
    `).join('');
  }
  const u = MAIDAN.currentUser;
  if (!u) return;
  const played = u.stats?.played || 0;
  const won    = u.stats?.won    || 0;
  const lost   = u.stats?.lost   || 0;
  const earned = u.stats?.earned || 0;
  const wr     = played > 0 ? Math.round((won / played) * 100) + '%' : '0%';
  setText('mstat-played', played);
  setText('mstat-won',    won);
  setText('mstat-lost',   lost);
  setText('mstat-wr',     wr);
  setText('mstat-earned', '₹' + earned);
  setText('qs-played',  played);
  setText('qs-won',     won);
  setText('qs-earned',  '₹' + earned);
  setText('qs-winrate', wr);
}
