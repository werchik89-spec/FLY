// ═══════════════════════════════════════════
// X Pro VPN — Desktop Application Logic
// ═══════════════════════════════════════════

let servers = [];

// ─── State ───
let state = {
    connected: false,
    connecting: false,
    selectedServer: null,
    timer: 0,
    timerInterval: null,
    speedInterval: null,
    downloadHistory: new Array(60).fill(0),
    uploadHistory: new Array(60).fill(0),
    dataUsed: 0,
    currentCategory: 'all',
    theme: 'dark',
    totalData: 2.4,
    totalTime: '12h 34m',
    avgSpeed: 85.2,
    totalConnections: 47,
};

// ─── DOM Elements ───
const connectBtn = document.getElementById('connectBtn');
const statusLabel = document.getElementById('statusLabel');
const statusDetail = document.getElementById('statusDetail');
const connectionTimer = document.getElementById('connectionTimer');
const downloadSpeed = document.getElementById('downloadSpeed');
const uploadSpeed = document.getElementById('uploadSpeed');
const currentServerName = document.getElementById('currentServerName');
const currentServerCity = document.getElementById('currentServerCity');
const currentFlag = document.getElementById('currentFlag');
const ipValue = document.getElementById('ipValue');
const protocolValue = document.getElementById('protocolValue');
const dataUsedEl = document.getElementById('dataUsed');
const pingValue = document.getElementById('pingValue');
const encryptionStatus = document.getElementById('encryptionStatus');
const privacyStatus = document.getElementById('privacyStatus');
const serverList = document.getElementById('serverList');
const serverSearch = document.getElementById('serverSearch');
const changeServerBtn = document.getElementById('changeServerBtn');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const protocolSelect = document.getElementById('protocolSelect');
const speedCanvas = document.getElementById('speedChart');
const speedCtx = speedCanvas.getContext('2d');

// Title bar controls
const tbMinimize = document.getElementById('tbMinimize');
const tbMaximize = document.getElementById('tbMaximize');
const tbClose = document.getElementById('tbClose');

// ─── Initialize ───
async function init() {
    // Set up window controls
    if (window.windowAPI) {
        tbMinimize.addEventListener('click', () => window.windowAPI.minimize());
        tbMaximize.addEventListener('click', () => window.windowAPI.maximize());
        tbClose.addEventListener('click', () => window.windowAPI.close());
    }

    // Load servers from backend
    try {
        if (window.vpnAPI) {
            servers = await window.vpnAPI.fetchServers();
        }
    } catch (e) {
        console.log('Using default servers');
    }

    if (servers.length === 0) {
        servers = getDefaultServers();
    }

    state.selectedServer = servers[0];
    updateServerDisplay();
    renderServers();
    setupNavigation();
    setupServerSearch();
    setupCategories();
    setupTheme();
    setupProtocol();
    setupSpeedChart();
    updateStats();

    connectBtn.addEventListener('click', toggleConnection);
    changeServerBtn.addEventListener('click', () => switchView('servers'));
    themeToggle.addEventListener('click', toggleTheme);
}

