const express = require('express');
const router = express.Router();
const Joi = require('joi');
const bcrypt = require('bcrypt');
const { Player } = require('../models/player');
const validator = require('../middleware/validator');

// Inicio de sesión
router.post('/players-login', validator(validate), async (req, res) => {
    // Comprobar que el usuario no está ya registrado
    let player = await Player.findOne({ email: req.body.email });
    if (!player) return res.status(400).send('Invalid email or password');

    // Validar la contraseña
    const validPassword = await bcrypt.compare(req.body.password, player.password);
    if (!validPassword) return res.status(400).send('Invalid email or password');

    // Generar el token de autenticación para la sesión actual
    const token = player.generateToken();
    res.status(200).send(token);
});

// Cierre de sesión
router.post('/players-logout', async (req, res) => {
    res.status(204).send();
});

function validate(object) {
    const schema = Joi.object({
        email:  Joi.string().minLength(6).maxlength(100).required().email(),
        password: Joi.string().minLength(8).maxlength(50).required()
    });

    return schema.validate(object);
}

module.exports = router;