const express = require('express');
const router = express.Router();
const { Score, validate } = require('../models/score');
const validateObjectId = require('../middleware/validateObjectId');
const Fawn = require('fawn');
const _ = require('lodash');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validator = require('../middleware/validator');

// Obtener puntuaciones
router.get('/', async (req, res) => {
    const scores = await Score.find().sort('score');

    res.status(200).send(scores);
});

// Subir puntuación
router.post('/', [auth, validator(validate)], async (req, res) => {
    // Guardar la nueva puntuación en la base de datos
    let score = new Score(_.pick(req.body, ['score', 'author', 'mode']));
    score.date = Date.now;
    score.playerId = req.player._id;

    try {
        new Fawn.Task().save('scores', score).run();

        res.status(201).send(score);
    } catch (ex) {
        res.status(500).send('Something failed when uploading the score');
    }
});

// Modificar puntuación
router.patch('/:scoreId', [auth, admin, validateObjectId, validator(validate)], async (req, res) => {
    const score = await Score.findByIdAndUpdate(req.params.scoreId, {
        score: req.body.score,
        dateUpdate: Date.now
    }, { new: true });  // Devolver la puntuación después de ser actualizada
    if (!score) return notFound(res);
    
    // Enviar de vuelta la puntuación modificada
    res.status(200).send(_.pick(score, ['score', 'dateUpdate']));
});

// Eliminar puntuación
router.delete('/:scoreId', [auth, admin, validateObjectId], async(req, res) => {
    const score = await Score.findByIdAndRemove(req.params.scoreId);
    if (!score) return notFound(res);

    res.status(204).send();
});

function notFound(response) {
    response.status(404).send('The score with the given ID was not found');
}

module.exports = router;