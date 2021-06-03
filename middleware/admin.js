// Función intermedia que valida si un jugador tiene permisos de administrador
module.exports = function (req, res, next) {
    if (!req.player.isAdmin) return res.status(403).send('Access denied to the current resource.');

    next();
}