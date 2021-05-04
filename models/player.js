const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');

// Esquema que debe seguir nuestra colección Player en la base de datos
const playerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100,
        minLength: 6
    },
    nickname: {
        type: String,
        trim: true,
        maxlength: 10,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        maxlength: 50,
        minlength: 8
    },
    gameTime: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    isAdmin:{
        type: Boolean,
        required: true,
        default: false
    },
    dateCre: {
        type: Date,
        required: true,
        default: Date.now
    },
    dateUpdate: {
        type: Date
    }
});

// Función para crear un token de autenticación
playerSchema.methods.generateToken = function() {
    return jwt.sign({ 
        _id: this._id, 
        email: this.email, 
        isAdmin: this.isAdmin 
    }, config.get('jwtPrivateKey'));
}

const Player = mongoose.model('Player', playerSchema);

// Validar un jugador
function validatePlayer(player) {
    const schema = Joi.object({
        email: Joi.string().minLength(6).maxlength(100).required().email(),
        password: Joi.string().minLength(8).maxlength(50).required(),
        gameTime: Joi.number().integer().min(0).required()
    });

    return schema.validate(player);
}

exports.Player = Player;
exports.validate = validatePlayer;