// ============================================
// INITIALIZE EMAILJS
// ============================================

(function() {
  emailjs.init("WVn4FyckWoY68y1Kp");
})();

// ============================================
// FIREBASE CONFIG
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyB-IbnRdC9RwT4eZPtpgH9F1fj5OKeRw9U",
  authDomain: "unblocked-hub-chat.firebaseapp.com",
  databaseURL: "https://unblocked-hub-chat-default-rtdb.firebaseio.com",
  projectId: "unblocked-hub-chat",
  storageBucket: "unblocked-hub-chat.firebasestorage.app",
  messagingSenderId: "192995986961",
  appId: "1:192995986961:web:6ee8f3ce513ac3b744ebb0",
  measurementId: "G-QDX7PP5JXL"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

window.myName = null;
let activeChat = null, chatType = "none", myFriends = [];
let viewedUserName = null;
let previousPage = null;

// ============================================
// SETTINGS SYSTEM
// ============================================

const SETTINGS_KEY = 'nova_settings';
let preventCtrlW = false;
let keyboardShortcutsEnabled = true;
let notificationsEnabled = true;
let notificationFrequency = 'all';

// Load settings on startup
function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      
      if (settings.lightMode) {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').classList.add('active');
      }
      
      if (settings.performanceMode) {
        document.body.classList.add('performance-mode');
        document.getElementById('performance-toggle').classList.add('active');
      }
      
      if (settings.gridMode) {
        document.body.classList.add('grid-mode');
        document.getElementById('grid-toggle').classList.add('active');
      }
      
      if (settings.preventCtrlW) {
        preventCtrlW = true;
        document.getElementById('ctrlw-toggle').classList.add('active');
      }

      if (settings.keyboardShortcuts !== undefined) {
        keyboardShortcutsEnabled = settings.keyboardShortcuts;
        if (!keyboardShortcutsEnabled) {
          document.getElementById('shortcuts-toggle').classList.remove('active');
        }
      }

      if (settings.notifications !== undefined) {
        notificationsEnabled = settings.notifications;
        if (!notificationsEnabled) {
          document.getElementById('notifications-toggle').classList.remove('active');
        }
      }

      if (settings.notificationFrequency) {
        notificationFrequency = settings.notificationFrequency;
        document.getElementById('notification-frequency').value = notificationFrequency;
      }
      
      if (settings.customBackground) {
        const bgEl = document.getElementById('customBg');
        bgEl.style.backgroundImage = `url(${settings.customBackground})`;
        bgEl.classList.add('active');
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
}

function saveSettings() {
  const settings = {
    lightMode: document.body.classList.contains('light-mode'),
    performanceMode: document.body.classList.contains('performance-mode'),
    gridMode: document.body.classList.contains('grid-mode'),
    preventCtrlW: preventCtrlW,
    keyboardShortcuts: keyboardShortcutsEnabled,
    notifications: notificationsEnabled,
    notificationFrequency: notificationFrequency,
    customBackground: document.getElementById('customBg').style.backgroundImage.slice(5, -2)
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  document.getElementById('theme-toggle').classList.toggle('active');
  saveSettings();
}

function togglePerformance() {
  document.body.classList.toggle('performance-mode');
  document.getElementById('performance-toggle').classList.toggle('active');
  saveSettings();
}

function toggleGridMode() {
  document.body.classList.toggle('grid-mode');
  document.getElementById('grid-toggle').classList.toggle('active');
  saveSettings();
}

function toggleCtrlW() {
  preventCtrlW = !preventCtrlW;
  document.getElementById('ctrlw-toggle').classList.toggle('active');
  saveSettings();
}

function toggleShortcuts() {
  keyboardShortcutsEnabled = !keyboardShortcutsEnabled;
  document.getElementById('shortcuts-toggle').classList.toggle('active');
  saveSettings();
  if (keyboardShortcutsEnabled) {
    showNotification('Keyboard shortcuts enabled', 'success');
  } else {
    showNotification('Keyboard shortcuts disabled', 'warning');
  }
}

function toggleNotifications() {
  notificationsEnabled = !notificationsEnabled;
  document.getElementById('notifications-toggle').classList.toggle('active');
  saveSettings();
}

function updateNotificationFrequency() {
  notificationFrequency = document.getElementById('notification-frequency').value;
  saveSettings();
  showNotification(`Notification frequency set to ${notificationFrequency}`, 'success');
}

function uploadBackground(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const bgEl = document.getElementById('customBg');
    bgEl.style.backgroundImage = `url(${e.target.result})`;
    bgEl.classList.add('active');
    saveSettings();
    showNotification('Custom background applied!', 'success');
  };
  reader.readAsDataURL(file);
}

function resetBackground() {
  const bgEl = document.getElementById('customBg');
  bgEl.style.backgroundImage = '';
  bgEl.classList.remove('active');
  saveSettings();
  showNotification('Background reset to default!', 'success');
}

function exportSettings() {
  const settings = localStorage.getItem(SETTINGS_KEY);
  if (!settings) {
    showNotification('No settings to export!', 'warning');
    return;
  }

  const blob = new Blob([settings], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nova-settings.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification('Settings exported!', 'success');
}

function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const settings = JSON.parse(e.target.result);
      localStorage.setItem(SETTINGS_KEY, e.target.result);
      showNotification('Settings imported! Refreshing...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showNotification('Invalid settings file!', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllSettings() {
  if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
    localStorage.removeItem(SETTINGS_KEY);
    showNotification('Settings reset! Refreshing...', 'success');
    setTimeout(() => location.reload(), 1500);
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
  // Ctrl+W Prevention
  if (preventCtrlW && e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    showNotification('Closing tabs is disabled in settings!', 'warning');
    return;
  }

  if (!keyboardShortcutsEnabled) return;

  // Ctrl+K for search
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('.page-section.active .search-input');
    if (searchInput) searchInput.focus();
    return;
  }

  // Alt + Letter shortcuts
  if (e.altKey) {
    switch(e.key.toLowerCase()) {
      case 'h':
        e.preventDefault();
        showPage('home');
        break;
      case 'g':
        e.preventDefault();
        showPage('games');
        break;
      case 's':
        e.preventDefault();
        showPage('settings');
        break;
      case 'p':
        e.preventDefault();
        showPage('profile');
        break;
    }
  }
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(text, type = 'success') {
  if (!notificationsEnabled) return;
  if (notificationFrequency === 'none') return;
  if (notificationFrequency === 'important' && type !== 'error' && type !== 'warning') return;
  if (notificationFrequency === 'minimal' && type === 'success') return;

  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');
  
  notification.className = 'notification';
  notification.classList.add(type);
  notificationText.textContent = text;
  
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// ============================================
// DEVICE & SYSTEM INFO
// ============================================

function detectDevice() {
  const ua = navigator.userAgent;
  let device = 'PC';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    device = 'Phone';
  }
  
  document.getElementById('device-type').textContent = device;
}

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  document.getElementById('current-time').textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

function updateMemoryUsage() {
  if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
    document.getElementById('memory-usage').textContent = `${usedMB} MB`;
  } else {
    document.getElementById('memory-usage').textContent = 'N/A';
  }
}

detectDevice();
setInterval(updateClock, 1000);
setInterval(updateMemoryUsage, 2000);
updateClock();
updateMemoryUsage();

// ============================================
// PARTICLE SYSTEM
// ============================================

function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200;
    const duration = 15 + Math.random() * 15;
    const delay = Math.random() * 10;
    const size = 2 + Math.random() * 3;
    
    particle.style.left = startX + '%';
    particle.style.setProperty('--drift', drift + 'px');
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    const colors = [
      'rgba(91, 141, 239, 0.6)',
      'rgba(0, 255, 136, 0.6)',
      'rgba(147, 51, 234, 0.6)'
    ];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    particlesContainer.appendChild(particle);
  }
}

createParticles();

