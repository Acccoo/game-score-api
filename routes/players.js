const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Fawn = require('fawn');
const Joi = require('joi');
const { Player, validate } = require('../models/player');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validator = require('../middleware/validator');
const validateObjectId = require('../middleware/validateObjectId');

// Inicializar Fawn
Fawn.init(mongoose);

// CREAR GET ALL Y GET/:ID

// Registro de un nuevo jugador
router.post('/', validator(validate), async (req, res) => {
    // Comprobar que el usuario no está ya registrado
    let player = await Player.findOne({ email: req.body.email }).exec();
    if (player) return res.status(409).send('Email already in use');

    // Guardar el nuevo usuario en la base de datos
    player = new Player(_.pick(req.body, ['email', 'password', 'gameTime']));

    // Generar contraseña con hash y bcrypt
    const salt = await bcrypt.genSalt();
    player.password = await bcrypt.hash(player.password, salt);

    try{
        // Nueva transacción para guardar el jugador en la base de datos
        new Fawn.Task().save('players', player).run();

        // Cuando un usuario nuevo se registra, podemos generar el token de autenticación
        // para que no tenga que iniciar sesión justo después
        const token = player.generateToken();

        // Construir el objeto que se devuelve al cliente
        res.status(201).header('x-auth-token', token).send(_.pick(player, ['_id, email', 'gameTime', 'dateCre']));
    } catch (ex) {
        res.status(500).send('Something failed when creating the new player');
    }
});

// Aumento de tiempo de juego
router.patch('/me', [auth, validator(validateGameTime)], async (req, res) => {
    // Obtener el jugador de la request
    const player = await Player.findById(req.player._id)
    if(!player) return notFound(res);

    player.gameTime += req.body.gameTime;
    const playerUpdate = await Player.findByIdAndUpdate(player._id, {
        gameTime: player.gameTime,
        dateUpdate: Date.now
    }, { new: true });

    // Enviar al usuario los datos del jugador modificado
    res.status(200).send(_.pick(playerUpdate, ['email', 'gameTime', 'dateUpdate']));
});

// Eliminar un jugador (solo admin)
router.delete('/:playerId', [auth, admin, validateObjectId], async (req, res) => {
    const player = await Player.findByIdAndRemove(req.params.playerId);
    if (!player) return notFound(res);

    res.status(204).send();
});

function validateGameTime(body) {
    const schema = Joi.object({
        gameTime: Joi.number().integer().min(0).required()
    });

    return schema.validate(body);
}

function notFound(response) {
    response.status(404).send('The player with the given ID was not found');
}

module.exports = router;