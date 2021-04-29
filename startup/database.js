const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
    const db = config.get('db');

    // Algunos cambios en propiedades que quedarán deprecadas
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('useFindAndModify', false);

    mongoose.connect(db);
}