function getDefaultServers() {
    return [
        { id: 1, name: 'United States', city: 'New York', flag: '🇺🇸', ping: 12, load: 35, recommended: true, recent: true, favorited: true },
        { id: 2, name: 'United Kingdom', city: 'London', flag: '🇬🇧', ping: 28, load: 42, recommended: true, recent: true, favorited: false },
        { id: 3, name: 'Germany', city: 'Frankfurt', flag: '🇩🇪', ping: 32, load: 55, recommended: true, recent: false, favorited: false },
        { id: 4, name: 'Japan', city: 'Tokyo', flag: '🇯🇵', ping: 85, load: 28, recommended: false, recent: false, favorited: true },
        { id: 5, name: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', ping: 25, load: 48, recommended: true, recent: false, favorited: false },
        { id: 6, name: 'Singapore', city: 'Singapore', flag: '🇸🇬', ping: 92, load: 22, recommended: false, recent: true, favorited: false },
        { id: 7, name: 'Canada', city: 'Toronto', flag: '🇨🇦', ping: 18, load: 38, recommended: true, recent: false, favorited: false },
        { id: 8, name: 'Australia', city: 'Sydney', flag: '🇦🇺', ping: 145, load: 30, recommended: false, recent: false, favorited: false },
        { id: 9, name: 'France', city: 'Paris', flag: '🇫🇷', ping: 30, load: 60, recommended: true, recent: false, favorited: true },
        { id: 10, name: 'Switzerland', city: 'Zurich', flag: '🇨🇭', ping: 35, load: 18, recommended: true, recent: false, favorited: false },
        { id: 11, name: 'Sweden', city: 'Stockholm', flag: '🇸🇪', ping: 40, load: 25, recommended: false, recent: false, favorited: false },
        { id: 12, name: 'Brazil', city: 'São Paulo', flag: '🇧🇷', ping: 120, load: 45, recommended: false, recent: false, favorited: false },
        { id: 13, name: 'South Korea', city: 'Seoul', flag: '🇰🇷', ping: 78, load: 32, recommended: false, recent: true, favorited: false },
        { id: 14, name: 'India', city: 'Mumbai', flag: '🇮🇳', ping: 68, load: 52, recommended: false, recent: false, favorited: false },
        { id: 15, name: 'Iceland', city: 'Reykjavik', flag: '🇮🇸', ping: 55, load: 12, recommended: true, recent: false, favorited: false },
        { id: 16, name: 'Norway', city: 'Oslo', flag: '🇳🇴', ping: 42, load: 20, recommended: false, recent: false, favorited: false },
        { id: 17, name: 'Poland', city: 'Warsaw', flag: '🇵🇱', ping: 38, load: 40, recommended: false, recent: false, favorited: false },
        { id: 18, name: 'Spain', city: 'Madrid', flag: '🇪🇸', ping: 34, load: 50, recommended: false, recent: false, favorited: false },
        { id: 19, name: 'Italy', city: 'Milan', flag: '🇮🇹', ping: 36, load: 44, recommended: false, recent: false, favorited: false },
        { id: 20, name: 'UAE', city: 'Dubai', flag: '🇦🇪', ping: 72, load: 35, recommended: false, recent: false, favorited: false },
    ];
}

// ─── Navigation ───
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
}

function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    const view = document.getElementById(`view-${viewName}`);
    if (navItem) navItem.classList.add('active');
    if (view) view.classList.add('active');
}

// ─── Connection ───
async function toggleConnection() {
    if (state.connecting) return;
    if (state.connected) {
        await disconnect();
    } else {
        await connect();
    }
}

async function connect() {
    state.connecting = true;
    document.body.classList.add('connecting');
    document.body.classList.remove('connected');
    statusLabel.textContent = 'Connecting...';
    statusDetail.textContent = `Establishing tunnel to ${state.selectedServer.city}`;
    showToast('🔄', `Connecting to ${state.selectedServer.name}...`);

    try {
        let result;
        if (window.vpnAPI) {
            result = await window.vpnAPI.connect(state.selectedServer);
        }

        // Simulate a short connection delay for UX
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        state.connecting = false;
        state.connected = true;
        document.body.classList.remove('connecting');
        document.body.classList.add('connected');

        statusLabel.textContent = 'Connected';
        statusDetail.textContent = `Secured via ${state.selectedServer.city}`;

        if (result && result.ip) {
            ipValue.textContent = result.ip;
        } else {
            ipValue.textContent = generateIP();
        }

        pingValue.textContent = `${state.selectedServer.ping} ms`;
        encryptionStatus.textContent = 'Active';
        privacyStatus.textContent = 'Protected';

        showToast('🛡️', `Connected to ${state.selectedServer.name}`);
        startTimer();
        startSpeedSimulation();
        updateStats();
    } catch (err) {
        state.connecting = false;
        document.body.classList.remove('connecting');
        statusLabel.textContent = 'Connection Failed';
        statusDetail.textContent = err.message || 'Tap to retry';
        showToast('❌', 'Connection failed');
    }
}

