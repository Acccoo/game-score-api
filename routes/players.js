const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcrypt');
const Fawn = require('fawn');
const Joi = require('joi');
const { Player, validate } = require('../models/player');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validator = require('../middleware/validator');
const validateObjectId = require('../middleware/validateObjectId');

// Registro de un nuevo jugador
router.post('/', validator(validate), async (req, res) => {
    // Comprobar que el usuario no está ya registrado
    let player = await Player.findOne({ email: req.body.email });
    if (player) return res.status(400).send(error.details[0].message);

    // Guardar el nuevo usuario en la base de datos
    player = new Player(_.pick(req.body, ['email', 'password', 'gameTime', 'dateCre']));

    // Generar contraseña con hash y bcrypt
    const salt = await bcrypt.genSalt(20);
    player.password = await bcrypt.hash(player.password, salt);

    try{
        // Nueva transacción para guardar el jugador en la base de datos
        new Fawn.Task().save('players', player).run();

        // Cuando un usuario nuevo se registra, podemos generar el token de autenticación
        // para que no tenga que iniciar sesión justo después
        const token = player.generateToken();

        // Construir el objeto que se devuelve al cliente
        res.status(201).header('x-auth-token', token).send(_.pick(player, ['email', 'gameTime', 'dateCre']));
    } catch (ex) {
        res.status(500).send('Something failed when creating the new player');
    }
});

// Cambio de contraseña
router.patch('/me', [auth, validator(validatePassword)], async (req, res) => {
    // Obtener el jugador de la request
    const player = await Player.findByIdAndUpdate(req.player._id, { 
        password: req.player.password,
        dateUpdate: Date.now
    }, { new: true });
    if(!player) return notFound(res);

    // Enviar al usuario los datos del jugador modificado
    res.status(200).send(_.pick(player, ['email', 'dateUpdate']));
});

// Eliminar un jugador (solo admin)
router.delete('/:playerId', [auth, admin, validateObjectId], async (req, res) => {
    const player = await Player.findByIdAndRemove(req.params.playerId);
    if (!player) return notFound(res);

    res.status(204).send();
});

function validatePassword(body) {
    const schema = Joi.object({
        password: Joi.string().minLength(8).maxlength(50).required()
    });

    return schema.validate(body);
}

function notFound(response) {
    response.status(404).send('The player with the given ID was not found');
}

module.exports = router;