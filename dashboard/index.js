const express = require('express');
const path = require('path');
const http = require('http');
const io = require('socket.io');
const Promise = require('bluebird');


class Dashboard {
    constructor(opts) {
        this.crawler = opts.crawler;

        this.app = express();
        this.server = http.createServer(this.app);
        this.socket = io(this.server);

        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'ejs');

        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.get('/*', (req, res) => {
            res.render('template', {
                title: 'Route Separation Example'
            });
        });

        this.socket.on('connection', (client) => {
            console.log('Client connected...');
            client.on('login', (login, password) => {
                this.crawler.login(async () => {
                    return Promise.resolve({ login, password });
                });
            });
        });
    }

    start(port) {
        this.server.listen(port || 3000);
    }
}

module.exports = Dashboard;