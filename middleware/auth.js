const jwt = require('jsonwebtoken');
const config = require('config');

// Función para validar el token recibido en determinados endpoints
module.exports = function (req, res, next) {
    // Comprobar que existe token en la cabecera x-auth-token
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied: no token provided');

    try{
        // Si el token el válido, verify lo devuelve como un payload decodificado
        // En caso contrario, lanza una excepción
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.player = decoded;

        next();
    } catch (ex) {
        res.status(400).send('Invalid token');
    }
}