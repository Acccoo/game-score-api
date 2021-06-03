const request = require('supertest');
const { Player } = require('../../models/player');
const _ = require('lodash');

const baseRoute = '/api/players'
let server;

describe('/api/players', () => {
    let token;

    const createToken = function(value) {
        token = new Player({ isAdmin: value }).generateToken();
    }

    beforeEach((next) => {
        server = require('../../index');

        next();
    });

    afterEach(async (next) => {
        await server.close();
        await Player.deleteMany({});

        next();
    });

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get(baseRoute)
                .set('x-auth-token', token);
        }

        beforeEach(() => {
            createToken(true);
        });

        it('should return all players if token is valid', async (done) => {
            await Player.collection.insertMany([
                { email: 'getAll@test.com', password: 'nananana', gameTime: 0 },
                { email: 'getAll2@test.com', password: 'nananana', gameTime: 0 }
            ]);

            const res = await exec();

            try {
                expect(res.status).toBe(200);
                expect(res.body.length).toBe(2);
                expect(res.body.some(p => p.email === 'getAll@test.com')).toBeTruthy();
                expect(res.body.some(p => p.email === 'getAll2@test.com')).toBeTruthy();
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if the provided token is not valid', async (done) => {
            token = '24324ñkkmkdskpadñae';

            const res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';

            const res = await exec();

            try {
                expect(res.status).toBe(401);
            } catch (err) {
                done(err);
            }

            done();
        });
    });

    describe('GET /:playerId', () => {
        let player;

        const exec = async (id = player._id) => {
            return await request(server)
                .get(baseRoute + '/' + id)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            createToken(true);

            player = new Player({ email: 'prueba@test.com', password: 'nananana', gameTime: 0 });
            await player.save();
        });

        it('should return the player if a valid id is passed', async (done) => {
            const res = await exec();

            try {
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('email', player.email);
                expect(res.body).toHaveProperty('gameTime', player.gameTime);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if the provided id is not valid', async (done) => {
            const res = await exec('10hd9w823jd35d32');

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if the provided token is not valid', async (done) => {
            token = 'urpweiruwelkjdkmdnadlkan';
            const res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';
            const res = await exec();
            
            try {
                expect(res.status).toBe(401);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return forbidden if user does not have permission to access this recourse', async (done) => {
            createToken(false);
            const res = await exec();

            try {
                expect(res.status).toBe(403);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return not found if the player with the given id does not exist', async (done) => {
            const res = await exec('6092b2d9c00ea81b94a90770');

            try {
                expect(res.status).toBe(404);
            } catch (err) {
                done(err);
            }

            done();
        });
    });

    describe('POST /', () => {
        let player;

        const exec = async() => {
            return await request(server)
                .post(baseRoute)
                .send(player);
        }

        beforeEach(() => {
            player = {
                email: 'post@test.com',
                password: 'nananananana',
                gameTime: 0
            }
        });

        it('should return the created player and the authentication token if all properties are valid', async (done) => {
            const res = await exec();

            try {
                expect(res.status).toBe(201);
                expect(res.body).toHaveProperty('email', player.email);
                expect(res.body).toHaveProperty('gameTime', player.gameTime);
                expect(res.header).toHaveProperty('x-auth-token');
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad parameters when any property is not valid', async (done) => {
            player.email = 'novalid';
            let res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            player.email = 'post@test.com';
            player.password = 'nana';
            res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            player.password = 'nananananana';
            player.gameTime = -123;
            res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return conflict when the provided email already exists in the database', async (done) => {
            const entity = new Player(player);
            await entity.save();
            const res = await exec();

            try {
                expect(res.status).toBe(409);
            } catch (err) {
                done(err);
            }

            done();
        });
    });

    describe('PATCH /me', () => {
        let player = {
            email: 'patch@test.com',
            password: 'nanananananana',
            gameTime: 10
        };

        let gameTime = {
            gameTime: 0
        };

        const exec = async () => {
            return await request(server)
                .patch(baseRoute + '/me')
                .set('x-auth-token', token)
                .send(gameTime);
        }

        beforeEach(async () => {
            gameTime.gameTime = 0;
            player = new Player(_.pick(player, ['email', 'password', 'gameTime']));
            await player.save();
            token = player.generateToken();
        });

        it('should return the updated gameTime of the current user especified by token', async (done) => {
            gameTime.gameTime = 12345
            const res = await exec();

            try {
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('gameTime', player.gameTime + gameTime.gameTime);
                expect(res.body).toHaveProperty('email', player.email);
                expect(res.body).toHaveProperty('dateUpdate');
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if gameTime is not valid', async (done) => {
            gameTime.gameTime = -23;
            const res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if the provided token is not valid', async (done) => {
            token = '2342342f'
            const res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return unauthorized if player is not logged in', async (done) => {
            token = '';
            const res = await exec();

            try {
                expect(res.status).toBe(401);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return not found if the token contains an identifier that does not exist', async (done) => {
            createToken(false);
            const res = await exec();

            try {
                expect(res.status).toBe(404);
            } catch (err) {
                done(err);
            }

            done();
        }); 
    });

    describe('DELETE /:playerId', () => {
        let player = {
            email: 'delete@test.com',
            password: 'nanananana',
            gameTime: 0
        };

        const exec = async (id = player._id) => {
            return await request(server)
                .delete(baseRoute + '/' + id)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            player = new Player(_.pick(player, ['email', 'password', 'gameTime']));
            await player.save();
            createToken(true);
        });

        it('should return no content response if the player was removed successfully', async (done) => {
            const res = await exec();

            try {
                expect(res.status).toBe(204);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if identifier of the player is not valid', async (done) => {
            const res = await exec('123');

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return bad request if given token is not valid', async (done) => {
            token = '1234';
            const res = await exec();

            try {
                expect(res.status).toBe(400);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';
            const res = await exec();

            try {
                expect(res.status).toBe(401);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return forbidden if user does not have administrator permissions', async (done) => {
            createToken(false);
            const res = await exec();

            try {
                expect(res.status).toBe(403);
            } catch (err) {
                done(err);
            }

            done();
        });

        it('should return not found if the player with the given id does not exist', async (done) => {
            const res = await exec('6092b2d9c00ea81b94a90770');

            try {
                expect(res.status).toBe(404);
            } catch (err) {
                done(err);
            }

            done();
        });
    });
});