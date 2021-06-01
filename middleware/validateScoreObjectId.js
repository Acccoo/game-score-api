const mongoose = require('mongoose');

// Esta función se pasará para validar los objectId que se envían a nuestra API
module.exports = function(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.scoreId)){
        console.log(req.params)
        return res.status(400).send('Invalid id.');
    }

    next();
}