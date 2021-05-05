// Función intermedia que valida si un jugador tiene permisos de administrador
module.exports = function (req, res, next) {
    if (!req.user.isAdmin) return res.status(403).send('Access denied');

    next();
}