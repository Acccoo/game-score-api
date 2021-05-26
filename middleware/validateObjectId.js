const mongoose = require('mongoose');

// Esta función se pasará para validar los objectId que se envían a nuestra API
module.exports = function(req, res, next) {
    // Ya sabemos que el identificador se encuentra como primer parámetro de la petición, aunque tenga un nombre diferente
    if (!mongoose.Types.ObjectId.isValid(req.params[0])){
        return res.status(404).send('Invalid id.');
    }

    next();
}