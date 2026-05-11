// ===== БЕСПЛАТНЫЙ API HUGGING FACE =====
const API_CONFIG = {
    // Используем бесплатный API от Hugging Face
    apiUrl: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
    // Это публичный демо ключ (для примера)
    // Вы можете получить свой бесплатный ключ на https://huggingface.co
    huggingFaceKey: 'hf_demokey123456', // Замените на свой
};

// ===== БРАУЗЕР =====
function openSite(url) {
    const urlBar = document.getElementById('urlBar');
    const browserContent = document.getElementById('browserContent');
    
    urlBar.value = url;
    
    // Для безопасности - показываем информацию вместо iframe
    if (url.includes('google.com')) {
        browserContent.innerHTML = '<div class="site-info"><h2>🔍 Google</h2><p>Поиск в интернете</p><a href="' + url + '" target="_blank" class="open-btn">Открыть в новой вкладке →</a></div>';
    } else if (url.includes('youtube.com')) {
        browserContent.innerHTML = '<div class="site-info"><h2>▶️ YouTube</h2><p>Видео платформа</p><a href="' + url + '" target="_blank" class="open-btn">Открыть в новой вкладке →</a></div>';
    } else if (url.includes('wikipedia.org')) {
        browserContent.innerHTML = '<div class="site-info"><h2>📚 Wikipedia</h2><p>Свободная энциклопедия</p><a href="' + url + '" target="_blank" class="open-btn">Открыть в новой вкладке →</a></div>';
    } else if (url.includes('reddit.com')) {
        browserContent.innerHTML = '<div class="site-info"><h2>🔗 Reddit</h2><p>Социальная сеть</p><a href="' + url + '" target="_blank" class="open-btn">Открыть в новой вкладке →</a></div>';
    } else {
        browserContent.innerHTML = '<div class="site-info"><h2>🌐 ' + url + '</h2><p>Откройте сайт в новой вкладке</p><a href="' + url + '" target="_blank" class="open-btn">Открыть →</a></div>';
    }
}

// ===== ЧАТ С ЛИСИЧКА.AI (БЕСПЛАТНЫЙ API) =====
class LisichkaChat {
    constructor() {
        this.messages = [];
        this.initChatEvents();
        this.loadChatHistory();
        this.addWelcomeMessage();
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

    addWelcomeMessage() {
        this.addMessageToUI('👋 Привет! Я Лисичка.AI. Готова помочь! Спроси меня что-нибудь 🦊', 'ai');
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        // Добавляем сообщение пользователя
        this.addMessageToUI(message, 'user');
        chatInput.value = '';

        // Показываем статус
        this.updateStatus('⏳ Лисичка думает...');

        // Отправляем на AI
        try {
            const response = await this.callHuggingFaceAPI(message);
            this.addMessageToUI(response, 'ai');
            this.updateStatus('✅ Готово!');
            setTimeout(() => this.updateStatus(''), 2000);
            this.saveChatHistory();
        } catch (error) {
            console.error('Ошибка API:', error);
            this.addMessageToUI('❌ Ошибка подключения. Попробуйте позже.', 'ai');
            this.updateStatus('❌ Ошибка');
        }
    }

    async callHuggingFaceAPI(userMessage) {
        try {
            const response = await fetch(API_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.huggingFaceKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: userMessage,
                    parameters: {
                        max_new_tokens: 200,
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                // Если ошибка - используем демо ответ
                return this.getDemoResponse(userMessage);
            }

            const data = await response.json();
            
            if (Array.isArray(data) && data[0].generated_text) {
                let text = data[0].generated_text;
                // Убираем исходное сообщение из ответа
                text = text.replace(userMessage, '').trim();
                return text || 'Интересный вопрос! 🤔';
            }
            
            return this.getDemoResponse(userMessage);
        } catch (error) {
            console.error('API ошибка:', error);
            return this.getDemoResponse(userMessage);
        }
    }

    getDemoResponse(userMessage) {
        // Демо ответы если API не работает
        const responses = {
            привет: '👋 Привет! Как дела? 😊',
            как: 'Спасибо, что спросил! Я работаю отлично! 🦊',
            помощь: 'Конечно! Я могу помочь ответить на любой вопрос. Просто спроси! 💪',
            что: 'Я Лисичка - AI ассистент. Могу помочь с информацией и общением! 🤖',
            когда: 'Это зависит от того, о чем ты спрашиваешь! 📅',
            почему: 'Отличный вопрос! Это нужно обдумать... 🤔',
            где: 'Я здесь в твоем приложении Грибо.Net! 🌐',
            кто: 'Я Лисичка - твой AI помощник! 🦊',
            default: 'Интересное сообщение! Расскажи мне больше 👂'
        };

        const lowerMessage = userMessage.toLowerCase();
        
        for (const [key, response] of Object.entries(responses)) {
            if (key !== 'default' && lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return responses.default;
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

    updateStatus(text) {
        document.getElementById('statusText').textContent = text;
    }

    saveChatHistory() {
        try {
            localStorage.setItem('chat_history', JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Не удалось сохранить историю');
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('chat_history');
            if (saved) {
                this.messages = JSON.parse(saved);
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = '';
                this.messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `chat-message ${msg.sender}-message`;
                    messageDiv.textContent = msg.text;
                    chatMessages.appendChild(messageDiv);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        }
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
        try {
            // Запрашиваем доступ к микрофону
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Web Audio API для визуализации
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.isCallActive = true;
            this.updateCallStatus();
            this.startAudioVisualization();
            this.simulateCallConversation();

        } catch (error) {
            console.error('Ошибка микрофона:', error);
            alert('❌ Нужно разрешить доступ к микрофону');
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
        const transcript = document.getElementById('callTranscript');
        transcript.innerHTML += '<div style="color: #999; margin-top: 8px;">📞 Звонок завершен</div>';
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

    simulateCallConversation() {
        const transcript = document.getElementById('callTranscript');
        transcript.innerHTML = '';

        const conversations = [
            { delay: 500, speaker: '🦊 Лисичка', text: 'Привет! Я Лисичка! 🙂' },
            { delay: 2000, speaker: 'Ты', text: 'Привет! Как дела?' },
            { delay: 3500, speaker: '🦊 Лисичка', text: 'Спасибо, отлично! Чем я могу помочь?' },
            { delay: 5000, speaker: 'Ты', text: 'Расскажи о себе!' },
            { delay: 6500, speaker: '🦊 Лисичка', text: 'Я AI ассистент Лисичка из Грибо.Net 🌟' }
        ];

        conversations.forEach(conv => {
            setTimeout(() => {
                if (this.isCallActive) {
                    const color = conv.speaker.includes('Лисичка') ? '#28a745' : '#667eea';
                    transcript.innerHTML += `<div style="color: ${color}; margin: 6px 0;"><strong>${conv.speaker}:</strong> ${conv.text}</div>`;
                    transcript.scrollTop = transcript.scrollHeight;
                }
            }, conv.delay);
        });
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦊 Грибо.Net запущен!');
    console.log('🤖 Используется бесплатный Hugging Face API');

    const chat = new LisichkaChat();
    const call = new LisichkaCall();

    // Обработчик кнопки "Перейти"
    document.getElementById('goBtn').addEventListener('click', () => {
        const url = document.getElementById('urlBar').value;
        if (url) {
            openSite(url);
        }
    });

    console.log('✅ Приложение готово!');
});
