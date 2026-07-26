/**
 * 10 MASTERS - Game Core Engine (with Firebase Auth & Firestore DB)
 */
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  isFirebaseAvailable
} from './firebase-config.js';

// Global Game State
const state = {
  user: null, // Firebase Auth User
  username: localStorage.getItem('make10_username') || '연금술사' + Math.floor(Math.random() * 899 + 100),
  gold: parseInt(localStorage.getItem('make10_gold')) || 100,
  clears: parseInt(localStorage.getItem('make10_clears')) || 0,
  bossBestTime: parseFloat(localStorage.getItem('make10_bossBestTime')) || 999.0,
  soundEnabled: localStorage.getItem('make10_sound') !== 'false',
  
  // Game Arena State
  currentGame: null, 
  timer: 0,
  score: 0,
  goldEarned: 0,
  combo: 0,
  maxCombo: 0,
  timerId: null,
  
  // Boss Battle State
  bossHp: 10,
  bossQIndex: 0,
  bossStartTime: 0,
  bossElapsedTime: 0,
  bossTimerId: null
};

// Web Audio API Synth Engine
const AudioSynth = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playTone(freq, type, duration, vol = 0.1) {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e){}
  },
  playPop() { this.playTone(523.25, 'sine', 0.1, 0.15); },
  playCorrect() {
    if (!state.soundEnabled) return;
    this.playTone(587.33, 'triangle', 0.08, 0.15);
    setTimeout(() => this.playTone(880, 'triangle', 0.15, 0.15), 80);
  },
  playWrong() {
    if (!state.soundEnabled) return;
    this.playTone(200, 'sawtooth', 0.2, 0.15);
  },
  playVictory() {
    if (!state.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.2, 0.2), i * 100);
    });
  },
  playBossHit() {
    if (!state.soundEnabled) return;
    this.playTone(150, 'square', 0.12, 0.2);
  }
};

// Initial Demo Leaderboards Fallback
const initialLeaderboards = {
  gold: [
    { name: '수학마왕_김십', score: 2450, date: '2026-07-20' },
    { name: '숫자연금술사', score: 1890, date: '2026-07-21' },
    { name: '빛의마스터', score: 1540, date: '2026-07-22' },
    { name: '스피드퀸_은지', score: 1200, date: '2026-07-23' },
    { name: '10만들기장인', score: 980, date: '2026-07-24' },
    { name: '초속10미터', score: 850, date: '2026-07-25' },
    { name: '암산천재철수', score: 720, date: '2026-07-25' },
    { name: '파이팅짱', score: 600, date: '2026-07-26' },
    { name: '숫자왕민우', score: 450, date: '2026-07-26' },
    { name: '새내기연금술사', score: 300, date: '2026-07-26' }
  ],
  clears: [
    { name: '10만들기장인', score: 42, date: '2026-07-22' },
    { name: '수학마왕_김십', score: 38, date: '2026-07-20' },
    { name: '스피드퀸_은지', score: 29, date: '2026-07-23' },
    { name: '숫자연금술사', score: 25, date: '2026-07-21' },
    { name: '빛의마스터', score: 19, date: '2026-07-22' },
    { name: '초속10미터', score: 15, date: '2026-07-25' },
    { name: '암산천재철수', score: 12, date: '2026-07-25' },
    { name: '숫자왕민우', score: 9, date: '2026-07-26' },
    { name: '파이팅짱', score: 7, date: '2026-07-26' },
    { name: '새내기연금술사', score: 5, date: '2026-07-26' }
  ],
  boss: [
    { name: '스피드퀸_은지', timeSec: 6.42, date: '2026-07-23' },
    { name: '수학마왕_김십', timeSec: 7.85, date: '2026-07-20' },
    { name: '숫자연금술사', timeSec: 9.14, date: '2026-07-21' },
    { name: '암산천재철수', timeSec: 10.30, date: '2026-07-25' },
    { name: '빛의마스터', timeSec: 11.55, date: '2026-07-22' },
    { name: '10만들기장인', timeSec: 13.10, date: '2026-07-22' },
    { name: '초속10미터', timeSec: 14.80, date: '2026-07-25' },
    { name: '파이팅짱', timeSec: 16.20, date: '2026-07-26' },
    { name: '숫자왕민우', timeSec: 18.50, date: '2026-07-26' },
    { name: '새내기연금술사', timeSec: 22.10, date: '2026-07-26' }
  ]
};

