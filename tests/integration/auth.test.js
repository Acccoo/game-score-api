const request = require('supertest');
const { Player } = require('../../models/player');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const baseRoute = '/api/auth/';
let server;

describe('/api/auth', () => {
    const password = 'nananana';
    let player = {
        email: 'auth@test.com',
        password: password,
        gameTime: 0
    };

    const encryptPassword = async function(pass) {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(pass, salt);
    }

    beforeEach(async (next) => {
        server = require('../../index');
        player.password = await encryptPassword(player.password);
        player = new Player(_.pick(player, ['email', 'password', 'gameTime']));
        await player.save();

        next();
    });

    afterEach(async (next) => {
        await server.close();
        await Player.deleteMany({});

        next();
    });

    describe('POST /players-login', () => {
        let body = {
            email: player.email,
            password: password
        };

        const exec = async () => {
            return await request(server)
                .post(baseRoute + 'players-login')
                .send(body);
        }

        beforeEach(() => {
            body.email = player.email;
            body.password = 'nananana';
        });
        
        it('should return a valid token if login data is correct', async (done) => {
            const res = await exec();
            const token = res.text;
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            try {
                expect(res.status).toBe(200);
                expect(decoded.email).toMatch(player.email);
                expect(decoded.isAdmin).toBeFalsy();
            } catch (err) {
                done(err);
            }

            done();
        });

        it('return invalid email or password if any of these is not valid', async (done) => {
            body.password = 'a';
            let res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            body.email = 'not';
            res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('return invalid email or password if any of these does not match with the player ones', async (done) => {
            body.password = 'nananana';
            let res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            body.email = 'testing@fsm.com';
            res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });
    });

    describe('POST /players-logout', () => {
        it('should return no content response always', async (done) => {
            const res = await request(server).post(baseRoute + 'players-logout');

            try {
                expect(res.status).toBe(204);
            } catch (err) {
                done(err);
            }

            done();
        });
    });
});