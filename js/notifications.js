/* ============================================
   MAIDAN - Notifications & Live Updates
   Real-time-style updates using polling + localStorage events
   ============================================ */

const MaidanNotifs = {
  queue: [],
  unreadCount: 0,
  panel: null,

  // ===== INIT =====
  init() {
    this.createPanel();
    this.loadQueue();
    this.startPolling();
    this.listenStorageEvents();
  },

  // ===== CREATE NOTIFICATION PANEL =====
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.style.cssText = `
      position:fixed;top:70px;right:0;width:340px;max-height:80vh;
      background:#0d1526;border:1px solid rgba(0,212,255,0.2);
      border-radius:0 0 0 16px;z-index:200;overflow:hidden;
      transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      display:flex;flex-direction:column;
      box-shadow:-10px 10px 40px rgba(0,0,0,0.5);
    `;
    panel.innerHTML = `
      <div style="padding:1rem 1.25rem;border-bottom:1px solid rgba(0,212,255,0.15);
        display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div style="font-family:'Orbitron',sans-serif;font-size:0.85rem;font-weight:800">
          🔔 Notifications
        </div>
        <div style="display:flex;gap:0.75rem;align-items:center">
          <button id="notif-clear" onclick="MaidanNotifs.clearAll()" style="
            font-size:0.72rem;color:#4a5a7a;background:none;border:none;cursor:pointer;
          ">Clear all</button>
          <button onclick="MaidanNotifs.close()" style="
            background:none;border:none;color:#4a5a7a;font-size:1rem;cursor:pointer;
          ">✕</button>
        </div>
      </div>
      <div id="notif-list" style="overflow-y:auto;flex:1;padding:0.5rem 0"></div>
    `;
    document.body.appendChild(panel);
    this.panel = panel;

    // Hook notif button in topbar
    document.addEventListener('click', e => {
      if (e.target.closest('.notif-btn')) this.toggle();
    });
  },

  // ===== TOGGLE PANEL =====
  toggle() {
    const isOpen = this.panel.style.transform === 'translateX(0%)';
    this.panel.style.transform = isOpen ? 'translateX(100%)' : 'translateX(0%)';
    if (!isOpen) this.markAllRead();
  },
  close() {
    this.panel.style.transform = 'translateX(100%)';
  },

  // ===== ADD NOTIFICATION =====
  add(icon, title, body, type = 'info', link = null) {
    const notif = {
      id: 'N' + Date.now(),
      icon, title, body, type, link,
      time: Date.now(),
      read: false
    };
    this.queue.unshift(notif);
    if (this.queue.length > 50) this.queue = this.queue.slice(0, 50);
    this.unreadCount++;
    this.saveQueue();
    this.render();
    this.updateBadge();
    this.showToastNotif(icon, title, body);
    return notif;
  },

  // ===== RENDER LIST =====
  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (!this.queue.length) {
      list.innerHTML = `<div style="text-align:center;padding:2rem;color:#4a5a7a;font-size:0.85rem">
        No notifications yet
      </div>`;
      return;
    }

    list.innerHTML = this.queue.map(n => `
      <div onclick="MaidanNotifs.clickNotif('${n.id}')" style="
        padding:0.9rem 1.25rem;border-bottom:1px solid rgba(0,212,255,0.06);
        cursor:pointer;transition:background 0.2s;
        background:${n.read ? 'transparent' : 'rgba(0,212,255,0.04)'};
        display:flex;gap:0.75rem;align-items:flex-start;
      " onmouseover="this.style.background='rgba(255,255,255,0.03)'"
         onmouseout="this.style.background='${n.read ? 'transparent' : 'rgba(0,212,255,0.04)'}'">
        <span style="font-size:1.4rem;flex-shrink:0;margin-top:0.1rem">${n.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.82rem;font-weight:700;color:#e8f0fe;margin-bottom:0.2rem">
            ${n.title}
            ${!n.read ? '<span style="display:inline-block;width:7px;height:7px;background:#00d4ff;border-radius:50%;margin-left:0.4rem;vertical-align:middle"></span>' : ''}
          </div>
          <div style="font-size:0.78rem;color:#8899bb;line-height:1.5">${n.body}</div>
          <div style="font-size:0.7rem;color:#4a5a7a;margin-top:0.3rem">${this.timeAgo(n.time)}</div>
        </div>
      </div>
    `).join('');
  },

  clickNotif(id) {
    const n = this.queue.find(q => q.id === id);
    if (n) { n.read = true; this.saveQueue(); this.render(); }
    this.close();
  },

  markAllRead() {
    this.queue.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.saveQueue();
    this.render();
    this.updateBadge();
  },

  clearAll() {
    this.queue = [];
    this.unreadCount = 0;
    this.saveQueue();
    this.render();
    this.updateBadge();
  },

  updateBadge() {
    const dot = document.querySelector('.notif-dot');
    const count = this.queue.filter(n => !n.read).length;
    if (dot) dot.style.display = count > 0 ? 'block' : 'none';
  },

  // ===== FLOATING TOAST NOTIF =====
  showToastNotif(icon, title, body) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;top:85px;right:16px;
      background:#111c35;border:1px solid rgba(0,212,255,0.25);
      border-radius:12px;padding:0.85rem 1rem;
      display:flex;gap:0.75rem;align-items:flex-start;
      z-index:9997;max-width:300px;
      animation:slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow:0 8px 30px rgba(0,0,0,0.5);cursor:pointer;
    `;
    el.innerHTML = `
      <span style="font-size:1.3rem;flex-shrink:0">${icon}</span>
      <div>
        <div style="font-size:0.8rem;font-weight:700;color:#e8f0fe">${title}</div>
        <div style="font-size:0.75rem;color:#8899bb;margin-top:0.15rem">${body.substring(0,80)}${body.length>80?'...':''}</div>
      </div>
    `;
    el.onclick = () => el.remove();
    document.body.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideInRight 0.3s reverse'; setTimeout(() => el.remove(), 280); }, 4000);
  },

  // ===== STORAGE =====
  saveQueue() {
    try { localStorage.setItem('maidan_notifs', JSON.stringify(this.queue)); } catch(e){}
  },
  loadQueue() {
    try {
      const saved = JSON.parse(localStorage.getItem('maidan_notifs') || '[]');
      this.queue = saved;
      this.unreadCount = saved.filter(n => !n.read).length;
      this.render();
      this.updateBadge();
    } catch(e){ this.queue = []; }
  },

  // ===== POLLING (simulates real-time) =====
  startPolling() {
    // Check for new challenge acceptances, win approvals, etc.
    setInterval(() => this.checkUpdates(), 15000); // every 15s
  },

  checkUpdates() {
    if (!MAIDAN.isLoggedIn || !MAIDAN.currentUser) return;

    const prevBalance = this._lastBalance || 0;
    const currentBalance = MAIDAN.currentUser.balance;
    if (currentBalance > prevBalance && this._lastBalance !== undefined) {
      const diff = currentBalance - prevBalance;
      this.add('💰', 'Balance Updated', '+' + diff + ' Maidan Points added to your wallet!', 'success');
    }
    this._lastBalance = currentBalance;

    // Reload user data from storage
    const freshUser = MAIDAN.load('user');
    if (freshUser && freshUser.id === MAIDAN.currentUser.id) {
      const oldBalance = MAIDAN.currentUser.balance;
      MAIDAN.currentUser = freshUser;
      MAIDAN.updateWalletDisplay();
      if (freshUser.balance !== oldBalance) {
        document.getElementById('qs-earned') && setText('qs-earned', '₹' + (freshUser.stats?.earned || 0));
      }
    }
  },

  listenStorageEvents() {
    // Listen for changes from admin panel (same browser)
    window.addEventListener('storage', e => {
      if (e.key === 'maidan_user' && MAIDAN.isLoggedIn) {
        const updated = JSON.parse(e.newValue || '{}');
        if (updated && updated.id === MAIDAN.currentUser?.id) {
          const oldBal = MAIDAN.currentUser.balance;
          MAIDAN.currentUser = updated;
          MAIDAN.updateWalletDisplay();
          if (updated.balance > oldBal) {
            const diff = updated.balance - oldBal;
            this.add('💰', 'Deposit Approved!', diff + ' Maidan Points added to your wallet by admin.', 'success');
          }
          if (updated.status === 'banned') {
            this.add('🚫', 'Account Banned', 'Your account has been banned. Contact support.', 'error');
            setTimeout(() => { MAIDAN.isLoggedIn = false; MAIDAN.currentUser = null; showPage('landing'); }, 3000);
          }
        }
      }
    });
  },

  timeAgo(ts) {
    const d = Date.now() - ts;
    const m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    if (h < 24) return h + 'h ago';
    return dy + 'd ago';
  }
};

// Auto-init after MAIDAN is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => MaidanNotifs.init(), 500);
});