// ============================================
// FAVORITES & RECENTLY PLAYED SYSTEM
// ============================================

let favorites = [];
let recentlyPlayed = [];

function loadUserData() {
  const favData = localStorage.getItem('nova_favorites');
  const recentData = localStorage.getItem('nova_recently_played');
  
  if (favData) favorites = JSON.parse(favData);
  if (recentData) recentlyPlayed = JSON.parse(recentData);
  
  renderFavorites();
  renderRecentlyPlayed();
}

function saveFavorites() {
  localStorage.setItem('nova_favorites', JSON.stringify(favorites));
}

function saveRecentlyPlayed() {
  localStorage.setItem('nova_recently_played', JSON.stringify(recentlyPlayed));
}

function toggleFavorite(id, name, url, thumb, type) {
  const index = favorites.findIndex(f => f.id === id);
  
  if (index > -1) {
    favorites.splice(index, 1);
    showNotification(`Removed ${name} from favorites`, 'warning');
  } else {
    favorites.push({ id, name, url, thumb, type });
    showNotification(`Added ${name} to favorites!`, 'success');
    unlockBadge('first-favorite');
    if (favorites.length >= 10) unlockBadge('collector');
  }
  
  saveFavorites();
  renderFavorites();
  
  // Update the star icon
  const btn = document.querySelector(`[data-fav-id="${id}"]`);
  if (btn) {
    btn.textContent = index > -1 ? '☆' : '⭐';
    btn.classList.toggle('active', index === -1);
  }
}

function addToRecentlyPlayed(id, name, url, thumb, type) {
  // Remove if already exists
  recentlyPlayed = recentlyPlayed.filter(r => r.id !== id);
  
  // Add to beginning
  recentlyPlayed.unshift({ id, name, url, thumb, type, playedAt: Date.now() });
  
  // Keep only last 10
  if (recentlyPlayed.length > 10) {
    recentlyPlayed = recentlyPlayed.slice(0, 10);
  }
  
  saveRecentlyPlayed();
  renderRecentlyPlayed();
  unlockBadge('first-game');
}

function renderFavorites() {
  const scroller = document.getElementById('favoritesScroller');
  const empty = document.getElementById('favoritesEmpty');
  
  if (favorites.length === 0) {
    empty.style.display = 'block';
    scroller.innerHTML = '';
    return;
  }
  
  empty.style.display = 'none';
  scroller.innerHTML = '';
  
  favorites.forEach(item => {
    const div = document.createElement('div');
    div.className = item.type;
    div.innerHTML = `
      <button class="favorite-btn active" data-fav-id="${item.id}" onclick="event.stopPropagation(); toggleFavorite('${item.id}', '${item.name}', '${item.url}', '${item.thumb}', '${item.type}')">⭐</button>
      <img class="thumb" src="${item.thumb}" alt="${item.name}">
      <strong>${item.name}</strong>
      <button class="${item.type}-btn" data-url="${item.url}" data-title="${item.name}">
        ${item.type === 'game' ? 'Launch' : 'Watch'}
      </button>
    `;
    scroller.appendChild(div);
  });
}

function renderRecentlyPlayed() {
  const scroller = document.getElementById('recentlyPlayedScroller');
  const empty = document.getElementById('recentlyPlayedEmpty');
  
  if (recentlyPlayed.length === 0) {
    empty.style.display = 'block';
    scroller.innerHTML = '';
    return;
  }
  
  empty.style.display = 'none';
  scroller.innerHTML = '';
  
  recentlyPlayed.forEach(item => {
    const div = document.createElement('div');
    div.className = item.type;
    
    const isFavorite = favorites.some(f => f.id === item.id);
    
    div.innerHTML = `
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${item.id}" onclick="event.stopPropagation(); toggleFavorite('${item.id}', '${item.name}', '${item.url}', '${item.thumb}', '${item.type}')">${isFavorite ? '⭐' : '☆'}</button>
      <img class="thumb" src="${item.thumb}" alt="${item.name}">
      <strong>${item.name}</strong>
      <button class="${item.type}-btn" data-url="${item.url}" data-title="${item.name}">
        ${item.type === 'game' ? 'Launch' : 'Watch'}
      </button>
    `;
    scroller.appendChild(div);
  });
}

// ============================================
// DAILY REWARDS SYSTEM
// ============================================

function checkDailyReward() {
  const lastClaim = localStorage.getItem('last_reward_claim');
  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;
  
  if (!lastClaim || (now - parseInt(lastClaim)) >= twelveHours) {
    document.getElementById('claimRewardBtn').disabled = false;
    document.getElementById('rewardTimer').textContent = 'Available now!';
  } else {
    document.getElementById('claimRewardBtn').disabled = true;
    updateRewardTimer();
  }
}

