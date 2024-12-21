document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('messages');
    const usernameInput = document.getElementById('usernameInput');
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const sendButton = document.getElementById('sendButton');
    const emojiButton = document.getElementById('emojiButton');
    const themeButton = document.getElementById('themeButton');
    const attachmentButton = document.getElementById('attachmentButton');
    const notificationSound = document.getElementById('notificationSound');

    let username = '';
    let theme = 'light';
    const badWords = ['плохое слово', 'еще одно плохое слово']; // Список нежелательных слов

    // Подключение к WebSocket серверу
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Соединение установлено');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'join') {
            addMessage('Система', `${data.username} присоединился к чату`);
        } else if (data.type === 'leave') {
            addMessage('Система', `${data.username} покинул чат`);
        } else if (data.type === 'message') {
            addMessage(data.username, data.text);
        }
        notificationSound.play();
    };

    usernameInput.addEventListener('input', (e) => {
        username = e.target.value;
        if (username) {
            ws.send(JSON.stringify({ type: 'join', username }));
        }
    });

    sendButton.addEventListener('click', () => {
        const messageText = messageInput.value.trim();
        if (messageText && username) {
            const filteredMessage = filterBadWords(messageText);
            ws.send(JSON.stringify({ type: 'message', text: filteredMessage }));
            messageInput.value = '';
        }
    });

    emojiButton.addEventListener('click', () => {
        const emojiPicker = document.createElement('div');
        emojiPicker.classList.add('emoji-picker');
        const emojis = ['😊', '😂', '❤️', '👍', '😢', '😱', '😈', '🎉', '🎁', '🎂'];
        emojis.forEach(emoji => {
            const img = document.createElement('img');
            img.src = `https://twemoji.maxcdn.com/v/latest/72x72/${emoji.codePointAt(0).toString(16)}.png`;
            img.alt = emoji;
            img.addEventListener('click', () => {
                messageInput.value += emoji;
                document.body.removeChild(emojiPicker);
            });
            emojiPicker.appendChild(img);
        });
        document.body.appendChild(emojiPicker);
        emojiPicker.classList.add('visible');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-picker') && !e.target.closest('#emojiButton')) {
            const emojiPicker = document.querySelector('.emoji-picker');
            if (emojiPicker) {
                document.body.removeChild(emojiPicker);
            }
        }
    });

    themeButton.addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
    });

    attachmentButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgElement = document.createElement('img');
                imgElement.src = event.target.result;
                addMessage(username, '', imgElement);
                notificationSound.play();
            };
            reader.readAsDataURL(file);
        }
    });

    function addMessage(username, message, imgElement = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const timestamp = new Date().toLocaleTimeString();
        if (imgElement) {
            messageElement.appendChild(imgElement);
        } else {
            messageElement.innerHTML = `<strong>${username}</strong> [${timestamp}]: ${message}`;
        }
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function filterBadWords(message) {
        let filteredMessage = message;
        badWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
        });
        return filteredMessage;
    }
});

