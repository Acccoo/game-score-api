const express = require('express');
const router = express.Router();
const { Player, validate } = require('../models/player');
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const Fawn = require('fawn');
const Joi = require('joi');
const auth = require('../middleware/auth');

// Registro de un nuevo jugador
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

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
router.patch('/me', auth, async (req, res) => {
    const { error } = validatePassword(req.body.password);
    if (error) return res.status(400).send(error.details[0].message);
    
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
router.delete('/:playerId', /* validateObjectId, */ async (req, res) => {
    const player = await Player.findByIdAndRemove(req.params.playerId);
    if (!player) return notFound(res);

    res.status(204).send();
});

function validatePassword(pass) {
    const schema = Joi.object({
        password: Joi.string().minLength(8).maxlength(50).required()
    });

    return schema.validate(pass);
}

function notFound(response) {
    response.status(404).send('The player with the given ID was not found');
}

module.exports = router;