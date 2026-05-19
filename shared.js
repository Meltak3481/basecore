// ── CHAIN CONFIG ──
const CHAINS = {
  mainnet: { id:'0x2105', name:'Base Mainnet', rpc:'https://mainnet.base.org', ex:'https://basescan.org' },
  sepolia: { id:'0x14A34', name:'Base Sepolia', rpc:'https://sepolia.base.org', ex:'https://sepolia.basescan.org' },
};

const TARGET_CHAIN = CHAINS.mainnet;
let FEE_WALLET = '0x356473fc86c257B05f7CaCF5FB496C4Fd93FbF94';

// ── USDC / x402 SABİTLERİ ──
const USDC_CONTRACT     = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS     = 6;
const USDC_PRICE_ATOMIC = '50000'; // 0.05 USDC
const USDC_PRICE_USD    = '0.05';

const USDC_DOMAIN = {
  name: 'USD Coin',
  version: '2', // <--- VERSİYON 2 OLARAK DÜZELTİLDİ (Çok Kritik)
  chainId: 8453,
  verifyingContract: USDC_CONTRACT,
};

const TRANSFER_WITH_AUTH_TYPES = {
  TransferWithAuthorization: [
    { name: 'from',        type: 'address' },
    { name: 'to',          type: 'address' },
    { name: 'value',       type: 'uint256' },
    { name: 'validAfter',  type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce',       type: 'bytes32' },
  ],
};

// ── STATE ──
const BC = {
  addr: null, provider: null, signer: null, chain: 'mainnet',
  walletType: null,
  paymentMode: 'onchain',
  xp: 0, level: 1, streak: 0, refs: 0, tasks: {},
  get shortAddr() { return this.addr ? this.addr.slice(0,6)+'…'+this.addr.slice(-4) : ''; }
};

const LVL = [0, 5000, 15000, 40000, 90000, 190000, 340000, 590000, 1090000, 2090000];

// ── LOAD ETHERS ──
let ethers = null;
async function loadEthers() {
  if (window.ethers) { ethers = window.ethers; return; }
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.10.0/ethers.umd.min.js';
    s.onload = () => {
      ethers = window.ethers;
      try { FEE_WALLET = ethers.getAddress(FEE_WALLET); } catch(e) {}
      res();
    };
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ── OTOMATİK AĞ DEĞİŞTİRME ──
async function ensureBaseNetwork() {
  if (!window.ethereum) return false;
  try {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId.toLowerCase() !== TARGET_CHAIN.id.toLowerCase()) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: TARGET_CHAIN.id }],
        });
        return true;
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: TARGET_CHAIN.id,
              chainName: TARGET_CHAIN.name,
              rpcUrls: [TARGET_CHAIN.rpc],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: [TARGET_CHAIN.ex]
            }]
          });
          return true;
        }
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Ağ değiştirme hatası:', error);
    return false;
  }
}