function getLocalLeaderboards() {
  const data = localStorage.getItem('make10_leaderboards');
  return data ? JSON.parse(data) : initialLeaderboards;
}

function saveLocalLeaderboards(lbData) {
  localStorage.setItem('make10_leaderboards', JSON.stringify(lbData));
}

// DOM References
const elements = {
  displayUsername: document.getElementById('displayUsername'),
  userAvatar: document.getElementById('userAvatar'),
  userLoginType: document.getElementById('userLoginType'),
  userGold: document.getElementById('userGold'),
  userClears: document.getElementById('userClears'),
  userProfileBtn: document.getElementById('userProfileBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  authModalBtn: document.getElementById('authModalBtn'),
  hallOfFameBtn: document.getElementById('hallOfFameBtn'),

  // Views
  mainDashboard: document.getElementById('mainDashboard'),
  gameArenaScreen: document.getElementById('gameArenaScreen'),
  bossArenaScreen: document.getElementById('bossArenaScreen'),

  // Arena
  arenaGameTitle: document.getElementById('arenaGameTitle'),
  arenaTimer: document.getElementById('arenaTimer'),
  arenaScore: document.getElementById('arenaScore'),
  arenaGoldEarned: document.getElementById('arenaGoldEarned'),
  gamePlayArea: document.getElementById('gamePlayArea'),
  comboContainer: document.getElementById('comboContainer'),
  comboText: document.getElementById('comboText'),
  exitGameBtn: document.getElementById('exitGameBtn'),

  // Boss
  startBossBtn: document.getElementById('startBossBtn'),
  exitBossBtn: document.getElementById('exitBossBtn'),
  bossTimeMs: document.getElementById('bossTimeMs'),
  bossHpFill: document.getElementById('bossHpFill'),
  bossHpText: document.getElementById('bossHpText'),
  bossSprite: document.getElementById('bossSprite'),
  bossSpeech: document.getElementById('bossSpeech'),
  bossQIndex: document.getElementById('bossQIndex'),
  bossFormula: document.getElementById('bossFormula'),
  bossOptions: document.getElementById('bossOptions'),

  // Modals
  resultModal: document.getElementById('resultModal'),
  resultEmoji: document.getElementById('resultEmoji'),
  resultTitle: document.getElementById('resultTitle'),
  resultSubtitle: document.getElementById('resultSubtitle'),
  resGold: document.getElementById('resGold'),
  resScore: document.getElementById('resScore'),
  resCombo: document.getElementById('resCombo'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),

  hallOfFameModal: document.getElementById('hallOfFameModal'),
  closeHofBtn: document.getElementById('closeHofBtn'),
  hofTableBody: document.getElementById('hofTableBody'),
  hofHeaderMetric: document.getElementById('hofHeaderMetric'),

  authModal: document.getElementById('authModal'),
  closeAuthBtn: document.getElementById('closeAuthBtn'),
  googleSignInBtn: document.getElementById('googleSignInBtn'),
  anonSignInBtn: document.getElementById('anonSignInBtn'),
  signOutBtn: document.getElementById('signOutBtn'),
  nicknameInput: document.getElementById('nicknameInput'),
  saveProfileBtn: document.getElementById('saveProfileBtn')
};

// INITIALIZATION
function initApp() {
  updateUIStats();
  bindEvents();
  initFirebase();
}

function updateUIStats() {
  elements.displayUsername.textContent = state.username;
  elements.userGold.textContent = state.gold;
  elements.userClears.textContent = state.clears;
  elements.soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';

  if (state.user) {
    if (state.user.isAnonymous) {
      elements.userLoginType.textContent = '익명 게스트';
      elements.userAvatar.innerHTML = '👻';
    } else {
      elements.userLoginType.textContent = 'Google 계정';
      if (state.user.photoURL) {
        elements.userAvatar.innerHTML = `<img src="${state.user.photoURL}" alt="avatar">`;
      } else {
        elements.userAvatar.innerHTML = '🧙‍♂️';
      }
    }
  } else {
    elements.userLoginType.textContent = '오프라인';
    elements.userAvatar.innerHTML = '🧙‍♂️';
  }
}

// FIREBASE AUTH & FIRESTORE INTEGRATION
function initFirebase() {
  if (!isFirebaseAvailable || !auth) return;

  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    if (user) {
      console.log("Logged in user:", user.uid);
      if (user.displayName && !localStorage.getItem('make10_custom_name')) {
        state.username = user.displayName;
      }
      elements.signOutBtn.classList.remove('hidden');
      elements.authModalBtn.textContent = '👤 프로필';

      // Sync from Firestore
      await syncUserDataFromFirestore(user.uid);
    } else {
      console.log("No user logged in.");
      state.user = null;
      elements.signOutBtn.classList.add('hidden');
      elements.authModalBtn.textContent = '🔑 로그인';
    }
    updateUIStats();
  });
}