function updateRewardTimer() {
  const lastClaim = localStorage.getItem('last_reward_claim');
  if (!lastClaim) return;
  
  const now = Date.now();
  const lastClaimTime = parseInt(lastClaim);
  const twelveHours = 12 * 60 * 60 * 1000;
  const nextClaim = lastClaimTime + twelveHours;
  const remaining = nextClaim - now;
  
  if (remaining <= 0) {
    document.getElementById('claimRewardBtn').disabled = false;
    document.getElementById('rewardTimer').textContent = 'Available now!';
    return;
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  document.getElementById('rewardTimer').textContent = 
    `Next reward in: ${hours}h ${minutes}m ${seconds}s`;
  
  setTimeout(updateRewardTimer, 1000);
}

function claimDailyReward() {
  novaCoins += 5;
  saveCoinData();
  updateCoinDisplay();
  
  localStorage.setItem('last_reward_claim', Date.now().toString());
  
  document.getElementById('rewardModal').classList.add('show');
  document.getElementById('claimRewardBtn').disabled = true;
  
  showNotification('+5 Nova Coins earned!', 'success');
  unlockBadge('daily-login');
  
  updateRewardTimer();
}

function closeRewardModal() {
  document.getElementById('rewardModal').classList.remove('show');
}

// ============================================
// ACHIEVEMENTS/BADGES SYSTEM
// ============================================

const BADGES = {
  'first-game': { name: 'First Steps', icon: '🎮', desc: 'Play your first game' },
  'first-favorite': { name: 'Favorite Found', icon: '⭐', desc: 'Add your first favorite' },
  'daily-login': { name: 'Daily Visitor', icon: '📅', desc: 'Claim a daily reward' },
  'coin-collector': { name: 'Coin Collector', icon: '🪙', desc: 'Earn 50 coins' },
  'big-spender': { name: 'Big Spender', icon: '💰', desc: 'Make a purchase' },
  'social-butterfly': { name: 'Social Butterfly', icon: '👥', desc: 'Add 5 friends' },
  'collector': { name: 'Collector', icon: '📚', desc: 'Have 10 favorites' },
  'chat-master': { name: 'Chat Master', icon: '💬', desc: 'Send 100 messages' }
};

let unlockedBadges = [];

function loadBadges() {
  const saved = localStorage.getItem('nova_badges');
  if (saved) {
    unlockedBadges = JSON.parse(saved);
  }
  renderBadges();
}

function unlockBadge(badgeId) {
  if (unlockedBadges.includes(badgeId)) return;
  
  unlockedBadges.push(badgeId);
  localStorage.setItem('nova_badges', JSON.stringify(unlockedBadges));
  
  const badge = BADGES[badgeId];
  if (badge) {
    showNotification(`🏆 Badge Unlocked: ${badge.name}!`, 'success');
  }
  
  renderBadges();
}

function renderBadges() {
  const container = document.getElementById('badgeContainer');
  container.innerHTML = '';
  
  Object.keys(BADGES).forEach(badgeId => {
    const badge = BADGES[badgeId];
    const unlocked = unlockedBadges.includes(badgeId);
    
    const div = document.createElement('div');
    div.className = `badge ${unlocked ? 'unlocked' : 'locked'}`;
    div.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    container.appendChild(div);
  });
}

// ============================================
// STATUS UPDATES
// ============================================

function updateStatus() {
  if (!window.myName) {
    showNotification('Please login first', 'warning');
    return;
  }
  
  const statusInput = document.getElementById('status-input');
  const status = statusInput.value.trim();
  
  if (!status) return;
  
  db.ref("users/" + window.myName + "/customStatus").set(status);
  statusInput.value = '';
  showNotification('Status updated!', 'success');
}

// ============================================
// NOVA COIN SYSTEM
// ============================================

let novaCoins = 0;
let purchasedGames = [];
let coinInterval = null;

function updateCoinDisplay() {
  document.getElementById('coin-count').textContent = novaCoins;
  
  if (novaCoins >= 50 && !unlockedBadges.includes('coin-collector')) {
    unlockBadge('coin-collector');
  }
}

function earnCoin() {
  if (!window.myName) return;
  
  novaCoins++;
  saveCoinData();
  updateCoinDisplay();
  showNotification('+1 Nova Coin earned!', 'success');
}

function saveCoinData() {
  if (!window.myName) return;
  db.ref("users/" + window.myName + "/coins").set(novaCoins);
  db.ref("users/" + window.myName + "/purchasedGames").set(purchasedGames);
}

function loadCoinData() {
  if (!window.myName) {
    novaCoins = 0;
    purchasedGames = [];
    updateCoinDisplay();
    return;
  }

  db.ref("users/" + window.myName + "/coins").once("value", (snap) => {
    novaCoins = snap.val() || 0;
    updateCoinDisplay();
  });

  db.ref("users/" + window.myName + "/purchasedGames").once("value", (snap) => {
    purchasedGames = snap.val() || [];
    if (document.getElementById('shop').classList.contains('active')) {
      renderShop();
    }
  });
}

function startCoinEarning() {
  if (coinInterval) clearInterval(coinInterval);
  coinInterval = setInterval(earnCoin, 300000);
}

function stopCoinEarning() {
  if (coinInterval) {
    clearInterval(coinInterval);
    coinInterval = null;
  }
}

updateCoinDisplay();

// ============================================
// SHOP DATA
// ============================================

const SHOP_ITEMS = [
  { 
    id: "minecraft-download", 
    name: "Minecraft", 
    price: 10, 
    thumb: "https://jeremyryanknight2012.github.io/My-Website/thumbnails/minecraft.png",
    downloadFile: "minecraft.html"
  },
  { 
    id: "mario64-download", 
    name: "Super Mario 64", 
    price: 10, 
    thumb: "https://jeremyryanknight2012.github.io/My-Website/thumbnails/supermario64.png",
    downloadFile: "mario64.html"
  },
  { 
    id: "balatro-download", 
    name: "Balatro", 
    price: 10, 
    thumb: "https://jeremyryanknight2012.github.io/My-Website/thumbnails/balatro.png",
    downloadFile: "balatro.html"
  },
  { 
    id: "tattletail-download", 
    name: "Tattletail", 
    price: 5, 
    thumb: "https://jeremyryanknight2012.github.io/My-Website/thumbnails/tattletail.png",
    downloadFile: "tattletail.html"
  }
];

function renderShop() {
  const shopScroller = document.getElementById('shopScroller');
  shopScroller.innerHTML = '';
  
  SHOP_ITEMS.forEach(item => {
    const isPurchased = purchasedGames.includes(item.id);
    const canAfford = novaCoins >= item.price;
    
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <img class="thumb" src="${item.thumb}" alt="${item.name}">
      <strong>${item.name}</strong>
      <div class="price">
        <div class="coin-icon">🪙</div>
        <span>${item.price}</span>
      </div>
      ${isPurchased 
        ? '<button class="btn" style="background:rgba(0,255,136,0.2);border-color:var(--success);">Purchased ✓</button>'
        : `<button class="buy-btn" onclick="purchaseItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Buy Now' : 'Not Enough Coins'}
          </button>`
      }
    `;
    shopScroller.appendChild(div);
  });

  renderPurchasedItems();
}

function purchaseItem(itemId) {
  if (!window.myName) {
    showNotification('Please login to make purchases!', 'warning');
    return;
  }

  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (novaCoins >= item.price) {
    novaCoins -= item.price;
    purchasedGames.push(itemId);
    saveCoinData();
    updateCoinDisplay();
    renderShop();
    
    unlockBadge('big-spender');
    showNotification(`${item.name} purchased! Downloading...`, 'success');
    
    fetch(item.downloadFile)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.downloadFile;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => {
        console.error('Download failed:', err);
        showNotification('Download failed. Make sure files are available.', 'error');
      });
  } else {
    showNotification('Not enough Nova Coins!', 'warning');
  }
}

function renderPurchasedItems() {
  const container = document.getElementById('purchasedItems');
  
  if (purchasedGames.length === 0) {
    container.innerHTML = '<p class="empty">You haven\'t purchased anything yet.</p>';
    return;
  }

  container.innerHTML = '';
  purchasedGames.forEach(gameId => {
    const item = SHOP_ITEMS.find(i => i.id === gameId);
    if (!item) return;

    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:16px;padding:16px;background:rgba(19,23,41,0.6);border:1px solid var(--border);border-radius:14px;margin-bottom:12px;';
    div.innerHTML = `
      <img src="${item.thumb}" style="width:60px;height:60px;border-radius:8px;object-fit:contain;background:rgba(0,0,0,0.3);">
      <div style="flex:1;">
        <strong style="display:block;margin-bottom:4px;">${item.name}</strong>
        <span style="color:var(--muted);font-size:13px;">Purchased</span>
      </div>
      <button class="btn" onclick="redownloadGame('${item.downloadFile}', '${item.name}')" style="white-space:nowrap;">Download Again</button>
    `;
    container.appendChild(div);
  });
}

function redownloadGame(filename, gameName) {
  fetch(filename)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(err => {
      console.error('Download failed:', err);
      showNotification('Download failed!', 'error');
    });
}

// ============================================
// NAVIGATION
// ============================================

function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  const navLink = document.querySelector(`.nav a[data-page="${pageId}"]`);
  if (navLink) navLink.classList.add('active');

  if (pageId === 'chat' && window.myName) {
    setupChat();
  } else if (pageId === 'profile') {
    loadProfile();
  } else if (pageId === 'shop') {
    renderShop();
  } else if (pageId === 'achievements') {
    checkDailyReward();
  }
}

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    window.location.hash = page;
    showPage(page);
  });
});

window.addEventListener('load', () => {
  loadSettings();
  loadUserData();
  loadBadges();
  
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    showPage(hash);
  } else {
    showPage('home');
  }
  
  const storedUsername = localStorage.getItem("nexus_user");
  if (storedUsername) {
    db.ref("users/" + storedUsername).once("value", (snap) => {
      if (snap.exists()) {
        window.myName = storedUsername;
        updateProfileDisplay();
        loadCoinData();
        startCoinEarning();
      }
    });
  }
  
  checkDailyReward();
  setInterval(checkDailyReward, 60000);
});

// ============================================
// GAMES DATA WITH CATEGORIES
// ============================================

const TOP_GAMES = [
  { id:"roblox", name:"Roblox", url:"https://jeremyryanknight2012.github.io/My-Website/games/roblox.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/roblox.png", category:"adventure" },
  { id:"1v1lol", name:"1v1.LOL", url:"https://jeremyryanknight2012.github.io/My-Website/games/1v1lol.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/1v1lol.png", category:"action" },
  { id:"retrobowl", name:"Retro Bowl", url:"https://jeremyryanknight2012.github.io/My-Website/games/retrobowl.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/retrobowl.png", category:"sports" },
  { id:"ultrakill", name:"Ultrakill", url:"https://jeremyryanknight2012.github.io/My-Website/games/ultrakill.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/ultrakill.png", category:"action" }
];

const ALL_GAMES = [
  { id:"2playerbattle", name:"2 Player Battle", url:"https://turbowarp.org/292728003/embed", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/2playerbattle.png", category:"action" },
  { id:"3dtuning", name:"3D Tuning", url:"https://www.3dtuning.com/en-US/", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/3dtuning.png", category:"puzzle" },
  { id:"10minutestilldawn", name:"10 Minutes Till Dawn", url:"https://jeremyryanknight2012.github.io/My-Website/games/10minutestilldawn.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/10minutestilldawn.png", category:"action" },
  { id:"amongus", name:"Among Us", url:"https://jeremyryanknight2012.github.io/My-Website/games/amongus.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/amongus.png", category:"puzzle" },
  { id:"armedforces", name:"Armed Forces", url:"https://jeremyryanknight2012.github.io/My-Website/games/armedforces.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/armedforces.png", category:"action" },
  { id:"badparenting", name:"Bad Parenting", url:"https://jeremyryanknight2012.github.io/My-Website/games/badparenting.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/badparenting.png", category:"horror" },
  { id:"balatro", name:"Balatro", url:"https://jeremyryanknight2012.github.io/My-Website/games/balatro.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/balatro.png", category:"puzzle" },
  { id:"bankrobbery2", name:"Bank Robbery 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/bankrobbery2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/bankrobbery2.png", category:"action" },
  { id:"baseballbros", name:"Baseball Bros", url:"https://jeremyryanknight2012.github.io/My-Website/games/baseballbros.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/baseballbros.png", category:"sports" },
  { id:"basketbros", name:"Basket Bros", url:"https://jeremyryanknight2012.github.io/My-Website/games/basketbros.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/basketbros.png", category:"sports" },
  { id:"basketrandom", name:"Basket Random", url:"https://jeremyryanknight2012.github.io/My-Website/games/basketrandom.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/basketrandom.png", category:"sports" },
  { id:"bendyandtheinkmachine", name:"Bendy and the Ink Machine", url:"https://jeremyryanknight2012.github.io/My-Website/games/bendy.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/bendy.png", category:"horror" },
  { id:"thebindingofisaac", name:"The Binding of Isaac", url:"https://jeremyryanknight2012.github.io/My-Website/games/bindingofisaac.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/bindingofisaac.png", category:"adventure" },
  { id:"bitlife", name:"Bitlife", url:"https://jeremyryanknight2012.github.io/My-Website/games/bitlife.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/bitlife.png", category:"puzzle" },
  { id:"buckshotroulette", name:"Buckshot Roulette", url:"https://jeremyryanknight2012.github.io/My-Website/games/buckshotroulette.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/buckshotroulette.png", category:"horror" },
  { id:"buildnow", name:"Build Now", url:"https://jeremyryanknight2012.github.io/My-Website/games/buildnow.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/buildnow.png", category:"action" },
  { id:"callofduty", name:"Call of Duty", url:"https://jeremyryanknight2012.github.io/My-Website/games/callofduty.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/callofduty.png", category:"action" },
  { id:"cookieclicker", name:"Cookie Clicker", url:"https://jeremyryanknight2012.github.io/My-Website/games/cookieclicker.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/cookieclicker.png", category:"puzzle" },
  { id:"coreball", name:"Coreball", url:"https://jeremyryanknight2012.github.io/My-Website/games/coreball.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/coreball.png", category:"puzzle" },
  { id:"crossyroad", name:"Crossy Road", url:"https://jeremyryanknight2012.github.io/My-Website/games/crossyroad.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/crossyroad.png", category:"adventure" },
  { id:"cuphead", name:"Cuphead", url:"https://jeremyryanknight2012.github.io/My-Website/games/cuphead.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/cuphead.png", category:"adventure" },
  { id:"cuttherope", name:"Cut the Rope", url:"https://jeremyryanknight2012.github.io/My-Website/games/cuttherope.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/cuttherope.png", category:"puzzle" },
  { id:"doodlejump", name:"Doodle Jump", url:"https://jeremyryanknight2012.github.io/My-Website/games/doodlejump.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/doodlejump.png", category:"adventure" },
  { id:"doom", name:"Doom", url:"https://jeremyryanknight2012.github.io/My-Website/games/doom.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/doom.png", category:"action" },
  { id:"doom2", name:"Doom 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/doom2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/doom2.png", category:"action" },
  { id:"drifthunters", name:"Drift Hunters", url:"https://jeremyryanknight2012.github.io/My-Website/games/drifthunters.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/drifthunters.png", category:"sports" },
  { id:"drivemad", name:"Drive Mad", url:"https://jeremyryanknight2012.github.io/My-Website/games/drivemad.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/drivemad.png", category:"adventure" },
  { id:"endoparasitic", name:"Endoparasitic", url:"https://jeremyryanknight2012.github.io/My-Website/games/endoparasitic.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/endoparasitic.png", category:"horror" },
  { id:"escaperoad", name:"Escape Road", url:"https://jeremyryanknight2012.github.io/My-Website/games/escaperoad.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/escaperoad.png", category:"action" },
  { id:"fallout", name:"Fallout", url:"https://jeremyryanknight2012.github.io/My-Website/games/fallout.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fallout.png", category:"adventure" },
  { id:"flappybird", name:"Flappy Bird", url:"https://jeremyryanknight2012.github.io/My-Website/games/flappybird.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/flappybird.png", category:"adventure" },
  { id:"fnaf1", name:"FNAF 1", url:"https://jeremyryanknight2012.github.io/My-Website/games/fnaf1.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fnaf1.png", category:"horror" },
  { id:"fnaf2", name:"FNAF 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/fnaf2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fnaf2.png", category:"horror" },
  { id:"fnaf3", name:"FNAF 3", url:"https://jeremyryanknight2012.github.io/My-Website/games/fnaf3.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fnaf3.png", category:"horror" },
  { id:"fnaf4", name:"FNAF 4", url:"https://jeremyryanknight2012.github.io/My-Website/games/fnaf4.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fnaf4.png", category:"horror" },
  { id:"fnaf4halloween", name:"FNAF 4 Halloween Edition", url:"https://jeremyryanknight2012.github.io/My-Website/games/fnaf4halloween.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fnaf4halloween.png", category:"horror" },
  { id:"footballbros", name:"Football Bros", url:"https://jeremyryanknight2012.github.io/My-Website/games/footballbros.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/footballbros.png", category:"sports" },
  { id:"fruitninja", name:"Fruit Ninja", url:"https://jeremyryanknight2012.github.io/My-Website/games/fruitninja.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/fruitninja.png", category:"action" },
  { id:"geometrydash", name:"Geometry Dash", url:"https://jeremyryanknight2012.github.io/My-Website/games/geometrydash.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/geometrydash.png", category:"adventure" },
  { id:"granny1", name:"Granny", url:"https://jeremyryanknight2012.github.io/My-Website/games/granny1.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/granny1.png", category:"horror" },
  { id:"granny2", name:"Granny Chapter 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/granny2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/granny2.png", category:"horror" },
  { id:"granny3", name:"Granny Chapter 3", url:"https://jeremyryanknight2012.github.io/My-Website/games/granny3.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/granny3.png", category:"horror" },
  { id:"halflife", name:"Half-Life", url:"https://jeremyryanknight2012.github.io/My-Website/games/halflife.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/halflife.png", category:"action" },
  { id:"hollowknight", name:"Hollow Knight", url:"https://jeremyryanknight2012.github.io/My-Website/games/hollowknight.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/hollowknight.png", category:"adventure" },
  { id:"jetpackjoyride", name:"Jetpack Joyride", url:"https://jeremyryanknight2012.github.io/My-Website/games/jetpackjoyride.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/jetpackjoyride.png", category:"adventure" },
  { id:"johnnytrigger", name:"Johnny Trigger", url:"https://jeremyryanknight2012.github.io/My-Website/games/johnnytrigger.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/johnnytrigger.png", category:"action" },
  { id:"kindergarten", name:"Kindergarten", url:"https://jeremyryanknight2012.github.io/My-Website/games/kindergarten.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/kindergarten.png", category:"adventure" },
  { id:"kindergarten2", name:"Kindergarten 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/kindergarten2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/kindergarten2.png", category:"adventure" },
  { id:"kindergarten3", name:"Kindergarten 3", url:"https://jeremyryanknight2012.github.io/My-Website/games/kindergarten3.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/kindergarten3.png", category:"adventure" },
  { id:"learntofly", name:"Learn to Fly", url:"https://jeremyryanknight2012.github.io/My-Website/games/learntofly.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/learntofly.png", category:"adventure" },
  { id:"melonplayground", name:"Melon Playground", url:"https://jeremyryanknight2012.github.io/My-Website/games/melonplayground.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/melonplayground.png", category:"puzzle" },
  { id:"minecraft", name:"Minecraft", url:"https://jeremyryanknight2012.github.io/My-Website/games/minecraft.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/minecraft.png", category:"adventure" },
  { id:"nazizombies", name:"Nazi Zombies", url:"https://jeremyryanknight2012.github.io/My-Website/games/nazizombies.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/nazizombies.png", category:"action" },
  { id:"papersplease", name:"Papers Please", url:"https://jeremyryanknight2012.github.io/My-Website/games/papersplease.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/papersplease.png", category:"puzzle" },
  { id:"pixelgun3d", name:"Pixel Gun 3D", url:"https://jeremyryanknight2012.github.io/My-Website/games/pixelgun.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/pixelgun.png", category:"action" },
  { id:"poppyplaytime", name:"Poppy Playtime", url:"https://jeremyryanknight2012.github.io/My-Website/games/poppyplaytime.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/poppyplaytime.png", category:"horror" },
  { id:"freddyfazbearspizzeriasimulator", name:"Freddy Fazbear's Pizzeria Simulator", url:"https://jeremyryanknight2012.github.io/My-Website/games/pizzeriasimulator.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/pizzeriasimulator.png", category:"horror" },
  { id:"plantsvszombies", name:"Plants vs Zombies", url:"https://jeremyryanknight2012.github.io/My-Website/games/plantsvszombies.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/plantsvszombies.png", category:"puzzle" },
  { id:"plantsvszombies2", name:"Plants vs Zombies 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/plantsvszombies2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/plantsvszombies2.png", category:"puzzle" },
  { id:"pokemon", name:"Pokemon", url:"https://jeremyryanknight2012.github.io/My-Website/games/pokemon.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/pokemon.png", category:"adventure" },
  { id:"raft", name:"Raft", url:"https://jeremyryanknight2012.github.io/My-Website/games/raft.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/raft.png", category:"adventure" },
  { id:"ragdollarchers", name:"Ragdoll Archers", url:"https://jeremyryanknight2012.github.io/My-Website/games/ragdollarchers.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/ragdollarchers.png", category:"action" },
  { id:"retrobowlcollege", name:"Retro Bowl College", url:"https://jeremyryanknight2012.github.io/My-Website/games/retrobowlcollege.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/retrobowlcollege.png", category:"sports" },
  { id:"schoolboyrunaway", name:"Schoolboy Runaway", url:"https://jeremyryanknight2012.github.io/My-Website/games/schoolboyrunaway.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/schoolboyrunaway.png", category:"adventure" },
  { id:"sisterlocation", name:"Sister Location", url:"https://jeremyryanknight2012.github.io/My-Website/games/sisterlocation.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/sisterlocation.png", category:"horror" },
  { id:"slenderman", name:"Slenderman", url:"https://jeremyryanknight2012.github.io/My-Website/games/slenderman.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/slenderman.png", category:"horror" },
  { id:"slimerancher", name:"Slime Rancher", url:"https://jeremyryanknight2012.github.io/My-Website/games/slimerancher.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/slimerancher.png", category:"adventure" },
  { id:"slitherio", name:"Slither.io", url:"https://jeremyryanknight2012.github.io/My-Website/games/slitherio.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/slitherio.png", category:"action" },
  { id:"slope", name:"Slope", url:"https://jeremyryanknight2012.github.io/My-Website/games/slope.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/slope.png", category:"adventure" },
  { id:"smashkarts", name:"Smash Karts", url:"https://jeremyryanknight2012.github.io/My-Website/games/smashkarts.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/smashkarts.png", category:"action" },
  { id:"snowrider", name:"Snow Rider", url:"https://jeremyryanknight2012.github.io/My-Website/games/snowrider.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/snowrider.png", category:"adventure" },
  { id:"superhot", name:"SUPERHOT", url:"https://jeremyryanknight2012.github.io/My-Website/games/superhot.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/superhot.png", category:"action" },
  { id:"supermario64", name:"Super Mario 64", url:"https://jeremyryanknight2012.github.io/My-Website/games/supermario64.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/supermario64.png", category:"adventure" },
  { id:"supermariobros", name:"Super Mario Bros", url:"https://jeremyryanknight2012.github.io/My-Website/games/supermariobros.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/supermariobros.png", category:"adventure" },
  { id:"survivalrace", name:"Survival Race", url:"https://jeremyryanknight2012.github.io/My-Website/games/survivalrace.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/survivalrace.png", category:"sports" },
  { id:"templerun2", name:"Temple Run 2", url:"https://jeremyryanknight2012.github.io/My-Website/games/templerun2.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/templerun2.png", category:"adventure" },
  { id:"terraria", name:"Terraria", url:"https://jeremyryanknight2012.github.io/Terraria", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/terraria.png", category:"adventure" },
  { id:"theyarecoming", name:"They are Coming", url:"https://jeremyryanknight2012.github.io/My-Website/games/theyarecoming.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/theyarecoming.png", category:"action" },
  { id:"tinyfishing", name:"Tiny Fishing", url:"https://jeremyryanknight2012.github.io/My-Website/games/tinyfishing.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/tinyfishing.png", category:"adventure" },
  { id:"tombofthemask", name:"Tomb of the Mask", url:"https://jeremyryanknight2012.github.io/My-Website/games/tombofthemask.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/tombofthemask.png", category:"adventure" },
  { id:"ultimatecustomnight", name:"Ultimate Custom Night", url:"https://jeremyryanknight2012.github.io/My-Website/games/ultimatecustomnight.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/ultimatecustomnight.png", category:"horror" },
  { id:"undertale", name:"Undertale", url:"https://jeremyryanknight2012.github.io/My-Website/games/undertale.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/undertale.png", category:"adventure" }
];

let currentCategory = 'all';

// ============================================
// MOVIES DATA
// ============================================

const TOP_MOVIES = [
  { id:"thesimpsonsmovie", name:"The Simpsons Movie", url:"https://jeremyryanknight2012.github.io/My-Website/movies/simpsonsmovie.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/simpsonsmovie.png" },
  { id:"jurassicpark", name:"Jurassic Park", url:"https://jeremyryanknight2012.github.io/My-Website/movies/jurassicpark.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/jurassicpark.png" }
];

const ALL_MOVIES = [
  { id:"acharliebrownchristmas", name:"A Charlie Brown Christmas", url:"https://jeremyryanknight2012.github.io/My-Website/movies/acharliebrownchristmas.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/acharliebrownchristmas.png" },
  { id:"avengersendgame", name:"Avengers Endgame", url:"https://jeremyryanknight2012.github.io/My-Website/movies/avengersendgame.html", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/avengersendgame.png" }
];

// ============================================
// TV SHOWS DATA
// ============================================

const ALL_TVSHOWS = [
  { name:"Adventure Time", url:"https://drive.google.com/drive/folders/1OwoKydzUQUUp6n-Nh7CCAQXGLfchU8Ta", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/adventuretime.png" },
  { name:"Amazing World of Gumball", url:"https://drive.google.com/drive/folders/1jhdpF65hUXwCRjOZKqquWB4z8L1ZpII7", thumb:"https://jeremyryanknight2012.github.io/My-Website/thumbnails/amazingworldofgumball.png" }
];

// ============================================
// RENDER FUNCTIONS WITH FAVORITES
// ============================================

function renderGames() {
  const topScroller = document.getElementById('topGamesScroller');
  const allScroller = document.getElementById('allGamesScroller');

  function cardHTML(g) {
    const isFavorite = favorites.some(f => f.id === g.id);
    return `
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${g.id}" onclick="event.stopPropagation(); toggleFavorite('${g.id}', '${g.name}', '${g.url}', '${g.thumb}', 'game')">${isFavorite ? '⭐' : '☆'}</button>
      <img class="thumb" src="${g.thumb}" alt="${g.name}">
      <strong>${g.name}</strong>
      <button class="game-btn" data-url="${g.url}" data-title="${g.name}" data-id="${g.id}" data-thumb="${g.thumb}">Launch</button>
    `;
  }

  topScroller.innerHTML = '';
  TOP_GAMES.forEach(g => {
    const d = document.createElement('div');
    d.className = 'game';
    d.innerHTML = cardHTML(g);
    topScroller.appendChild(d);
  });

  allScroller.innerHTML = '';
  const filteredGames = currentCategory === 'all' ? ALL_GAMES : ALL_GAMES.filter(g => g.category === currentCategory);
  
  filteredGames.forEach(g => {
    const d = document.createElement('div');
    d.className = 'game';
    d.innerHTML = cardHTML(g);
    allScroller.appendChild(d);
  });
}

function filterGamesByCategory(category) {
  currentCategory = category;
  
  // Update button states
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderGames();
}

function renderMovies() {
  const topScroller = document.getElementById('topMoviesScroller');
  const allScroller = document.getElementById('allMoviesScroller');

  function cardHTML(m) {
    const isFavorite = favorites.some(f => f.id === m.id);
    return `
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${m.id}" onclick="event.stopPropagation(); toggleFavorite('${m.id}', '${m.name}', '${m.url}', '${m.thumb}', 'movie')">${isFavorite ? '⭐' : '☆'}</button>
      <img class="thumb" src="${m.thumb}">
      <strong>${m.name}</strong>
      <button class="movie-btn" data-url="${m.url}" data-title="${m.name}" data-id="${m.id}" data-thumb="${m.thumb}">Watch</button>
    `;
  }

  topScroller.innerHTML = '';
  TOP_MOVIES.forEach(m => {
    const d = document.createElement('div');
    d.className = 'movie';
    d.innerHTML = cardHTML(m);
    topScroller.appendChild(d);
  });

  allScroller.innerHTML = '';
  ALL_MOVIES.forEach(m => {
    const d = document.createElement('div');
    d.className = 'movie';
    d.innerHTML = cardHTML(m);
    allScroller.appendChild(d);
  });
}

function renderTVShows() {
  const allScroller = document.getElementById('allTVShowsScroller');
  allScroller.innerHTML = '';
  ALL_TVSHOWS.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tvshow';
    d.innerHTML = `
      <img class="thumb" src="${t.thumb}" alt="${t.name}">
      <strong>${t.name}</strong>
      <button class="tvshow-btn" onclick="location.href='${t.url}'">Watch</button>
    `;
    allScroller.appendChild(d);
  });
}

renderGames();
renderMovies();
renderTVShows();

// ============================================
// SEARCH FUNCTIONS
// ============================================

document.getElementById('games-search').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = ALL_GAMES.filter(g => 
    g.name.toLowerCase().includes(term) && 
    (currentCategory === 'all' || g.category === currentCategory)
  );
  const allScroller = document.getElementById('allGamesScroller');
  const empty = document.getElementById('gamesEmpty');
  
  if (filtered.length === 0) {
    empty.style.display = 'block';
    allScroller.innerHTML = '';
  } else {
    empty.style.display = 'none';
    allScroller.innerHTML = '';
    filtered.forEach(g => {
      const isFavorite = favorites.some(f => f.id === g.id);
      const d = document.createElement('div');
      d.className = 'game';
      d.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${g.id}" onclick="event.stopPropagation(); toggleFavorite('${g.id}', '${g.name}', '${g.url}', '${g.thumb}', 'game')">${isFavorite ? '⭐' : '☆'}</button>
        <img class="thumb" src="${g.thumb}" alt="${g.name}">
        <strong>${g.name}</strong>
        <button class="game-btn" data-url="${g.url}" data-title="${g.name}" data-id="${g.id}" data-thumb="${g.thumb}">Launch</button>
      `;
      allScroller.appendChild(d);
    });
  }
});