// ── WALLET MODAL ──
function openWalletModal() {
  let modal = document.getElementById('wallet-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wallet-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease;';
    modal.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border2);border-radius:24px;padding:28px;width:100%;max-width:340px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.85);">
        <div style="font-size:13px;font-weight:700;color:var(--text2);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Bağlan</div>
        <div style="font-size:22px;font-weight:900;margin-bottom:6px;">Cüzdan Seçin</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:24px;">Base ağına bağlanmak için cüzdanınızı seçin</div>
        <div onclick="connectWallet('coinbase')" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--card2);border:1px solid var(--border);border-radius:16px;margin-bottom:10px;cursor:pointer;transition:all .25s;" onmouseover="this.style.borderColor='var(--blue2)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0052FF,#0033FF);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🔵</div>
          <div style="text-align:left;">
            <div style="font-size:15px;font-weight:800;">Coinbase Wallet</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px;">⚡ x402 USDC · On-Chain ETH</div>
          </div>
          <div style="margin-left:auto;font-size:18px;opacity:.4;">›</div>
        </div>
        <div onclick="connectWallet('metamask')" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--card2);border:1px solid var(--border);border-radius:16px;margin-bottom:20px;cursor:pointer;transition:all .25s;" onmouseover="this.style.borderColor='#E8821A'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#F5841F,#E8821A);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🦊</div>
          <div style="text-align:left;">
            <div style="font-size:15px;font-weight:800;">MetaMask</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px;">⚡ x402 USDC · On-Chain ETH</div>
          </div>
          <div style="margin-left:auto;font-size:18px;opacity:.4;">›</div>
        </div>
        <button onclick="closeWalletModal()" style="width:100%;padding:13px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid var(--border2);color:var(--text2);font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;" onmouseover="this.style.background='rgba(255,255,255,.09)'" onmouseout="this.style.background='rgba(255,255,255,.05)'">İptal</button>
      </div>
    `;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeWalletModal(); });
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

function closeWalletModal() {
  const modal = document.getElementById('wallet-modal');
  if (modal) modal.style.display = 'none';
}

// ── PROVIDERS ──
function getMetaMaskProvider() {
  if (!window.ethereum) return null;
  if (window.ethereum.providers) return window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet) || window.ethereum;
  return window.ethereum;
}

function getCoinbaseProvider() {
  if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension;
  if (window.ethereum?.providers) {
    const cb = window.ethereum.providers.find(p => p.isCoinbaseWallet);
    if (cb) return cb;
  }
  if (window.ethereum?.isCoinbaseWallet) return window.ethereum;
  return null;
}

// ── CONNECT WALLET ──
async function connectWallet(type, silent = false) {
  if (!type || typeof type === 'object') { openWalletModal(); return false; }
  closeWalletModal();
  await loadEthers();

  let eip1193 = null;
  if (type === 'coinbase') {
    eip1193 = getCoinbaseProvider();
    if (!eip1193) {
      showNotification('Coinbase Wallet bulunamadı', 'Lütfen Coinbase Wallet eklentisini yükleyin.', 'warning', [{
        label: 'İndir', action: () => window.open('https://www.coinbase.com/wallet/downloads','_blank')
      }]);
      return false;
    }
  } else {
    eip1193 = getMetaMaskProvider() || window.ethereum;
    if (!eip1193) {
      showNotification('MetaMask bulunamadı', 'Lütfen MetaMask eklentisini yükleyin.', 'warning', [{
        label: 'İndir', action: () => window.open('https://metamask.io/download','_blank')
      }]);
      return false;
    }
  }

  try {
    BC.provider = new ethers.BrowserProvider(eip1193);
    await BC.provider.send('eth_requestAccounts', []);

    const isBase = await ensureBaseNetwork();
    if (!isBase && !silent) {
      showNotification('Yanlış Ağ', 'Lütfen Base ağına geçin ve tekrar deneyin.', 'warning');
    }

    BC.signer     = await BC.provider.getSigner();
    BC.addr       = (await BC.signer.getAddress()).toLowerCase();
    BC.walletType = type;

    const savedMode = localStorage.getItem('bc_payment_mode');
    BC.paymentMode  = savedMode || 'onchain';

    localStorage.setItem('bc_last_addr',    BC.addr.toLowerCase());
    localStorage.setItem('bc_wallet_type',  type);
    localStorage.setItem('bc_payment_mode', BC.paymentMode);

    loadState();
    if (!BC.tasks?.connect) addXP(50, 'connect');
    updateNavUI();
  } catch (e) {
    if (!silent) {
      if (e.code === 4001) {
        showNotification('Bağlantı Reddedildi', 'Cüzdan bağlantısı iptal edildi.', 'info');
      } else {
        showNotification('Bağlantı Hatası', e.shortMessage || e.message || 'Beklenmeyen bir hata oluştu.', 'error');
      }
    }
    return false;
  }

  if (!silent) showNotification('Bağlantı Başarılı', `${BC.shortAddr} adresi bağlandı.`, 'success');
  if (typeof showDashboard === 'function') showDashboard();
  return true;
}

// ── MENÜ ──
function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  const d = document.getElementById('user-dropdown');
  if (d) d.style.display = (d.style.display === 'flex') ? 'none' : 'flex';
}

document.addEventListener('click', (e) => {
  const d    = document.getElementById('user-dropdown');
  const wrap = document.getElementById('nav-user-wrap');
  if (d && d.style.display === 'flex' && wrap && !wrap.contains(e.target)) {
    d.style.display = 'none';
  }
});

function disconnectWallet() {
  const addr = BC.shortAddr;
  BC.addr = null; BC.provider = null; BC.signer = null; BC.walletType = null;
  localStorage.removeItem('bc_last_addr');
  localStorage.removeItem('bc_wallet_type');
  localStorage.removeItem('bc_payment_mode');

  // Sadece oturum bilgilerini sil — XP, state, spin verileri KORUNUYOR
  // bc_last_addr, bc_wallet_type, bc_payment_mode zaten üstte silindi

  const d = document.getElementById('user-dropdown');
  if (d) d.style.display = 'none';
  updateNavUI();
  showNotification('Disconnected', `${addr} disconnected.`, 'info');
  if (typeof showConnect === 'function') showConnect();
}

async function switchAccount() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accs[0]) {
      BC.addr   = accs[0].toLowerCase();
      BC.signer = await BC.provider.getSigner();
      localStorage.setItem('bc_last_addr', BC.addr.toLowerCase());
      loadState(); updateNavUI();
      showNotification('Hesap Değiştirildi', BC.shortAddr + ' hesabına geçildi.', 'success');
      const d = document.getElementById('user-dropdown');
      if (d) d.style.display = 'none';
    }
  } catch (e) {
    showNotification('İptal Edildi', 'Hesap değiştirme işlemi iptal edildi.', 'info');
  }
}

// ── PAYMENT MODE ──
function setPaymentMode(mode) {
  BC.paymentMode = mode;
  localStorage.setItem('bc_payment_mode', mode);
  updateModeUI();
  if (mode === 'x402') {
    showNotification('x402 Modu Aktif', '$0.05 USDC imzası ile ödeme yapılacak. ETH gönderimi yok.', 'info');
  } else {
    showNotification('On-Chain Modu Aktif', '0.00002 ETH transferi ile ödeme yapılacak.', 'info');
  }
}

function updateModeUI() {
  const btnOnchain = document.getElementById('btn-onchain');
  const btnX402    = document.getElementById('btn-x402');
  if (btnOnchain && btnX402) {
    btnOnchain.classList.toggle('active', BC.paymentMode === 'onchain');
    btnX402.classList.toggle('active',    BC.paymentMode === 'x402');
  }
}

// ── NAV UI ──
function updateNavUI() {
  const connectBtn = document.getElementById('nav-connect-btn');
  const userWrap   = document.getElementById('nav-user-wrap');
  const addrEl     = document.getElementById('nav-addr');
  const xpEl       = document.getElementById('nav-xp');

  if (BC.addr) {
    if (connectBtn) connectBtn.style.display = 'none';
    if (xpEl)       xpEl.style.display = 'flex';
    if (userWrap)   userWrap.style.display = 'flex';

    if (addrEl) {
      addrEl.style.display = 'inline-flex';
      addrEl.innerHTML = `
        <span style="font-size:11px;opacity:.5;margin-right:4px;">●</span>
        ${BC.shortAddr}
      `;
      addrEl.title = 'Bağlantıyı kesmek için tıklayın';
      addrEl.onclick = (e) => {
        e.stopPropagation();
        showDisconnectConfirm();
      };
    }

    const exitBtn = document.getElementById('nav-exit-btn');
    if (exitBtn) exitBtn.style.display = 'none';

  } else {
    if (connectBtn) connectBtn.style.display = 'flex';
    if (userWrap)   userWrap.style.display = 'none';
    if (xpEl)       xpEl.style.display = 'none';
  }
  updateNavXP();
  updateModeUI();
}

// ── DISCONNECT CONFIRM ──
function showDisconnectConfirm() {
  const existing = document.getElementById('disconnect-popup');
  if (existing) { existing.remove(); return; }

  const popup = document.createElement('div');
  popup.id = 'disconnect-popup';
  popup.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);
    z-index:1001;display:flex;align-items:center;justify-content:center;padding:20px;
    animation:fadeIn .15s ease;
  `;
  popup.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:24px;width:100%;max-width:300px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.8);">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,60,60,.12);border:1px solid rgba(255,60,60,.3);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 14px;">🔌</div>
      <div style="font-size:16px;font-weight:800;margin-bottom:6px;">Disconnect</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:6px;">${BC.shortAddr}</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:22px;opacity:.7;">Bu cüzdanın bağlantısını kesmek istediğinizden emin misiniz?</div>
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('disconnect-popup').remove()" style="flex:1;padding:12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid var(--border2);color:var(--text2);font-weight:700;font-size:14px;cursor:pointer;">İptal</button>
        <button onclick="document.getElementById('disconnect-popup').remove();disconnectWallet();" style="flex:1;padding:12px;border-radius:12px;background:rgba(255,50,50,.15);border:1px solid rgba(255,50,50,.35);color:#ff6b6b;font-weight:800;font-size:14px;cursor:pointer;">Disconnect</button>
      </div>
    </div>
  `;
  popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}


// ── WORKER URL (KV state) ──
const WORKER_URL = (typeof location !== 'undefined' && location.hostname === 'localhost')
  ? 'http://localhost:8787'
  : 'https://basecore-pay.meltak34.workers.dev';

// ── STATE PERSIST ──
// KV debounce timer
let _kvTimer = null;

function saveState() {
  if (!BC.addr) return;
  const addr = BC.addr.toLowerCase();
  // localStorage'a anında yaz
  localStorage.setItem('bc_' + addr, JSON.stringify({
    xp: BC.xp, level: BC.level, streak: BC.streak, refs: BC.refs, tasks: BC.tasks
  }));
  // KV'ye 2 saniye debounce ile yaz
  clearTimeout(_kvTimer);
  _kvTimer = setTimeout(() => _kvSync(addr), 2000);
}

function _kvSync(addr) {
  fetch(WORKER_URL + '/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: addr,
      xp:      BC.xp     || 0,
      level:   BC.level  || 1,
      streak:  BC.streak || 0,
      refs:    BC.refs   || 0,
      tasks:   BC.tasks  || {},
    }),
  }).catch(e => console.warn('[KV] sync failed:', e.message));
}

async function loadState() {
  if (!BC.addr) return;
  const addr = BC.addr.toLowerCase();

  // 1. localStorage'dan hızlıca yükle
  const local = localStorage.getItem('bc_' + addr);
  if (local) {
    try {
      const p   = JSON.parse(local);
      BC.xp     = p.xp     || 0;
      BC.level  = p.level  || 1;
      BC.streak = p.streak || 0;
      BC.refs   = p.refs   || 0;
      BC.tasks  = p.tasks  || {};
      updateNavXP();
      if (typeof CHAR !== 'undefined' && document.getElementById('char-widget')) {
        CHAR.renderWidget(BC.xp);
      }
    } catch(_) {}
  }

  // 2. KV'den en güncel veriyi çek
  try {
    const res  = await fetch(WORKER_URL + '/state?addr=' + addr);
    if (!res.ok) return;
    const data = await res.json();
    const kvXP = data.xp || 0;

    if (kvXP >= (BC.xp || 0)) {
      BC.xp     = kvXP;
      BC.level  = data.level  || 1;
      BC.streak = data.streak || 0;
      BC.refs   = data.refs   || 0;
      BC.tasks  = data.tasks  || {};
      // localStorage güncelle
      localStorage.setItem('bc_' + addr, JSON.stringify({
        xp: BC.xp, level: BC.level, streak: BC.streak, refs: BC.refs, tasks: BC.tasks
      }));
    } else {
      // Local daha yüksek — KV'ye yaz
      _kvSync(addr);
    }

    updateNavXP();
    if (typeof CHAR !== 'undefined' && document.getElementById('char-widget')) {
      CHAR.renderWidget(BC.xp);
    }
  } catch(e) {
    console.warn('[KV] load failed, using localStorage:', e.message);
  }
}

function getNFTMult() {
  try {
    const addr = BC.addr ? BC.addr.toLowerCase() : null;
    if (!addr) return 1;
    const raw = localStorage.getItem('bc_nft_' + addr);
    if (!raw) return 1;
    const d = JSON.parse(raw);
    return 1 + (d.owned ? d.owned.length : 0);
  } catch(_) { return 1; }
}

function addXP(amt, taskId) {
  if (!BC.xp) BC.xp = 0;
  const oldLevel = BC.level || 1;
  // NFT multiplier
  const mult     = getNFTMult();
  const finalAmt = amt * mult;
  BC.xp += finalAmt;
  if (taskId) {
    if (!BC.tasks) BC.tasks = {};
    BC.tasks[taskId] = true;
  }
  for (let i = LVL.length - 1; i >= 0; i--) {
    if (BC.xp >= LVL[i]) { BC.level = i + 1; break; }
  }
  // Seviye atlama kontrolü
  if (BC.level > oldLevel && typeof CHAR !== 'undefined') {
    CHAR.awardLevelBox(BC.level);
    SFX.play('bigwin');
  }
  // Multiplier aktifse nav XP sarı renkte yanıp sönsün
  if (mult > 1) {
    const el = document.getElementById('nav-xp-val');
    if (el) { el.style.color='#fbbf24'; setTimeout(()=>{el.style.color='';},700); }
  }
  saveState();
  updateNavXP();
  if (typeof CHAR !== 'undefined' && document.getElementById('char-widget')) {
    CHAR.renderWidget(BC.xp);
  }
}

function updateNavXP() {
  const el = document.getElementById('nav-xp-val');
  if (el) el.textContent = BC.xp.toLocaleString() + ' XP';
}

// ── PROFESYONEl BİLDİRİM SİSTEMİ ──
function showNotification(title, message, type = 'info', actions = []) {
  const colors = {
    success: { bg:'rgba(0,200,120,.1)',  border:'rgba(0,200,120,.3)',  icon:'✅', color:'#00c878' },
    error:   { bg:'rgba(255,60,60,.1)',  border:'rgba(255,60,60,.3)',  icon:'❌', color:'#ff4444' },
    warning: { bg:'rgba(245,197,24,.1)', border:'rgba(245,197,24,.3)', icon:'⚠️', color:'#f5c518' },
    info:    { bg:'rgba(0,150,255,.1)',  border:'rgba(0,150,255,.3)',  icon:'💡', color:'#0096ff' },
  };
  const c = colors[type] || colors.info;

  let container = document.getElementById('notif-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notif-container';
    container.style.cssText = 'position:fixed;top:70px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:320px;width:calc(100% - 32px);pointer-events:none;';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.style.cssText = `
    background:${c.bg};border:1px solid ${c.border};border-radius:14px;
    padding:14px 16px;display:flex;gap:12px;align-items:flex-start;
    box-shadow:0 8px 32px rgba(0,0,0,.4);backdrop-filter:blur(12px);
    pointer-events:all;cursor:pointer;
    animation:notifIn .3s cubic-bezier(.34,1.56,.64,1) forwards;
  `;

  const actionsHtml = actions.length ? `
    <div style="display:flex;gap:8px;margin-top:10px;">
      ${actions.map(a => `
        <button onclick="(${a.action.toString()})()" style="
          padding:6px 14px;border-radius:8px;border:1px solid ${c.border};
          background:${c.bg};color:${c.color};font-size:12px;font-weight:700;cursor:pointer;
        ">${a.label}</button>
      `).join('')}
    </div>
  ` : '';

  el.innerHTML = `
    <div style="font-size:20px;flex-shrink:0;margin-top:1px;">${c.icon}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:3px;">${title}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.5;">${message}</div>
      ${actionsHtml}
    </div>
    <div onclick="this.closest('[id]').remove ? this.parentElement.remove() : null" style="opacity:.4;font-size:16px;flex-shrink:0;cursor:pointer;padding:2px;">✕</div>
  `;

  el.addEventListener('click', () => {
    el.style.animation = 'notifOut .25s ease forwards';
    setTimeout(() => el.remove(), 250);
  });

  container.appendChild(el);

  const duration = actions.length ? 6000 : 4000;
  setTimeout(() => {
    if (el.isConnected) {
      el.style.animation = 'notifOut .3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }
  }, duration);

  if (!document.getElementById('notif-styles')) {
    const style = document.createElement('style');
    style.id = 'notif-styles';
    style.textContent = `
      @keyframes notifIn {
        from { opacity:0; transform:translateX(100%) scale(.9); }
        to   { opacity:1; transform:translateX(0)    scale(1);  }
      }
      @keyframes notifOut {
        from { opacity:1; transform:translateX(0)    scale(1);  }
        to   { opacity:0; transform:translateX(100%) scale(.9); }
      }
      @keyframes fadeIn {
        from { opacity:0; } to { opacity:1; }
      }
    `;
    document.head.appendChild(style);
  }
}

function toast(msg, type = 'info') {
  const titles = { success:'Başarılı', error:'Hata', warning:'Uyarı', info:'Bilgi' };
  showNotification(titles[type] || 'Bilgi', msg, type);
}

// ── YARDIMCILAR ──
function requireWallet() {
  if (!BC.addr) { openWalletModal(); return false; }
  return true;
}

function fmtXP(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toString();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getUSDCBalance(address) {
  try {
    const data   = '0x70a08231' + address.slice(2).padStart(64, '0');
    const result = await BC.provider.call({ to: USDC_CONTRACT, data });
    return BigInt(result);
  } catch (e) {
    console.error('USDC bakiye hatası:', e);
    return 0n;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ── GERÇEK x402 AKIŞI (YENİ SEKME SORUNU ÇÖZÜLDÜ - OPTIMISTIC FLOW) ──
// ═══════════════════════════════════════════════════════════════════════
async function handleX402Payment(apiUrl, taskId, xpReward) {
  
  // ADIM 1: Fiyatı zaten biliyoruz, sunucuya sormadan direkt cüzdanı çağır!
  const payTo         = FEE_WALLET;
  const amount        = BigInt(USDC_PRICE_ATOMIC);
  const amountDisplay = (Number(amount) / 10 ** USDC_DECIMALS).toFixed(2);

  const usdcBal = await getUSDCBalance(BC.addr);

  if (usdcBal < amount) {
    const needed = (Number(amount)  / 10 ** USDC_DECIMALS).toFixed(2);
    const has    = (Number(usdcBal) / 10 ** USDC_DECIMALS).toFixed(2);
    showNotification(
      'Yetersiz USDC Bakiyesi',
      `Bu işlem için $${needed} USDC gerekli. Mevcut bakiyeniz: $${has}`,
      'warning',
      [{ label: 'Uniswap\'ta Al', action: () => window.open('https://app.uniswap.org/#/swap?outputCurrency=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&chain=base','_blank') }]
    );
    return null;
  }

  // Kullanıcı hareketi (User Gesture) henüz kaybolmadığı için imza NATIVE olarak açılacak.
  showNotification('İmza Bekleniyor', `$${amountDisplay} USDC transferi için cüzdanınızda onaylayın.`, 'info');

  const now   = Math.floor(Date.now() / 1000);
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  const authorization = {
    from:        BC.addr,
    to:          payTo,
    value:       amount,
    validAfter:  BigInt(now - 60),
    validBefore: BigInt(now + 300),
    nonce,
  };

  let signature;
  try {
    const types = {
      TransferWithAuthorization: [
        { name: 'from',        type: 'address' },
        { name: 'to',          type: 'address' },
        { name: 'value',       type: 'uint256' },
        { name: 'validAfter',  type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce',       type: 'bytes32' },
      ]
    };
    signature = await BC.signer.signTypedData(USDC_DOMAIN, types, authorization);
  } catch (e) {
    if (e.code === 4001 || e.message?.includes('rejected') || e.message?.includes('denied')) {
      showNotification('İmza Reddedildi', 'İşlem cüzdanınızda iptal edildi.', 'info');
    } else {
      showNotification('İmza Hatası', e.shortMessage || e.message || 'Bilinmeyen imza hatası.', 'error');
    }
    return null;
  }

  showNotification('Doğrulanıyor', 'Ödeme sunucuya iletiliyor...', 'info');

  const paymentPayload = {
    x402Version: 1, // VERSİYON UYUŞMAZLIĞI GİDERİLDİ
    scheme:      'exact',
    network:     'eip155:8453',
    payload: {
      signature,
      authorization: {
        from:        authorization.from,
        to:          authorization.to,
        value:       authorization.value.toString(),
        validAfter:  authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        nonce:       authorization.nonce,
      },
    },
  };

  const paymentSignatureHeader = btoa(JSON.stringify(paymentPayload));

  // ADIM 2: İmza alındıktan sonra tek seferde sunucuya gönder
  let response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT':    paymentSignatureHeader,
      },
      body: JSON.stringify({ userAddress: BC.addr, task: taskId }),
    });
  } catch (e) {
    showNotification('Ağ Hatası', 'Ödeme doğrulama isteği gönderilemedi.', 'error');
    return null;
  }

  if (response.ok) {
    const result = await response.json().catch(() => ({}));
    const txHash = result.txHash || null;

    showNotification(
      'Ödeme Onaylandı ✅',
      txHash
        ? `$${amountDisplay} USDC transfer edildi. TX: ${txHash.slice(0,10)}...`
        : `$${amountDisplay} USDC ödeme tamamlandı.`,
      'success',
      txHash ? [{ label: 'BaseScan\'de Görüntüle', action: () => window.open(`https://basescan.org/tx/${txHash}`,'_blank') }] : []
    );

    addXP(xpReward, taskId);
    return { hash: txHash || 'x402_ok', txHash };
  }

  let errMsg = 'Ödeme doğrulaması başarısız oldu.';
  try {
    const errBody = await response.json();
    errMsg = JSON.stringify(errBody.details || errBody);
  } catch (_) {}
  showNotification('Coinbase Hatası', errMsg, 'error');
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// ── ANA ÖDEME FONKSİYONU ──
// ═══════════════════════════════════════════════════════════════════════
async function sendTxWithFee(feeEth = '0.00002', xpReward = 100, taskId = null) {
  if (!requireWallet()) return null;

  if (!BC.signer) {
    showNotification('Oturum Süresi Doldu', 'Lütfen cüzdanınızı tekrar bağlayın.', 'warning');
    openWalletModal();
    return null;
  }

  const isBase = await ensureBaseNetwork();
  if (!isBase) {
    showNotification('Yanlış Ağ', 'Bu işlem için Base ağında olmanız gerekiyor.', 'warning');
    return null;
  }

  if (BC.paymentMode === 'x402') {
    const apiUrl = 'https://basecore-pay.meltak34.workers.dev';
    return await handleX402Payment(apiUrl, taskId, xpReward);
  }

  // On-Chain ETH
  try {
    const bal    = await BC.provider.getBalance(BC.addr);
    const feeWei = ethers.parseEther(feeEth);
    let gasPrice = 0n;
    try {
      const feeData = await BC.provider.getFeeData();
      gasPrice = feeData.gasPrice || 0n;
    } catch (_) {}
    const estimatedGas = 100000n * gasPrice;

    if (bal < feeWei + estimatedGas) {
      showNotification(
        'Yetersiz ETH Bakiyesi',
        `Bu işlem için ${feeEth} ETH + gas gerekli. Lütfen bakiye yükleyin.`,
        'warning'
      );
      return null;
    }

    showNotification('İşlem Başlatıldı', 'Cüzdanınızda onaylayın...', 'info');
    const tx = await BC.signer.sendTransaction({
      to: FEE_WALLET, value: feeWei, gasLimit: 100000,
    });
    showNotification('İşlem Gönderildi', 'Ağda onay bekleniyor...', 'info');
    const rc = await tx.wait();
    showNotification(
      'İşlem Onaylandı ✅',
      `${feeEth} ETH transfer edildi.`,
      'success',
      [{ label: 'BaseScan\'de Görüntüle', action: () => window.open(`https://basescan.org/tx/${rc.hash}`,'_blank') }]
    );
    addXP(xpReward, taskId);
    return rc;
  } catch (e) {
    if (e.code === 4001 || e.message?.includes('rejected')) {
      showNotification('İşlem Reddedildi', 'İşlem cüzdanınızda iptal edildi.', 'info');
    } else {
      showNotification('İşlem Başarısız', e.shortMessage || e.message || 'Beklenmeyen bir hata oluştu.', 'error');
    }
    return null;
  }
}