async function syncUserDataFromFirestore(uid) {
  if (!isFirebaseAvailable || !db) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      state.gold = Math.max(state.gold, data.gold || 0);
      state.clears = Math.max(state.clears, data.clears || 0);
      if (data.username) state.username = data.username;
      if (data.bossBestTime) state.bossBestTime = Math.min(state.bossBestTime, data.bossBestTime);
      saveLocalData();
    } else {
      // Create new user doc
      await syncUserDataToFirestore();
    }
  } catch (err) {
    console.error("Firestore sync error:", err);
  }
}

async function syncUserDataToFirestore() {
  saveLocalData();
  if (!isFirebaseAvailable || !db || !state.user) return;
  try {
    const userRef = doc(db, 'users', state.user.uid);
    await setDoc(userRef, {
      uid: state.user.uid,
      username: state.username,
      gold: state.gold,
      clears: state.clears,
      bossBestTime: state.bossBestTime,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Firestore save error:", err);
  }
}

function saveLocalData() {
  localStorage.setItem('make10_username', state.username);
  localStorage.setItem('make10_gold', state.gold);
  localStorage.setItem('make10_clears', state.clears);
  localStorage.setItem('make10_bossBestTime', state.bossBestTime);
  localStorage.setItem('make10_sound', state.soundEnabled);
  updateUIStats();
}

// BIND EVENT LISTENERS
function bindEvents() {
  elements.soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    saveLocalData();
  });

  elements.userProfileBtn.addEventListener('click', () => {
    elements.nicknameInput.value = state.username;
    elements.authModal.classList.remove('hidden');
  });

  elements.authModalBtn.addEventListener('click', () => {
    elements.nicknameInput.value = state.username;
    elements.authModal.classList.remove('hidden');
  });

  elements.closeAuthBtn.addEventListener('click', () => {
    elements.authModal.classList.add('hidden');
  });

  // Google Login
  elements.googleSignInBtn.addEventListener('click', async () => {
    if (!isFirebaseAvailable) {
      alert("⚠️ Firebase 설정이 아직 완료되지 않았습니다! (demo-config 모드)");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      elements.authModal.classList.add('hidden');
    } catch (err) {
      alert("Google 로그인 처리 중 오류 발생: " + err.message);
    }
  });

  // Anonymous Guest Login
  elements.anonSignInBtn.addEventListener('click', async () => {
    if (!isFirebaseAvailable) {
      alert("게스트 모드로 진행합니다.");
      elements.authModal.classList.add('hidden');
      return;
    }
    try {
      await signInAnonymously(auth);
      elements.authModal.classList.add('hidden');
    } catch (err) {
      alert("익명 로그인 처리 중 오류: " + err.message);
    }
  });

  // Sign Out
  elements.signOutBtn.addEventListener('click', async () => {
    if (!isFirebaseAvailable || !auth) return;
    await signOut(auth);
    alert("로그아웃 되었습니다.");
    elements.authModal.classList.add('hidden');
  });

  // Save Profile Nickname
  elements.saveProfileBtn.addEventListener('click', () => {
    const val = elements.nicknameInput.value.trim();
    if (val) {
      state.username = val;
      localStorage.setItem('make10_custom_name', 'true');
      syncUserDataToFirestore();
    }
    elements.authModal.classList.add('hidden');
  });

  // Start Mini Games
  document.querySelectorAll('.start-game-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      startMiniGame(e.target.getAttribute('data-game'));
    });
  });

  elements.exitGameBtn.addEventListener('click', () => {
    clearInterval(state.timerId);
    showScreen(elements.mainDashboard);
  });

  // Start Boss Challenge
  elements.startBossBtn.addEventListener('click', () => {
    if (state.gold < 100) {
      alert('도전하려면 🪙 100 Gold가 필요합니다! 미니게임을 플레이해서 골드를 모으세요.');
      return;
    }
    state.gold -= 100;
    syncUserDataToFirestore();
    startBossBattle();
  });

  elements.exitBossBtn.addEventListener('click', () => {
    clearInterval(state.bossTimerId);
    showScreen(elements.mainDashboard);
  });

  elements.modalConfirmBtn.addEventListener('click', () => {
    elements.resultModal.classList.add('hidden');
    showScreen(elements.mainDashboard);
  });

  elements.hallOfFameBtn.addEventListener('click', () => {
    openHallOfFame('gold');
  });

  elements.closeHofBtn.addEventListener('click', () => {
    elements.hallOfFameModal.classList.add('hidden');
  });

  document.querySelectorAll('.hof-tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.hof-tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderHofList(e.target.getAttribute('data-tab'));
    });
  });
}

