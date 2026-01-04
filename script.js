// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyBQuGUV1A7esCJRkPhcAP6i2UStvdJw-Zg",
    authDomain: "pkpd-database.firebaseapp.com",
    databaseURL: "https://pkpd-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pkpd-database",
    storageBucket: "pkpd-database.firebasestorage.app",
    messagingSenderId: "280364999020",
    appId: "1:280364999020:web:f565467add14c0c4851349",
    measurementId: "G-BDGVRP0DJM"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 全局變量
let currentDevice = null;
let scoreChart = null;
let scores = [];

// 初始化圖表
function initChart() {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return; // 防止 HTML 未載入時噴錯
    const ctx = canvas.getContext('2d');
    
    // 如果圖表已存在則先銷毀，避免重疊
    if (scoreChart) {
        scoreChart.destroy();
    }

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '分數趨勢',
                data: [],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff' } }
            }
        }
    });
}

// 加載設備列表
async function loadDevices() {
    database.ref('devices').on('value', (snapshot) => {
        const devicesData = snapshot.val();
        const deviceList = document.getElementById('deviceList');
        if (!deviceList) return;
        
        deviceList.innerHTML = '';
        
        if (!devicesData) {
            deviceList.innerHTML = '<div class="loading">暫無設備數據</div>';
            return;
        }
        
        Object.keys(devicesData).forEach(deviceId => {
            const chip = document.createElement('div');
            chip.className = 'device-chip' + (currentDevice === deviceId ? ' active' : '');
            chip.innerHTML = `<i>📱</i> ${deviceId.substring(0, 8)}...`;
            chip.onclick = () => selectDevice(deviceId);
            deviceList.appendChild(chip);
        });

        // 預設選擇第一個設備
        if (!currentDevice && Object.keys(devicesData).length > 0) {
            selectDevice(Object.keys(devicesData)[0]);
        }
    });
}

function selectDevice(deviceId) {
    if (currentDevice) {
        database.ref(`devices/${currentDevice}/scores`).off();
        database.ref(`devices/${currentDevice}/statistics`).off();
    }
    currentDevice = deviceId;
    
    // 更新 UI 狀態
    const chips = document.querySelectorAll('.device-chip');
    chips.forEach(c => c.classList.remove('active'));
    
    initChart();
    listenForUpdates(deviceId);
}

function listenForUpdates(deviceId) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.textContent = '在線';
        statusEl.className = 'status-online';
    }

    // 統計監聽
    database.ref(`devices/${deviceId}/statistics`).on('value', (snapshot) => {
        const stats = snapshot.val();
        if (stats) {
            if (document.getElementById('totalGames')) document.getElementById('totalGames').textContent = stats.totalGames || 0;
            if (document.getElementById('averageScore')) document.getElementById('averageScore').textContent = stats.averageScore?.toFixed(1) || 0;
            if (document.getElementById('highScore')) document.getElementById('highScore').textContent = stats.highScore || 0;
        }
    });

    // 分數監聽
    database.ref(`devices/${deviceId}/scores`).orderByChild('timestamp').limitToLast(10).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            scores = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
            updateUI();
        }
    });
}

function updateUI() {
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    scores.forEach(record => {
        const row = tbody.insertRow();
        // 修正時間格式化 (如果是秒則 * 1000)
        const dateStr = record.timestamp ? new Date(record.timestamp * 1000).toLocaleString() : 'N/A';
        row.innerHTML = `
            <td>${dateStr}</td>
            <td><span class="score-badge">${record.score || 0}</span></td>
            <td>${record.sequenceLength || 'N/A'}</td>
            <td>${record.duration || 0}s</td>
            <td>${record.deviceID ? record.deviceID.substring(0,8) : 'N/A'}...</td>
        `;
    });

    if (scores.length > 0 && scoreChart) {
        const latest = scores[0];
        if (document.getElementById('latestScore')) document.getElementById('latestScore').textContent = latest.score;
        if (document.getElementById('latestTime')) document.getElementById('latestTime').textContent = new Date(latest.timestamp * 1000).toLocaleTimeString();
        
        const chartData = [...scores].reverse();
        scoreChart.data.labels = chartData.map((_, i) => `T-${chartData.length - i}`);
        scoreChart.data.datasets[0].data = chartData.map(s => s.score);
        scoreChart.update();
    }
    if (document.getElementById('lastUpdate')) document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// 啟動程式
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    loadDevices();
});