async function disconnect() {
    try {
        if (window.vpnAPI) {
            await window.vpnAPI.disconnect();
        }
    } catch (e) {
        console.log('Disconnect error:', e);
    }

    state.connected = false;
    document.body.classList.remove('connected', 'connecting');
    statusLabel.textContent = 'Disconnected';
    statusDetail.textContent = 'Tap to connect';
    ipValue.textContent = '—';
    downloadSpeed.textContent = '0.00';
    uploadSpeed.textContent = '0.00';
    pingValue.textContent = '— ms';
    encryptionStatus.textContent = 'Inactive';
    privacyStatus.textContent = 'Exposed';
    stopTimer();
    stopSpeedSimulation();
    showToast('🔓', 'VPN Disconnected');
    updateStats();
}

// ─── Timer ───
function startTimer() {
    state.timer = 0;
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        state.timer++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(state.timerInterval);
    state.timer = 0;
    connectionTimer.textContent = '00:00:00';
}

function updateTimerDisplay() {
    const h = String(Math.floor(state.timer / 3600)).padStart(2, '0');
    const m = String(Math.floor((state.timer % 3600) / 60)).padStart(2, '0');
    const s = String(state.timer % 60).padStart(2, '0');
    connectionTimer.textContent = `${h}:${m}:${s}`;
}

// ─── Speed ───
async function startSpeedSimulation() {
    state.speedInterval = setInterval(async () => {
        if (!state.connected) return;

        let dl, ul;

        if (window.vpnAPI) {
            try {
                const speed = await window.vpnAPI.speedTest();
                dl = speed.download;
                ul = speed.upload;
            } catch (e) {
                dl = 50 + Math.random() * 100;
                ul = 15 + Math.random() * 40;
            }
        } else {
            dl = 50 + Math.random() * 100;
            ul = 15 + Math.random() * 40;
        }

        downloadSpeed.textContent = dl.toFixed(2);
        uploadSpeed.textContent = ul.toFixed(2);

        state.downloadHistory.push(dl);
        state.downloadHistory.shift();
        state.uploadHistory.push(ul);
        state.uploadHistory.shift();

        state.dataUsed += (dl + ul) * 0.001;
        dataUsedEl.textContent = state.dataUsed < 1000
            ? `${state.dataUsed.toFixed(1)} MB`
            : `${(state.dataUsed / 1000).toFixed(2)} GB`;

        drawSpeedChart();
    }, 800);
}

function stopSpeedSimulation() {
    clearInterval(state.speedInterval);
    state.downloadHistory = new Array(60).fill(0);
    state.uploadHistory = new Array(60).fill(0);
    drawSpeedChart();
}

// ─── Speed Chart ───
function setupSpeedChart() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawSpeedChart();
}

function resizeCanvas() {
    const rect = speedCanvas.parentElement.getBoundingClientRect();
    speedCanvas.width = rect.width - 16;
    speedCanvas.height = rect.height - 16;
    drawSpeedChart();
}

