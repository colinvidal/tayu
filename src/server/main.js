'use strict';

const WebSocket = require('ws');

const GameManager = require('./game-manager.js');
const { serverPort } = require('../config.json');

const server = require('http').createServer();

const wss = new WebSocket.Server({ server, path: '/tayu-api' });

wss.on('connection', client => {
    GameManager.join(client);

    client.on('message', data => {
        try {
            const action = JSON.parse(data);
            GameManager.action(client, action);
        } catch (e) {}
    });

    client.on('error', () => GameManager.leave(client));
    client.on('close', () => GameManager.leave(client));
});

server.listen(serverPort);