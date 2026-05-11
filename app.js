// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    apiKey: localStorage.getItem('lisichka_api_key') || '',
    apiUrl: localStorage.getItem('lisichka_api_url') || 'https://api.lisichka.ai',
};

// ===== БРАУЗЕР =====
class GriboBrowser {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.initBrowserControls();
    }

    initBrowserControls() {
        const urlBar = document.getElementById('urlBar');
        const goBtn = document.getElementById('goBtn');
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const frame = document.getElementById('browserFrame');

        goBtn.addEventListener('click', () => this.navigate(urlBar.value));
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.navigate(urlBar.value);
        });

        backBtn.addEventListener('click', () => this.goBack());
        forwardBtn.addEventListener('click', () => this.goForward());
        refreshBtn.addEventListener('click', () => this.refresh());
    }

    navigate(url) {
        if (!url.trim()) return;

        // Добавляем протокол если его нет
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const frame = document.getElementById('browserFrame');
        const urlBar = document.getElementById('urlBar');

        try {
            frame.src = url;
            urlBar.value = url;

            // Добавляем в историю
            if (this.currentIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.currentIndex + 1);
            }
            this.history.push(url);
            this.currentIndex = this.history.length - 1;

            this.updateNavButtons();
        } catch (error) {
            console.error('Ошибка навигации:', error);
            alert('Не удалось загрузить страницу');
        }
    }

    goBack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadHistoryPage();
        }
    }

    goForward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.loadHistoryPage();
        }
    }

    loadHistoryPage() {
        const url = this.history[this.currentIndex];
        const frame = document.getElementById('browserFrame');
        const urlBar = document.getElementById('urlBar');

        frame.src = url;
        urlBar.value = url;
        this.updateNavButtons();
    }

    refresh() {
        const frame = document.getElementById('browserFrame');
        frame.src = frame.src;
    }

    updateNavButtons() {
        document.getElementById('backBtn').disabled = this.currentIndex === 0;
        document.getElementById('forwardBtn').disabled = this.currentIndex === this.history.length - 1;
    }
}

// ===== ЧАТ С ЛИСИЧКА.AI =====
class LisichkaChat {
    constructor() {
        this.messages = [];
        this.initChatEvents();
        this.loadChatHistory();
    }

    initChatEvents() {
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        const toggleChat = document.getElementById('toggleChat');

        sendBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        toggleChat.addEventListener('click', () => {
            const container = document.getElementById('chatContainer');
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        });
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;
        if (!CONFIG.apiKey) {
            alert('⚠️ Установите API ключ в настройках');
            return;
        }

        // Добавляем сообщение пользователя
        this.addMessageToUI(message, 'user');
        chatInput.value = '';

        // Отправляем на AI
        try {
            const response = await this.callLisichkaAPI(message);
            this.addMessageToUI(response, 'ai');
            this.saveChatHistory();
        } catch (error) {
            console.error('Ошибка API:', error);
            this.addMessageToUI('❌ Ошибка подключения к Лисичка.AI', 'ai');
        }
    }