document.getElementById('games-clear').addEventListener('click', () => {
  document.getElementById('games-search').value = '';
  document.getElementById('gamesEmpty').style.display = 'none';
  renderGames();
});

document.getElementById('movies-search').addEventListener('input', (e) => {
  const v = e.target.value.toLowerCase();
  const f = ALL_MOVIES.filter(m => m.name.toLowerCase().includes(v));
  const empty = document.getElementById('moviesEmpty');
  const allScroller = document.getElementById('allMoviesScroller');
  
  empty.style.display = f.length ? 'none' : 'block';
  allScroller.innerHTML = '';
  f.forEach(m => {
    const isFavorite = favorites.some(fav => fav.id === m.id);
    const d = document.createElement('div');
    d.className = 'movie';
    d.innerHTML = `
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${m.id}" onclick="event.stopPropagation(); toggleFavorite('${m.id}', '${m.name}', '${m.url}', '${m.thumb}', 'movie')">${isFavorite ? '⭐' : '☆'}</button>
      <img class="thumb" src="${m.thumb}">
      <strong>${m.name}</strong>
      <button class="movie-btn" data-url="${m.url}" data-title="${m.name}" data-id="${m.id}" data-thumb="${m.thumb}">Watch</button>
    `;
    allScroller.appendChild(d);
  });
});