function showScreen(screenEl) {
  document.querySelectorAll('.view-screen').forEach(s => s.classList.remove('active'));
  screenEl.classList.add('active');
}

function showCombo(comboNum) {
  state.combo = comboNum;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  if (comboNum >= 2) {
    elements.comboText.textContent = `${comboNum} COMBO! 🔥`;
    elements.comboContainer.classList.remove('hidden');
  }
}

function resetCombo() {
  state.combo = 0;
  elements.comboContainer.classList.add('hidden');
}

// ==========================================
// MINI GAME 1: PAIR POP (25 Seconds)
// ==========================================
let pairPopSelected = [];

function startMiniGame(type) {
  state.currentGame = type;
  state.score = 0;
  state.goldEarned = 0;
  state.combo = 0;
  state.maxCombo = 0;
  elements.arenaScore.textContent = '0';
  elements.arenaGoldEarned.textContent = '0';
  resetCombo();

  if (type === 'pairPop') {
    elements.arenaGameTitle.textContent = '🎈 짝꿍 팝!';
    state.timer = 25;
    initPairPopStage();
  } else if (type === 'makeCombo') {
    elements.arenaGameTitle.textContent = '🧱 10 블록 퍼즐';
    state.timer = 30;
    initMakeComboStage();
  } else if (type === 'targetDash') {
    elements.arenaGameTitle.textContent = '⚡ 짝꿍 스피드 퀴즈';
    state.timer = 20;
    initTargetDashStage();
  }

  elements.arenaTimer.textContent = state.timer;
  showScreen(elements.gameArenaScreen);

  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timer--;
    elements.arenaTimer.textContent = state.timer;
    if (state.timer <= 0) {
      clearInterval(state.timerId);
      endMiniGame();
    }
  }, 1000);
}

function initPairPopStage() {
  pairPopSelected = [];
  elements.gamePlayArea.innerHTML = '<div id="popField" class="pop-bubbles-field"></div>';
  spawnBubbles(document.getElementById('popField'), 8);
}

function spawnBubbles(container, count) {
  container.innerHTML = '';
  const numbers = [];
  const pairsNeeded = Math.floor(count / 2);
  for (let i = 0; i < pairsNeeded; i++) {
    const num1 = Math.floor(Math.random() * 9) + 1;
    numbers.push(num1, 10 - num1);
  }
  numbers.sort(() => Math.random() - 0.5);

  const rect = container.getBoundingClientRect();
  const width = rect.width || 480;
  const height = rect.height || 360;

  numbers.forEach((val) => {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = val;
    bubble.dataset.val = val;

    const posX = Math.random() * (width - 80) + 10;
    const posY = Math.random() * (height - 80) + 10;
    bubble.style.left = `${posX}px`;
    bubble.style.top = `${posY}px`;
    bubble.style.animationDelay = `${Math.random() * 2}s`;

    bubble.addEventListener('click', (e) => onBubbleClick(e.target, container));
    container.appendChild(bubble);
  });
}

