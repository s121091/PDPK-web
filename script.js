// Firebase 配置 - 已使用你的 pkpd-database 配置
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
    const ctx = document.getElementById('scoreChart').getContext('2d');
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
    initChart();
    listenForUpdates(deviceId);
}

function listenForUpdates(deviceId) {
    document.getElementById('connectionStatus').textContent = '在線';
    document.getElementById('connectionStatus').className = 'status-online';

    // 統計監聽
    database.ref(`devices/${deviceId}/statistics`).on('value', (snapshot) => {
        const stats = snapshot.val();
        if (stats) {
            document.getElementById('totalGames').textContent = stats.totalGames || 0;
            document.getElementById('averageScore').textContent = stats.averageScore?.toFixed(1) || 0;
            document.getElementById('highScore').textContent = stats.highScore || 0;
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
    tbody.innerHTML = '';
    
    scores.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(record.timestamp * 1000).toLocaleString()}</td>
            <td><span class="score-badge">${record.score}</span></td>
            <td>${record.sequenceLength || 'N/A'}</td>
            <td>${record.duration}s</td>
            <td>${record.deviceID?.substring(0,8)}...</td>
        `;
    });

    if (scores.length > 0) {
        const latest = scores[0];
        document.getElementById('latestScore').textContent = latest.score;
        document.getElementById('latestTime').textContent = new Date(latest.timestamp * 1000).toLocaleTimeString();
        
        const chartData = [...scores].reverse();
        scoreChart.data.labels = chartData.map((_, i) => `T-${chartData.length - i}`);
        scoreChart.data.datasets[0].data = chartData.map(s => s.score);
        scoreChart.update();
    }
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// 啟動
window.onload = () => {
    initChart();
    loadDevices();
};