    async callLisichkaAPI(userMessage) {
        const payload = {
            message: userMessage,
            conversation_id: this.getConversationId(),
        };

        const response = await fetch(`${CONFIG.apiUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.response || data.text || 'Нет ответа от Лисички';
    }

    addMessageToUI(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        this.messages.push({ sender, text, timestamp: new Date().toISOString() });
    }

    saveChatHistory() {
        localStorage.setItem('chat_history', JSON.stringify(this.messages));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('chat_history');
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = '';
                this.messages.forEach(msg => {
                    this.addMessageToUI(msg.text, msg.sender);
                });
            } catch (error) {
                console.error('Ошибка загрузки истории:', error);
            }
        }
    }

    getConversationId() {
        let id = localStorage.getItem('conversation_id');
        if (!id) {
            id = 'conv_' + Date.now();
            localStorage.setItem('conversation_id', id);
        }
        return id;
    }
}

// ===== ЗВОНКИ С ЛИСИЧКА.AI =====
class LisichkaCall {
    constructor() {
        this.isCallActive = false;
        this.mediaStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.initCallEvents();
    }

    initCallEvents() {
        const startBtn = document.getElementById('startCallBtn');
        const endBtn = document.getElementById('endCallBtn');
        const toggleCall = document.getElementById('toggleCall');

        startBtn.addEventListener('click', () => this.startCall());
        endBtn.addEventListener('click', () => this.endCall());

        toggleCall.addEventListener('click', () => {
            const container = document.getElementById('callContainer');
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        });
    }

    async startCall() {
        if (!CONFIG.apiKey) {
            alert('⚠️ Установите API ключ в настройках');
            return;
        }

        try {
            // Запрашиваем доступ к микрофону
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Инициализируем Web Audio API для визуализации
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.isCallActive = true;
            this.updateCallStatus();
            this.startAudioVisualization();
            this.simulateCallConnection();

        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            alert('Не удалось получить доступ к микрофону');
        }
    }

    async endCall() {
        this.isCallActive = false;
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.updateCallStatus();
        document.getElementById('callTranscript').innerHTML += 
            '<div style="color: #999; font-size: 12px; margin-top: 8px;">📞 Звонок завершен</div>';
    }

    updateCallStatus() {
        const statusDiv = document.getElementById('callStatus');
        const startBtn = document.getElementById('startCallBtn');
        const endBtn = document.getElementById('endCallBtn');

        if (this.isCallActive) {
            statusDiv.textContent = '🟢 В разговоре с Лисичкой...';
            statusDiv.classList.add('active');
            startBtn.disabled = true;
            endBtn.disabled = false;
        } else {
            statusDiv.textContent = 'Не в разговоре';
            statusDiv.classList.remove('active');
            startBtn.disabled = false;
            endBtn.disabled = true;
        }
    }

    startAudioVisualization() {
        const canvas = document.getElementById('audioCanvas');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isCallActive) return;

            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(245, 245, 245)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    }

    simulateCallConnection() {
        const transcript = document.getElementById('callTranscript');
        
        // Имитируем ответ от Лисички
        setTimeout(() => {
            if (this.isCallActive) {
                transcript.innerHTML += 
                    '<div style="color: #28a745; margin: 4px 0;"><strong>🦊 Лисичка:</strong> Привет! Я Лисичка. Как дела?</div>';
            }
        }, 1000);

        setTimeout(() => {
            if (this.isCallActive) {
                transcript.innerHTML += 
                    '<div style="color: #667eea; margin: 4px 0;"><strong>Ты:</strong> Привет!</div>';
            }
        }, 2500);
    }
}

// ===== НАСТРОЙКИ =====
class Settings {
    constructor() {
        this.initSettingsEvents();
        this.loadSettings();
    }

    initSettingsEvents() {
        const saveBtn = document.getElementById('saveSettings');
        const toggleSettings = document.getElementById('toggleSettings');

        saveBtn.addEventListener('click', () => this.saveSettings());

        toggleSettings.addEventListener('click', () => {
            const container = document.getElementById('settingsContainer');
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        });
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const apiUrl = document.getElementById('apiUrl').value.trim();

        if (!apiKey) {
            alert('⚠️ Введите API ключ');
            return;
        }

        localStorage.setItem('lisichka_api_key', apiKey);
        localStorage.setItem('lisichka_api_url', apiUrl);

        CONFIG.apiKey = apiKey;
        CONFIG.apiUrl = apiUrl;

        alert('✅ Настройки сохранены!');
    }

    loadSettings() {
        document.getElementById('apiKey').value = CONFIG.apiKey;
        document.getElementById('apiUrl').value = CONFIG.apiUrl;
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦊 Грибо.Net запущен');
    console.log('🤖 Инициализация Лисичка.AI...');

    const browser = new GriboBrowser();
    const chat = new LisichkaChat();
    const call = new LisichkaCall();
    const settings = new Settings();

    // Загружаем домашнюю страницу
    browser.navigate('https://google.com');

    console.log('✅ Все компоненты готовы к работе');
});