function onBubbleClick(bubbleEl, container) {
  if (bubbleEl.classList.contains('selected') || bubbleEl.classList.contains('matched')) return;

  AudioSynth.playPop();
  bubbleEl.classList.add('selected');
  pairPopSelected.push(bubbleEl);

  if (pairPopSelected.length === 2) {
    const [b1, b2] = pairPopSelected;
    const sum = parseInt(b1.dataset.val) + parseInt(b2.dataset.val);

    if (sum === 10) {
      AudioSynth.playCorrect();
      b1.classList.add('matched');
      b2.classList.add('matched');
      pairPopSelected = [];

      state.combo++;
      showCombo(state.combo);
      
      const pts = 100 + (state.combo * 20);
      const gold = 5 + Math.floor(state.combo * 1.5);
      state.score += pts;
      state.goldEarned += gold;
      elements.arenaScore.textContent = state.score;
      elements.arenaGoldEarned.textContent = state.goldEarned;

      setTimeout(() => {
        b1.remove();
        b2.remove();
        if (container.children.length <= 2) {
          spawnBubbles(container, 8);
        }
      }, 250);

    } else {
      AudioSynth.playWrong();
      resetCombo();
      setTimeout(() => {
        b1.classList.remove('selected');
        b2.classList.remove('selected');
        pairPopSelected = [];
      }, 300);
    }
  }
}

// ==========================================
// MINI GAME 2: MAKE 10 COMBO (30 Seconds)
// ==========================================
let comboSelectedBlocks = [];

function initMakeComboStage() {
  comboSelectedBlocks = [];
  elements.gamePlayArea.innerHTML = `
    <div class="combo-game-field">
      <div class="sum-tracker-box">선택한 합: <span id="currentSum" class="sum-value">0</span> / 10</div>
      <div id="blocksGrid" class="blocks-grid"></div>
    </div>
  `;
  generateBlockGrid();
}

function generateBlockGrid() {
  const grid = document.getElementById('blocksGrid');
  if (!grid) return;
  grid.innerHTML = '';
  comboSelectedBlocks = [];

  for (let i = 0; i < 16; i++) {
    const block = document.createElement('div');
    block.className = 'num-block';
    const val = Math.floor(Math.random() * 8) + 1;
    block.textContent = val;
    block.dataset.val = val;
    block.addEventListener('click', () => onBlockClick(block));
    grid.appendChild(block);
  }
}

function onBlockClick(block) {
  if (block.classList.contains('selected')) {
    block.classList.remove('selected');
    comboSelectedBlocks = comboSelectedBlocks.filter(b => b !== block);
  } else {
    block.classList.add('selected');
    comboSelectedBlocks.push(block);
    AudioSynth.playPop();
  }

  const currentSum = comboSelectedBlocks.reduce((acc, b) => acc + parseInt(b.dataset.val), 0);
  const sumEl = document.getElementById('currentSum');
  if (sumEl) sumEl.textContent = currentSum;

  if (currentSum === 10) {
    AudioSynth.playCorrect();
    state.combo++;
    showCombo(state.combo);

    const blockBonus = comboSelectedBlocks.length >= 3 ? 1.5 : 1.0;
    const pts = Math.floor((150 * blockBonus) + (state.combo * 25));
    const gold = Math.floor((8 * blockBonus) + state.combo);
    state.score += pts;
    state.goldEarned += gold;
    elements.arenaScore.textContent = state.score;
    elements.arenaGoldEarned.textContent = state.goldEarned;

    comboSelectedBlocks.forEach(b => {
      b.classList.remove('selected');
      const newVal = Math.floor(Math.random() * 8) + 1;
      b.textContent = newVal;
      b.dataset.val = newVal;
    });
    comboSelectedBlocks = [];
    if (sumEl) sumEl.textContent = 0;

  } else if (currentSum > 10) {
    AudioSynth.playWrong();
    resetCombo();
    comboSelectedBlocks.forEach(b => b.classList.remove('selected'));
    comboSelectedBlocks = [];
    if (sumEl) sumEl.textContent = 0;
  }
}