document.getElementById('movies-clear').addEventListener('click', () => {
  document.getElementById('movies-search').value = '';
  document.getElementById('moviesEmpty').style.display = 'none';
  renderMovies();
});

document.getElementById('tvshows-search').addEventListener('input', (e) => {
  const v = e.target.value.toLowerCase();
  const f = ALL_TVSHOWS.filter(t => t.name.toLowerCase().includes(v));
  const allScroller = document.getElementById('allTVShowsScroller');
  allScroller.innerHTML = '';
  f.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tvshow';
    d.innerHTML = `
      <img class="thumb" src="${t.thumb}" alt="${t.name}">
      <strong>${t.name}</strong>
      <button class="tvshow-btn" onclick="location.href='${t.url}'">Watch</button>
    `;
    allScroller.appendChild(d);
  });
});

document.getElementById('tvshows-clear').addEventListener('click', () => {
  document.getElementById('tvshows-search').value = '';
  renderTVShows();
});

// ============================================
// PLAYER OVERLAY WITH RECENTLY PLAYED TRACKING
// ============================================

const player = document.getElementById('player');
const frame = document.getElementById('playerFrame');
const nameEl = document.getElementById('playerName');
const closeBtn = document.getElementById('closeBtn');

document.addEventListener('click', e => {
  const btn = e.target.closest('.game-btn, .movie-btn');
  if (!btn) return;
  
  const id = btn.dataset.id || btn.dataset.title;
  const title = btn.dataset.title;
  const url = btn.dataset.url;
  const thumb = btn.dataset.thumb;
  const type = btn.classList.contains('game-btn') ? 'game' : 'movie';
  
  // Add to recently played
  if (id && title && url && thumb) {
    addToRecentlyPlayed(id, title, url, thumb, type);
  }
  
  nameEl.textContent = title;
  frame.src = url;
  player.classList.add('open');
  try {
    if (!document.fullscreenElement) player.requestFullscreen();
  } catch {}
});

