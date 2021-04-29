const Joi = require('joi');
const mongoose = require('mongoose');

// Esquema que debe seguir el campo player en la colección Score
const playerSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    player: {
        type: playerSchema,
        required: true
    }
});

// Validar un score
function validateScore(score) {
    const schema = Joi.object({
        author: Joi.string().minLength(3).maxlength(10).required(),
        score: Joi.number().integer().min(0).max(999999999).required(),
        mode: Joi.string().required(),
        date: Joi.date().required(),
        playerId: Joi.objectId().required()
    });

    return schema.validate(score);
}

const Score = mongoose.model('Score', scoreSchema);

exports.Score = Score;
exports.validate = validateScore;