// ==========================================
// MINI GAME 3: TARGET 10 DASH (20 Seconds)
// ==========================================
let currentDashAnswer = 0;

function initTargetDashStage() {
  elements.gamePlayArea.innerHTML = `
    <div class="dash-quiz-field">
      <div class="quiz-question-card">
        <div id="dashFormula" class="quiz-formula">7 + ? = 10</div>
      </div>
      <div id="dashOptions" class="quiz-options-grid"></div>
    </div>
  `;
  nextTargetDashQuestion();
}

function nextTargetDashQuestion() {
  const formulaEl = document.getElementById('dashFormula');
  const optsEl = document.getElementById('dashOptions');
  if (!formulaEl || !optsEl) return;

  optsEl.innerHTML = '';
  const type = Math.floor(Math.random() * 3);
  let formulaText = '';
  let ans = 0;

  if (type === 0) {
    const a = Math.floor(Math.random() * 9) + 1;
    ans = 10 - a;
    formulaText = `${a} + <span class="blank-box">?</span> = 10`;
  } else if (type === 1) {
    const a = Math.floor(Math.random() * 9) + 1;
    ans = 10 - a;
    formulaText = `10 - ${a} = <span class="blank-box">?</span>`;
  } else {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * (9 - a)) + 1;
    ans = 10 - (a + b);
    formulaText = `${a} + ${b} + <span class="blank-box">?</span> = 10`;
  }

  currentDashAnswer = ans;
  formulaEl.innerHTML = formulaText;

  const choices = [ans];
  while (choices.length < 4) {
    const wrong = Math.floor(Math.random() * 10);
    if (!choices.includes(wrong)) choices.push(wrong);
  }
  choices.sort(() => Math.random() - 0.5);

  choices.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.textContent = val;
    btn.addEventListener('click', () => {
      if (val === currentDashAnswer) {
        AudioSynth.playCorrect();
        state.combo++;
        showCombo(state.combo);
        state.score += 120 + (state.combo * 15);
        state.goldEarned += 6 + state.combo;
        elements.arenaScore.textContent = state.score;
        elements.arenaGoldEarned.textContent = state.goldEarned;
        nextTargetDashQuestion();
      } else {
        AudioSynth.playWrong();
        resetCombo();
        nextTargetDashQuestion();
      }
    });
    optsEl.appendChild(btn);
  });
}

function endMiniGame() {
  AudioSynth.playVictory();
  state.gold += state.goldEarned;
  state.clears += 1;
  syncUserDataToFirestore();
  updateLocalLeaderboardOnGameEnd();

  elements.resultEmoji.textContent = '🎉';
  elements.resultTitle.textContent = '미니게임 완료!';
  elements.resultSubtitle.textContent = '훌륭한 연금술 실력이군요! 모은 골드로 수호자 도전에 나서세요.';
  elements.resGold.textContent = `+${state.goldEarned}`;
  elements.resScore.textContent = `${state.score} pt`;
  elements.resCombo.textContent = `${state.maxCombo} COMBO`;

  elements.resultModal.classList.remove('hidden');
}

// ==========================================
// GUARDIAN BOSS BATTLE
// ==========================================
function startBossBattle() {
  state.currentGame = 'boss';
  state.bossHp = 10;
  state.bossQIndex = 0;
  state.bossStartTime = Date.now();
  state.bossElapsedTime = 0;
  
  elements.bossHpFill.style.width = '100%';
  elements.bossHpText.textContent = '10';
  elements.bossSprite.textContent = '🛡️👾';
  elements.bossSprite.classList.remove('hit');
  elements.bossSpeech.textContent = '"10을 만드는 너의 연금술 실력을 증명해봐라!"';

  showScreen(elements.bossArenaScreen);

  clearInterval(state.bossTimerId);
  state.bossTimerId = setInterval(() => {
    state.bossElapsedTime = (Date.now() - state.bossStartTime) / 1000;
    elements.bossTimeMs.textContent = state.bossElapsedTime.toFixed(2);
  }, 30);

  nextBossQuestion();
}