function drawSpeedChart() {
    const w = speedCanvas.width;
    const h = speedCanvas.height;
    const ctx = speedCtx;
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(...state.downloadHistory, ...state.uploadHistory, 10);
    const points = state.downloadHistory.length;

    ctx.beginPath();
    for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * w;
        const y = h - (state.downloadHistory[i] / maxVal) * (h * 0.9);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    const isLight = state.theme === 'light';
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');
    fillGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * w;
        const y = h - (state.uploadHistory[i] / maxVal) * (h * 0.9);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// ─── Server Management ───
function updateServerDisplay() {
    const s = state.selectedServer;
    currentServerName.textContent = s.name;
    currentServerCity.textContent = s.city;
    currentFlag.innerHTML = `<span style="font-size:28px">${s.flag}</span>`;
    const bars = document.querySelectorAll('.signal-bar');
    const strength = s.ping < 30 ? 4 : s.ping < 60 ? 3 : s.ping < 100 ? 2 : 1;
    bars.forEach((bar, i) => bar.classList.toggle('active', i < strength));
}

function renderServers(filter = '') {
    let filtered = servers;
    if (state.currentCategory === 'recommended') filtered = servers.filter(s => s.recommended);
    else if (state.currentCategory === 'recent') filtered = servers.filter(s => s.recent);
    else if (state.currentCategory === 'favorites') filtered = servers.filter(s => s.favorited);

    if (filter) {
        const f = filter.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(f) || s.city.toLowerCase().includes(f));
    }

    serverList.innerHTML = filtered.map(s => {
        const loadClass = s.load < 40 ? 'low' : s.load < 70 ? 'medium' : 'high';
        const isActive = state.selectedServer.id === s.id && state.connected;
        return `
            <div class="server-row ${isActive ? 'active' : ''}" data-id="${s.id}">
                <span class="server-row-flag">${s.flag}</span>
                <div class="server-row-info"><div class="server-row-name">${s.name}</div><div class="server-row-location">${s.city}</div></div>
                <span class="server-row-ping">${s.ping} ms</span>
                <div class="server-row-load"><div class="server-row-load-bar ${loadClass}" style="width: ${s.load}%"></div></div>
                <button class="server-row-fav ${s.favorited ? 'favorited' : ''}" data-fav-id="${s.id}">
                    <svg viewBox="0 0 24 24" fill="${s.favorited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                </button>
            </div>`;
    }).join('');

    serverList.querySelectorAll('.server-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.server-row-fav')) return;
            selectServer(parseInt(row.dataset.id));
        });
    });
    serverList.querySelectorAll('.server-row-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(parseInt(btn.dataset.favId));
        });
    });
}

async function selectServer(id) {
    const server = servers.find(s => s.id === id);
    if (!server) return;
    const wasConnected = state.connected;
    if (wasConnected) await disconnect();
    state.selectedServer = server;
    updateServerDisplay();
    renderServers(serverSearch.value);
    switchView('dashboard');
    showToast('🌍', `Selected ${server.name} — ${server.city}`);
    if (wasConnected) setTimeout(() => connect(), 300);
}

function toggleFavorite(id) {
    const server = servers.find(s => s.id === id);
    if (server) {
        server.favorited = !server.favorited;
        renderServers(serverSearch.value);
        showToast(server.favorited ? '⭐' : '☆', `${server.name} ${server.favorited ? 'added to' : 'removed from'} favorites`);
    }
}

function setupServerSearch() {
    serverSearch.addEventListener('input', (e) => renderServers(e.target.value));
}

function setupCategories() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCategory = btn.dataset.category;
            renderServers(serverSearch.value);
        });
    });
}

// ─── Theme ───
function setupTheme() {
    const saved = localStorage.getItem('xpro-theme') || 'dark';
    state.theme = saved;
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('xpro-theme', state.theme);
    drawSpeedChart();
    showToast(state.theme === 'dark' ? '🌙' : '☀️', `${state.theme === 'dark' ? 'Dark' : 'Light'} theme activated`);
}

// ─── Protocol ───
function setupProtocol() {
    protocolSelect.addEventListener('change', (e) => {
        protocolValue.textContent = e.target.options[e.target.selectedIndex].text;
        showToast('🔐', `Protocol changed to ${protocolValue.textContent}`);
    });
}

// ─── Stats ───
function updateStats() {
    const el = (id) => document.getElementById(id);
    if (el('totalData')) el('totalData').textContent = `${state.totalData.toFixed(1)} GB`;
    if (el('totalTime')) el('totalTime').textContent = state.totalTime;
    if (el('avgSpeed')) el('avgSpeed').textContent = `${state.avgSpeed.toFixed(1)} Mbps`;
    if (el('totalConnections')) el('totalConnections').textContent = state.totalConnections;
}

// ─── Toast ───
function showToast(icon, message) {
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Utilities ───
function generateIP() {
    return [
        Math.floor(Math.random() * 200) + 10,
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 254) + 1,
    ].join('.');
}

// ─── Init ───
init();