closeBtn.onclick = () => {
  player.classList.remove('open');
  frame.src = '';
  if (document.fullscreenElement) document.exitFullscreen();
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function openWaterGame() {
  const win = window.open("about:blank");
  const url = "https://cgxlyxnlynjpbmdiywnrc3rhcnrtewvkdwnhdglvbml0d2fzc29sawdtv2.familyguy.in/signin.html";
  const iframe = win.document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = url;
  win.document.body.style.margin = "0";
  win.document.body.appendChild(iframe);
}

function openUnblockedGoogle() {
  const win = window.open("about:blank");
  const url = "https://browse.familyguy.in";
  const iframe = win.document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = url;
  win.document.body.style.margin = "0";
  win.document.body.appendChild(iframe);
}

// ============================================
// REQUEST FORM
// ============================================

document.getElementById('requestForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const statusEl = document.getElementById('status');
  statusEl.className = '';
  statusEl.textContent = 'Sending...';

  emailjs.sendForm('service_4caoubc', 'template_67jfhnb', this).then(
    function() {
      statusEl.textContent = '✅ Your request has been sent!';
      statusEl.classList.add('status-ok');
      document.getElementById('requestForm').reset();
    },
    function(error) {
      statusEl.textContent = '❌ Failed to send request. Please try again.';
      statusEl.classList.add('status-bad');
      console.error('EmailJS Error:', error);
    }
  );
});

