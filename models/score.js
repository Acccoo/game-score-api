const Joi = require('joi');
const mongoose = require('mongoose');

// Esquema que debe seguir el campo player en la colección Score
const playerSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Types.ObjectId,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        minLength: 6
    },
    nickname: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10,
        minlength: 3
    }
});

// Esquema que debe seguir nuestra colección Score en la base de datos
const scoreSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 10
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 999999999
    },
    mode: {
        type: String,
        required: true,
        enum: ['easy', 'normal', 'hard', 'lunatic'],    // Elegir entre un elemento del array
        lowercase: true,
        trim: true
    },
    dateCre: {
        type: Date,
        required: true,
        default: Date.now
    },
    dateUpdate: {
        type: Date
    },
    player: {
        type: playerSchema,
        required: true
    }
});

const Score = mongoose.model('Score', scoreSchema);

// Validar un score (usualmente recibido por parte del cliente)
function validateScore(score) {
    const schema = Joi.object({
        author: Joi.string().min(3).max(10).required(),
        score: Joi.number().integer().min(0).max(999999999).required(),
        mode: Joi.string().valid('easy', 'normal', 'hard', 'lunatic').required()
    });

    return schema.validate(score);
}

exports.Score = Score;
exports.validate = validateScore;