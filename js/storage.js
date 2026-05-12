/* ============================================
   MAIDAN - Storage & State Management
   ============================================ */

const MAIDAN = {
  // ===== STATE =====
  currentUser: null,
  isLoggedIn: false,
  currentPage: 'landing',
  currentDashSection: 'home',
  selectedGame: null,
  challenges: [],
  transactions: [],
  winRecords: [],
  reports: [],
  otpTimer: null,

  // ===== STORAGE HELPERS =====
  save(key, value) {
    try { localStorage.setItem('maidan_' + key, JSON.stringify(value)); } catch(e) {}
  },
  load(key) {
    try { return JSON.parse(localStorage.getItem('maidan_' + key)); } catch(e) { return null; }
  },
  remove(key) {
    try { localStorage.removeItem('maidan_' + key); } catch(e) {}
  },

  // ===== INIT =====
  init() {
    // Load session
    const savedUser = this.load('user');
    const savedChallenges = this.load('challenges');
    const savedTransactions = this.load('transactions');
    const savedWinRecords = this.load('winRecords');
    const savedReports = this.load('reports');

    if (savedUser) {
      this.currentUser = savedUser;
      this.isLoggedIn = true;
    }
    if (savedChallenges) this.challenges = savedChallenges;
    else this.challenges = this.generateSampleChallenges();

    if (savedTransactions) this.transactions = savedTransactions;
    if (savedWinRecords) this.winRecords = savedWinRecords;
    if (savedReports) this.reports = savedReports;

    this.save('challenges', this.challenges);
  },

  // ===== SAMPLE DATA =====
  generateSampleChallenges() {
    return [
      { id: 'CH001', game: 'freefire', type: '1v1', mode: 'Clash Squad', amount: 50, title: '1v1 Clash Squad | No Campers', rules: 'Fair play only. Auto end after 10 mins.', createdBy: 'DragonSlayer99', createdById: 'MAI-1042', ingame: 'DragonS99', time: Date.now() - 300000, status: 'open' },
      { id: 'CH002', game: 'pubg', type: '2v2', mode: 'TDM', amount: 100, title: 'PUBG 2v2 TDM | Pros Only', rules: 'Need squad. No emulator allowed.', createdBy: 'SnipeKing', createdById: 'MAI-2210', ingame: 'SnipeKing22', time: Date.now() - 600000, status: 'open' },
      { id: 'CH003', game: 'mlbb', type: '1v1', mode: 'Classic', amount: 75, title: 'MLBB 1v1 Classic | Any Hero', rules: 'All heroes allowed. No disconnect.', createdBy: 'BladeStorm', createdById: 'MAI-3301', ingame: 'BladeS_ML', time: Date.now() - 900000, status: 'open' },
      { id: 'CH004', game: 'cod', type: '1v1', mode: 'Multiplayer', amount: 200, title: 'COD MP 1v1 | High Stakes', rules: 'MP mode. Same weapon class.', createdBy: 'GhostReaper', createdById: 'MAI-4422', ingame: 'GhostR_COD', time: Date.now() - 1200000, status: 'open' },
      { id: 'CH005', game: 'freefire', type: 'squad', mode: 'BR', amount: 250, title: 'FF Squad BR | 4v4', rules: 'Squad of 4. Winner takes all.', createdBy: 'FireLord', createdById: 'MAI-5533', ingame: 'FireLord_FF', time: Date.now() - 1500000, status: 'open' },
      { id: 'CH006', game: 'pubg', type: '1v1', mode: 'BR', amount: 150, title: 'PUBG 1v1 BR Custom | Miramar', rules: 'Custom room BR on Miramar.', createdBy: 'SandStorm', createdById: 'MAI-6644', ingame: 'SandS_PG', time: Date.now() - 1800000, status: 'open' },
    ];
  },

  generateLeaderboard() {
    return [
      { rank: 1, name: 'DragonSlayer99', id: 'MAI-1042', wins: 142, played: 158, wr: '90%', earned: '₹28,400', avatar: '🏆' },
      { rank: 2, name: 'SnipeKing', id: 'MAI-2210', wins: 128, played: 150, wr: '85%', earned: '₹25,600', avatar: '🥈' },
      { rank: 3, name: 'BladeStorm', id: 'MAI-3301', wins: 115, played: 140, wr: '82%', earned: '₹23,000', avatar: '🥉' },
      { rank: 4, name: 'GhostReaper', id: 'MAI-4422', wins: 98, played: 125, wr: '78%', earned: '₹19,600', avatar: '🎮' },
      { rank: 5, name: 'FireLord', id: 'MAI-5533', wins: 87, played: 115, wr: '76%', earned: '₹17,400', avatar: '🔥' },
      { rank: 6, name: 'SandStorm', id: 'MAI-6644', wins: 76, played: 105, wr: '72%', earned: '₹15,200', avatar: '⚔️' },
      { rank: 7, name: 'NightHawk', id: 'MAI-7755', wins: 65, played: 92, wr: '71%', earned: '₹13,000', avatar: '🦅' },
      { rank: 8, name: 'IronFist', id: 'MAI-8866', wins: 58, played: 85, wr: '68%', earned: '₹11,600', avatar: '👊' },
      { rank: 9, name: 'ThunderBolt', id: 'MAI-9977', wins: 49, played: 75, wr: '65%', earned: '₹9,800', avatar: '⚡' },
      { rank: 10, name: 'SkyWalker', id: 'MAI-0088', wins: 42, played: 67, wr: '63%', earned: '₹8,400', avatar: '🌟' },
    ];
  },

  // ===== USER MANAGEMENT =====
  createUser(data) {
    const userId = 'MAI-' + String(Math.floor(Math.random() * 9000) + 1000);
    const user = {
      id: userId,
      name: data.name || 'Warrior',
      username: data.username || 'player_' + Date.now(),
      email: data.email || '',
      mobile: data.mobile || '',
      avatar: '🎮',
      balance: 0,
      stats: { played: 0, won: 0, lost: 0, earned: 0 },
      inGameIds: { freefire: '', pubg: '', mlbb: '', cod: '' },
      createdAt: Date.now(),
      status: 'active'
    };
    this.currentUser = user;
    this.isLoggedIn = true;
    this.save('user', user);
    this.transactions = [];
    this.save('transactions', this.transactions);
    return user;
  },

  updateUser(data) {
    if (!this.currentUser) return;
    Object.assign(this.currentUser, data);
    this.save('user', this.currentUser);
  },

  addTransaction(type, amount, label, status = 'completed', method = '') {
    const txn = {
      id: 'TXN' + Date.now(),
      type, amount, label, status, method,
      time: Date.now()
    };
    this.transactions.unshift(txn);
    this.save('transactions', this.transactions);
    return txn;
  },

  addBalance(amount) {
    if (!this.currentUser) return;
    this.currentUser.balance += amount;
    this.save('user', this.currentUser);
    this.updateWalletDisplay();
  },

  deductBalance(amount) {
    if (!this.currentUser) return false;
    if (this.currentUser.balance < amount) return false;
    this.currentUser.balance -= amount;
    this.save('user', this.currentUser);
    this.updateWalletDisplay();
    return true;
  },

  updateWalletDisplay() {
    const bal = this.currentUser ? this.currentUser.balance : 0;
    const el1 = document.getElementById('topbar-points');
    const el2 = document.getElementById('wallet-balance');
    const el3 = document.getElementById('home-points');
    if (el1) el1.textContent = bal + ' MP';
    if (el2) el2.textContent = bal;
    if (el3) el3.textContent = bal + ' MP';
  },

  // ===== CHALLENGE MANAGEMENT =====
  postChallenge(data) {
    const ch = {
      id: 'CH' + String(Date.now()).slice(-6),
      ...data,
      createdBy: this.currentUser.username,
      createdById: this.currentUser.id,
      createdByName: this.currentUser.name,
      time: Date.now(),
      status: 'open',
      acceptedBy: null
    };
    this.challenges.unshift(ch);
    this.save('challenges', this.challenges);
    return ch;
  },

  acceptChallenge(challengeId) {
    const ch = this.challenges.find(c => c.id === challengeId);
    if (!ch) return null;
    if (ch.createdById === this.currentUser.id) return null; // can't accept own
    if (this.currentUser.balance < ch.amount) return null;

    // Deduct from both (other is already deducted when posted)
    if (!this.deductBalance(ch.amount)) return null;

    ch.status = 'in_progress';
    ch.acceptedBy = this.currentUser.username;
    ch.acceptedById = this.currentUser.id;
    this.save('challenges', this.challenges);

    this.addTransaction('debit', ch.amount, 'Challenge deposit: ' + ch.title, 'completed', 'match');
    return ch;
  }
};
