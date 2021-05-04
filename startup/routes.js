const express = require('express');
const home = require('../routes/home');
const players = require('../routes/players');
const scores = require('../routes/scores');
const auth = require('../routes/auth');

module.exports = function(app) {
    app.use(express.json());
    app.use('/', home);
    app.use('/api/players', players);
    app.use('/api/scores', scores);
    app.use('/api/auth', auth);
}