const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const PORT = 3000;

// Устанавливаем статическую папку
app.use(express.static(path.join(__dirname, 'public')));

// Обрабатываем запросы к корневому маршруту
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Создаем HTTP сервер
const server = http.createServer(app);

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ server });

// Хранилище для пользователей и сообщений
const users = new Map();

// Обработка подключения нового клиента
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'join') {
            users.set(ws, data.username);
            broadcast({ type: 'join', username: data.username });
        } else if (data.type === 'message') {
            broadcast({ type: 'message', username: users.get(ws), text: data.text });
        }
    });

    ws.on('close', () => {
        const username = users.get(ws);
        users.delete(ws);
        broadcast({ type: 'leave', username });
    });
});

// Функция для рассылки сообщений всем клиентам
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Запускаем сервер
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