function nextBossQuestion() {
  if (state.bossQIndex >= 10) {
    endBossBattle(true);
    return;
  }

  state.bossQIndex++;
  elements.bossQIndex.textContent = state.bossQIndex;

  const qTypes = [
    () => {
      const a = Math.floor(Math.random() * 9) + 1;
      return { text: `${a} + <span class="blank-box">?</span> = 10`, ans: 10 - a };
    },
    () => {
      const a = Math.floor(Math.random() * 9) + 1;
      return { text: `10 - ${a} = <span class="blank-box">?</span>`, ans: 10 - a };
    },
    () => {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * (9 - a)) + 1;
      return { text: `${a} + ${b} + <span class="blank-box">?</span> = 10`, ans: 10 - (a + b) };
    }
  ];

  const qObj = qTypes[Math.floor(Math.random() * qTypes.length)]();
  elements.bossFormula.innerHTML = qObj.text;

  elements.bossOptions.innerHTML = '';
  const choices = [qObj.ans];
  while (choices.length < 4) {
    const w = Math.floor(Math.random() * 10);
    if (!choices.includes(w)) choices.push(w);
  }
  choices.sort(() => Math.random() - 0.5);

  choices.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'boss-opt-btn';
    btn.textContent = val;
    btn.addEventListener('click', () => {
      if (val === qObj.ans) {
        AudioSynth.playBossHit();
        state.bossHp--;
        const hpPercent = (state.bossHp / 10) * 100;
        elements.bossHpFill.style.width = `${hpPercent}%`;
        elements.bossHpText.textContent = state.bossHp;
        
        elements.bossSprite.classList.add('hit');
        setTimeout(() => elements.bossSprite.classList.remove('hit'), 300);
        elements.bossSpeech.textContent = state.bossHp > 5 ? '"크윽... 제법이구나!"' : '"이럴수가! 수호의 결계가 무너진다!"';

        nextBossQuestion();
      } else {
        AudioSynth.playWrong();
        state.bossStartTime -= 2000;
        elements.bossSpeech.textContent = '"틀렸다! 2초 페널티를 받는다!"';
      }
    });
    elements.bossOptions.appendChild(btn);
  });
}

function endBossBattle(isSuccess) {
  clearInterval(state.bossTimerId);
  const finalTime = state.bossElapsedTime.toFixed(2);

  if (isSuccess) {
    AudioSynth.playVictory();
    const rewardGold = 350;
    state.gold += rewardGold;
    state.clears += 1;
    if (parseFloat(finalTime) < state.bossBestTime) {
      state.bossBestTime = parseFloat(finalTime);
    }
    syncUserDataToFirestore();
    registerLocalBossRecord(parseFloat(finalTime));

    elements.resultEmoji.textContent = '👑';
    elements.resultTitle.textContent = '10의 수호자 격파 성공!';
    elements.resultSubtitle.textContent = `축하합니다! 10관문을 ${finalTime}초 만에 완벽하게 돌파하셨습니다!`;
    elements.resGold.textContent = `+${rewardGold}`;
    elements.resScore.textContent = `${finalTime}s`;
    elements.resCombo.textContent = 'PERFECT';
  } else {
    elements.resultEmoji.textContent = '💀';
    elements.resultTitle.textContent = '도전 실패...';
    elements.resultSubtitle.textContent = '다음번에 다시 실력을 닦아 도전해보세요!';
    elements.resGold.textContent = `+0`;
    elements.resScore.textContent = `-`;
    elements.resCombo.textContent = `-`;
  }

  elements.resultModal.classList.remove('hidden');
}

// LEADERBOARDS & HOF
function updateLocalLeaderboardOnGameEnd() {
  const lbData = getLocalLeaderboards();
  const today = new Date().toISOString().split('T')[0];

  let userGoldEntry = lbData.gold.find(item => item.name === state.username);
  if (userGoldEntry) {
    if (state.gold > userGoldEntry.score) userGoldEntry.score = state.gold;
  } else {
    lbData.gold.push({ name: state.username, score: state.gold, date: today });
  }
  lbData.gold.sort((a, b) => b.score - a.score);
  lbData.gold = lbData.gold.slice(0, 10);

  let userClearEntry = lbData.clears.find(item => item.name === state.username);
  if (userClearEntry) {
    if (state.clears > userClearEntry.score) userClearEntry.score = state.clears;
  } else {
    lbData.clears.push({ name: state.username, score: state.clears, date: today });
  }
  lbData.clears.sort((a, b) => b.score - a.score);
  lbData.clears = lbData.clears.slice(0, 10);

  saveLocalLeaderboards(lbData);
}

