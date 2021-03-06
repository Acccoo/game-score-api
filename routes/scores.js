const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Joi = require('joi');
const { Score, validate } = require('../models/score');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validator = require('../middleware/validator');
const validateObjectId = require('../middleware/validateScoreObjectId');

// Obtener puntuaciones
router.get('/', async (req, res) => {
    const scores = await Score.find().sort({'score': -1});
    const scoresResponse = [];

    scores.forEach(item => {
        item = _.pick(item, ['_id', 'author', 'score', 'mode']);
        scoresResponse.push(item);
    });

    res.status(200).send(scoresResponse);
});

// Obtener puntuación por id
router.get('/:scoreId', validateObjectId, async (req, res) => {
    const score = await Score.findById(req.params.scoreId);
    if (!score) return notFound(res);

    res.status(200).send(_.pick(score, ['_id', 'author', 'score', 'mode', 'dateCre']));
});

// Subir puntuación
router.post('/', [auth, validator(validate)], async (req, res) => {
    // Guardar la nueva puntuación en la base de datos
    let score = new Score(_.pick(req.body, ['score', 'author', 'mode']));

    // Completar los datos del score
    score.date = Date.now();
    score.player ={
        _id: req.player._id,
        email: req.player.email,
        nickname: score.author
    }

    await score.save();

    res.status(201).send(_.pick(score, ['_id', 'author', 'score', 'mode', 'dateCre']));
});

// Modificar puntuación
router.patch('/:scoreId', [auth, admin, validateObjectId, validator(validateScorePoints)], async (req, res) => {
    const score = await Score.findByIdAndUpdate(req.params.scoreId, {
        score: req.body.score,
        dateUpdate: Date.now()
    }, { new: true });  // Devolver la puntuación después de ser actualizada
    if (!score) return notFound(res);
    
    // Enviar de vuelta la puntuación modificada
    res.status(200).send(_.pick(score, ['_id', 'author', 'score', 'mode', 'dateUpdate']));
});

// Eliminar puntuación
router.delete('/:scoreId', [auth, admin, validateObjectId], async(req, res) => {
    const score = await Score.findByIdAndRemove(req.params.scoreId);
    if (!score) return notFound(res);

    res.status(204).send();
});

function validateScorePoints(body) {
    const schema = Joi.object({
        score: Joi.number().integer().min(0).max(999999999).required()
    });

    return schema.validate(body);
}

function notFound(response) {
    response.status(404).send('The score with the given ID was not found.');
}

module.exports = router;