// ============================================
// CHAT FUNCTIONS
// ============================================

function setupChat() {
  if (!window.myName) {
    showNotification('Please login via Profile page first.', 'warning');
    return;
  }
  
  db.ref("users/" + window.myName + "/status").set("online");
  db.ref("users/" + window.myName + "/status").onDisconnect().set("offline");
  listenFriends();
  listenGroups();
}

function listenFriends() {
  db.ref("users/" + window.myName + "/friends").on("value", (snap) => {
    const list = document.getElementById("friend-list");
    list.innerHTML = "";
    myFriends = [];

    snap.forEach((f) => {
      const fName = f.key;
      myFriends.push(fName);

      const div = document.createElement("div");
      div.className = "contact-item";
      div.innerHTML = `
        <img id="sidebar-pfp-${fName}" class="avatar-circle" src="https://via.placeholder.com/34" style="cursor:pointer;" onclick="event.stopPropagation(); viewUserProfile('${fName}', 'chat');">
        <span style="flex:1;cursor:pointer;" onclick="openChat('${fName}', this.parentElement, 'private')">${fName}</span>
        <button onclick="event.stopPropagation(); unfriend('${fName}')" style="background:none;border:none;color:var(--alert);font-size:12px;cursor:pointer;">✖</button>
      `;

      div.onclick = () => openChat(fName, div, "private");
      list.appendChild(div);

      db.ref("users/" + fName + "/pfp").on("value", (s) => {
        const img = document.getElementById(`sidebar-pfp-${fName}`);
        if (img) img.src = s.val() || "https://via.placeholder.com/34";
      });
    });
    
    if (myFriends.length >= 5 && !unlockedBadges.includes('social-butterfly')) {
      unlockBadge('social-butterfly');
    }
  });
}

function listenGroups() {
  db.ref("groups").on("value", (snap) => {
    const box = document.getElementById("group-list");
    box.innerHTML = "";

    snap.forEach((g) => {
      const data = g.val();
      if (data.members && data.members[window.myName]) {
        const div = document.createElement("div");
        div.className = "contact-item";
        div.innerHTML = `
          <div class="avatar-circle" style="background:#222;text-align:center;line-height:34px;">G</div>
          <span style="flex:1">${data.name}</span>
          <button onclick="leaveGroup('${g.key}')" style="background:none;border:none;color:var(--alert);font-size:12px;cursor:pointer;">✖</button>
        `;

        div.onclick = () => openChat(g.key, div, "group");
        box.appendChild(div);
      }
    });
  });
}

function addFriend() {
  const f = prompt("Enter username:");
  if (f && f !== window.myName) {
    db.ref("requests/" + f.toLowerCase() + "/" + window.myName).set(true);
    showNotification('Friend request sent!', 'success');
  }
}

function unfriend(name) {
  if (!confirm(`Remove ${name} from friends?`)) return;
  db.ref("users/" + window.myName + "/friends/" + name).remove();
  db.ref("users/" + name + "/friends/" + window.myName).remove();

  if (activeChat === name) {
    activeChat = null;
    chatType = "none";
    document.getElementById("active-chat-user").innerText = "Select a contact";
    document.getElementById("chat-msgs").innerHTML = "";
  }
}

function leaveGroup(groupId) {
  if (!confirm("Leave this group?")) return;
  db.ref("groups/" + groupId + "/members/" + window.myName).remove();

  if (activeChat === groupId) {
    activeChat = null;
    chatType = "none";
    document.getElementById("active-chat-user").innerText = "Select a contact";
    document.getElementById("chat-msgs").innerHTML = "";
  }
}

function openChat(id, el, type) {
  activeChat = id;
  chatType = type;

  const hPfp = document.getElementById("header-pfp");
  const groupBtn = document.getElementById("make-group-btn");
  const manageBtn = document.getElementById("manage-group-btn");

  hPfp.style.display = "block";
  groupBtn.style.display = type === "private" ? "block" : "none";
  manageBtn.style.display = "none";

  if (type === "global") {
    hPfp.style.display = "none";
    document.getElementById("active-chat-user").innerText = "Public Channel";
  } else if (type === "private") {
    document.getElementById("active-chat-user").innerText = "Chat with " + id;
    db.ref("users/" + id + "/pfp").on("value", (snap) => {
      hPfp.src = snap.val() || "https://via.placeholder.com/34";
    });
  } else if (type === "group") {
    db.ref("groups/" + id).on("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      document.getElementById("active-chat-user").innerText = "Group: " + data.name;
      hPfp.src = "https://via.placeholder.com/34?text=GC";
      if (data.owner === window.myName) manageBtn.style.display = "block";
    });
  }

  document.querySelectorAll(".contact-item").forEach((i) => i.classList.remove("selected"));
  if (el) el.classList.add("selected");

  const chatId = type === "global" ? "GLOBAL_CHAT" : type === "group" ? id : [window.myName, id].sort().join("_");

  db.ref("messages/" + chatId).off();
  const msgRef = db.ref("messages/" + chatId).limitToLast(50);

  const box = document.getElementById("chat-msgs");
  box.innerHTML = "";

  msgRef.on("child_added", (snap) => {
    const d = snap.val();
    renderMessage(box, snap.key, d);
    box.scrollTop = box.scrollHeight;
  });
}

function sendMsg() {
  const inp = document.getElementById("chat-input");
  if (!activeChat || !inp.value.trim()) return;

  const text = inp.value;
  inp.value = "";

  const chatId = chatType === "global" ? "GLOBAL_CHAT" : chatType === "group" ? activeChat : [window.myName, activeChat].sort().join("_");

  db.ref("messages/" + chatId).push({
    sender: window.myName,
    text,
    timestamp: Date.now(),
    seen: { [window.myName]: true },
  });
}

function renderMessage(box, key, d) {
  const isMe = d.sender === window.myName;
  const div = document.createElement("div");
  div.className = `msg ${isMe ? "user" : "other"}`;

  if (!isMe) {
    div.innerHTML = `
      <img class="chat-pfp-trigger" id="msg-pfp-${key}" src="https://via.placeholder.com/24" onclick="viewUserProfile('${d.sender}', 'chat')">
      <span style="color:var(--accent);font-weight:bold;display:block;font-size:10px;cursor:pointer;" onclick="viewUserProfile('${d.sender}', 'chat')">${d.sender}</span>
      ${d.text}
    `;

    db.ref("users/" + d.sender + "/pfp").once("value", (pSnap) => {
      const img = document.getElementById(`msg-pfp-${key}`);
      if (img && pSnap.val()) img.src = pSnap.val();
    });
  } else {
    div.innerHTML = `
      ${d.text}
      <div style="font-size:10px;opacity:0.6;text-align:right;margin-top:3px;">
        ${d.seen && Object.keys(d.seen).length > 1 ? "Seen" : "Sent"}
      </div>
    `;
  }

  box.appendChild(div);
}