function registerLocalBossRecord(timeSec) {
  const lbData = getLocalLeaderboards();
  const today = new Date().toISOString().split('T')[0];

  let userBossEntry = lbData.boss.find(item => item.name === state.username);
  if (userBossEntry) {
    if (timeSec < userBossEntry.timeSec) userBossEntry.timeSec = timeSec;
  } else {
    lbData.boss.push({ name: state.username, timeSec: timeSec, date: today });
  }
  lbData.boss.sort((a, b) => a.timeSec - b.timeSec);
  lbData.boss = lbData.boss.slice(0, 10);

  saveLocalLeaderboards(lbData);
}

async function openHallOfFame(defaultTab = 'gold') {
  updateLocalLeaderboardOnGameEnd();
  document.querySelectorAll('.hof-tab-btn').forEach(t => {
    if (t.getAttribute('data-tab') === defaultTab) t.classList.add('active');
    else t.classList.remove('active');
  });
  await renderHofList(defaultTab);
  elements.hallOfFameModal.classList.remove('hidden');
}

async function renderHofList(tabType) {
  const tbody = elements.hofTableBody;
  tbody.innerHTML = '';

  let list = [];

  // Try Firestore global leaderboard if available
  if (isFirebaseAvailable && db) {
    try {
      const usersRef = collection(db, 'users');
      let q;
      if (tabType === 'gold') q = query(usersRef, orderBy('gold', 'desc'), limit(10));
      else if (tabType === 'clears') q = query(usersRef, orderBy('clears', 'desc'), limit(10));
      else if (tabType === 'boss') q = query(usersRef, orderBy('bossBestTime', 'asc'), limit(10));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (tabType === 'gold' && d.gold) list.push({ name: d.username, score: d.gold, date: 'Cloud' });
        else if (tabType === 'clears' && d.clears) list.push({ name: d.username, score: d.clears, date: 'Cloud' });
        else if (tabType === 'boss' && d.bossBestTime && d.bossBestTime < 900) list.push({ name: d.username, timeSec: d.bossBestTime, date: 'Cloud' });
      });
    } catch (err) {
      console.warn("Firestore HOF query fallback to Local:", err);
    }
  }

  // Fallback to local if Cloud data empty
  if (list.length === 0) {
    const lbData = getLocalLeaderboards();
    if (tabType === 'gold') list = lbData.gold;
    else if (tabType === 'clears') list = lbData.clears;
    else if (tabType === 'boss') list = lbData.boss;
  }

  if (tabType === 'gold') elements.hofHeaderMetric.textContent = '보유 골드';
  else if (tabType === 'clears') elements.hofHeaderMetric.textContent = '미니게임 클리어 수';
  else if (tabType === 'boss') elements.hofHeaderMetric.textContent = '수호자 격파 시간';

  list.forEach((item, index) => {
    const tr = document.createElement('tr');
    if (item.name === state.username) tr.className = 'user-row';

    let rankDisplay = index + 1;
    if (index === 0) rankDisplay = '🥇 1';
    else if (index === 1) rankDisplay = '🥈 2';
    else if (index === 2) rankDisplay = '🥉 3';

    let valDisplay = '';
    if (tabType === 'gold') valDisplay = `🪙 ${item.score.toLocaleString()} Gold`;
    else if (tabType === 'clears') valDisplay = `⭐ ${item.score} 회`;
    else if (tabType === 'boss') valDisplay = `⏱️ ${(item.timeSec || 0).toFixed(2)} 초`;

    tr.innerHTML = `
      <td><span class="rank-badge rank-${index+1}">${rankDisplay}</span></td>
      <td>${escapeHtml(item.name || '알 수 없음')} ${item.name === state.username ? '(나)' : ''}</td>
      <td>${valDisplay}</td>
      <td>${item.date || '2026-07-26'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

window.addEventListener('DOMContentLoaded', initApp);
