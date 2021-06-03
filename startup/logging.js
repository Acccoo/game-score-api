const config = require('config');
const winston = require('winston');
// require('winston-mongodb');
require('express-async-errors');

module.exports = function() {
    // Controlar las excepciones que no han sido atrapadas
    winston.exceptions.handle(
        new winston.transports.File({
            filename: 'uncaughtedExceptions.log',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
                winston.format.json()
            )
        })
    );

    // Para las denegaciones sin capturar, se lanza una excepción
    // la cual será recogida por el manejador de excepciones anterior
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    // Log por consola
    winston.add(
        new winston.transports.Console(
            { format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.simple(),
                winston.format.padLevels()
            )}
        )
    );

    // Log por fichero
    winston.add(
        new winston.transports.File({
            filename: 'logFile.log',
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
                winston.format.json()
            )
        })
    );

    // Log por base de datos
    // winston.add(
    //     new winston.transports.MongoDB({
    //         db: config.get('db'),
    //         level: 'info',
    //         timestamp: false
    //     })
    // );
}