function createGroup() {
  const gn = prompt("Enter Group Name:");
  if (!gn) return;

  const gid = "group_" + Date.now();
  db.ref("groups/" + gid).set({
    name: gn,
    owner: window.myName,
    members: { [window.myName]: true, [activeChat]: true },
  });

  showNotification('Group created!', 'success');
}

function changeChatBG() {
  const url = prompt("Enter Background Image URL:");
  if (url) document.getElementById("chat-pane").style.background = `url('${url}')`;
}

function viewProfileFromChat() {
  if (chatType === 'private' && activeChat) {
    viewUserProfile(activeChat, 'chat');
  } else if (chatType === 'global') {
    showNotification('This is the public channel', 'warning');
  } else if (chatType === 'group') {
    showNotification('Group profiles coming soon!', 'warning');
  }
}

function filterFriends() {
  const search = document.getElementById("friend-search").value.toLowerCase();
  document.querySelectorAll("#friend-list .contact-item").forEach((el) => {
    const name = el.textContent.toLowerCase();
    el.style.display = name.includes(search) ? "flex" : "none";
  });
}

// ============================================
// USER PROFILE VIEWING
// ============================================

function viewUserProfile(username, fromPage) {
  if (!username) return;
  
  viewedUserName = username;
  previousPage = fromPage || 'chat';
  
  db.ref("users/" + username).once("value", (snap) => {
    if (!snap.exists()) {
      showNotification('User not found', 'error');
      return;
    }
    
    const userData = snap.val();
    
    document.getElementById('user-profile-username').textContent = username;
    document.getElementById('user-profile-status').textContent = userData.status === 'online' ? 'Online' : 'Offline';
    document.getElementById('user-profile-pic').src = userData.pfp || 'https://via.placeholder.com/120';
    document.getElementById('user-profile-custom-status').textContent = userData.customStatus || '';
    
    showPage('user-profile');
  });
}

function goBackFromUserProfile() {
  if (previousPage) {
    showPage(previousPage);
  } else {
    showPage('chat');
  }
}

function sendFriendRequestToUser() {
  if (!window.myName) {
    showNotification('Please login first', 'warning');
    return;
  }
  
  if (!viewedUserName) return;
  
  db.ref("requests/" + viewedUserName + "/" + window.myName).set(true);
  showNotification(`Friend request sent to ${viewedUserName}!`, 'success');
}

function messageUser() {
  if (!window.myName) {
    showNotification('Please login first', 'warning');
    return;
  }
  
  if (!viewedUserName) return;
  
  showPage('chat');
  
  setTimeout(() => {
    const contactItems = document.querySelectorAll('#friend-list .contact-item');
    let found = false;
    
    contactItems.forEach(item => {
      if (item.textContent.includes(viewedUserName)) {
        item.click();
        found = true;
      }
    });
    
    if (!found) {
      showNotification('You need to be friends to send messages!', 'warning');
    }
  }, 500);
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

function loginUser() {
  const username = document.getElementById('login-username').value.trim();
  if (!username) {
    showNotification('Please enter a username', 'warning');
    return;
  }

  db.ref("users/" + username).once("value", (snap) => {
    if (snap.exists()) {
      window.myName = username;
      localStorage.setItem("nexus_user", username);
      updateProfileDisplay();
      loadCoinData();
      startCoinEarning();
      showNotification('Logged in successfully!', 'success');
    } else {
      showNotification('User not found. Please register first.', 'warning');
    }
  });
}

function registerUser() {
  const username = document.getElementById('login-username').value.trim();
  if (!username) {
    showNotification('Please enter a username', 'warning');
    return;
  }

  db.ref("users/" + username).once("value", (snap) => {
    if (snap.exists()) {
      showNotification('Username already taken', 'warning');
    } else {
      db.ref("users/" + username).set({
        status: "online",
        pfp: "https://via.placeholder.com/120",
        customStatus: "",
        friends: {},
        coins: 0,
        purchasedGames: []
      });
      window.myName = username;
      localStorage.setItem("nexus_user", username);
      updateProfileDisplay();
      loadCoinData();
      startCoinEarning();
      showNotification('Registered successfully!', 'success');
    }
  });
}

function logoutUser() {
  if (window.myName) {
    db.ref("users/" + window.myName + "/status").set("offline");
  }
  stopCoinEarning();
  window.myName = null;
  localStorage.removeItem("nexus_user");
  novaCoins = 0;
  purchasedGames = [];
  updateCoinDisplay();
  updateProfileDisplay();
  showNotification('Logged out', 'success');
}

function updateProfileDisplay() {
  if (window.myName) {
    document.getElementById('profile-username').textContent = window.myName;
    document.getElementById('profile-status').textContent = 'Online';
    
    db.ref("users/" + window.myName + "/pfp").on("value", (snap) => {
      const pfpUrl = snap.val() || "https://via.placeholder.com/120";
      document.getElementById('profile-pic').src = pfpUrl;
    });
    
    db.ref("users/" + window.myName + "/customStatus").on("value", (snap) => {
      const status = snap.val() || '';
      document.getElementById('status-input').placeholder = status || "What's on your mind?";
    });
  } else {
    document.getElementById('profile-username').textContent = 'Guest';
    document.getElementById('profile-status').textContent = 'Offline';
    document.getElementById('profile-pic').src = 'https://via.placeholder.com/120';
  }
}

function uploadProfilePic(event) {
  if (!window.myName) {
    showNotification('Please login first', 'warning');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    db.ref("users/" + window.myName + "/pfp").set(base64);
    document.getElementById('profile-pic').src = base64;
    showNotification('Profile picture updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function loadProfile() {
  if (!window.myName) return;

  db.ref("requests/" + window.myName).on("value", (snap) => {
    const requestsList = document.getElementById('requests-list');
    requestsList.innerHTML = '';

    if (!snap.exists() || snap.numChildren() === 0) {
      requestsList.innerHTML = '<p class="empty">No pending requests</p>';
      return;
    }

    snap.forEach((req) => {
      const requester = req.key;
      const div = document.createElement('div');
      div.className = 'request-item';
      div.innerHTML = `
        <div class="request-user" style="cursor:pointer;" onclick="viewUserProfile('${requester}', 'profile')">
          <img class="avatar-circle" src="https://via.placeholder.com/34" id="req-pfp-${requester}">
          <span>${requester}</span>
        </div>
        <div class="request-actions">
          <button class="accept-btn" onclick="event.stopPropagation(); acceptRequest('${requester}')">Accept</button>
          <button class="decline-btn" onclick="event.stopPropagation(); declineRequest('${requester}')">Decline</button>
        </div>
      `;
      requestsList.appendChild(div);

      db.ref("users/" + requester + "/pfp").once("value", (pSnap) => {
        const img = document.getElementById(`req-pfp-${requester}`);
        if (img && pSnap.val()) img.src = pSnap.val();
      });
    });
  });
}

function acceptRequest(requester) {
  db.ref("users/" + window.myName + "/friends/" + requester).set(true);
  db.ref("users/" + requester + "/friends/" + window.myName).set(true);
  db.ref("requests/" + window.myName + "/" + requester).remove();
  showNotification(`You are now friends with ${requester}!`, 'success');
}

function declineRequest(requester) {
  db.ref("requests/" + window.myName + "/" + requester).remove();
  showNotification('Request declined', 'success');
}