// ── INIT NAV ──
function initNav(activePage) {
  document.querySelectorAll('.tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === activePage);
  });

  const lastAddr = localStorage.getItem('bc_last_addr');
  const lastType = localStorage.getItem('bc_wallet_type');

  BC.walletType  = lastType;
  BC.paymentMode = localStorage.getItem('bc_payment_mode') || 'onchain';
  updateModeUI();

  if (lastAddr && window.ethereum) {
    setTimeout(() => {
      let provider = window.ethereum;
      if (lastType === 'coinbase')      provider = getCoinbaseProvider()  || provider;
      else if (lastType === 'metamask') provider = getMetaMaskProvider() || provider;

      if (provider) {
        provider.request({ method: 'eth_accounts' }).then(accs => {
          if (accs[0]) {
            loadEthers().then(() => {
              BC.provider = new ethers.BrowserProvider(provider);
              BC.provider.getSigner().then(s => {
                BC.signer = s;
                BC.addr   = accs[0].toLowerCase();
                loadState();
                updateNavUI();
              });
            });
          }
        }).catch(() => {});
      }
    }, 200);
  } else {
    updateNavUI();
  }
}

// ── GAME TRACKER ──
function recordGamePlayed() {
  if (!BC.addr) return 0;
  const now = new Date();
  const dayKey = now.getHours() < 3
    ? (() => { const d = new Date(now); d.setDate(d.getDate() - 1); return d.toDateString(); })()
    : now.toDateString();
  const k   = 'bc_gamecount_' + BC.addr + '_' + dayKey;
  const cur = parseInt(localStorage.getItem(k) || '0');
  localStorage.setItem(k, cur + 1);
  return cur + 1;
}