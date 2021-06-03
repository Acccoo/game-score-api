const request = require('supertest');
const { Score } = require('../../models/score');
const { Player } = require('../../models/player');
const mongoose = require('mongoose');
const _ = require('lodash');

const baseRoute = '/api/scores';
let server;

describe('/api/scores', () => {
    let token;

    let player = {
        _id: mongoose.Types.ObjectId(),
        email: 'scores@test.com',
        nickname: 'scoresAAA'
    };

    const createPlayer = function(value) {
        return new Player({
            email: 'score@testing.com', 
            password: 'nananananana', 
            gameTime: 0,
            isAdmin: value 
        });
    }

    const createToken = function(value) {
        token = createPlayer(value).generateToken();
    }

    beforeEach((next) => {
        server = require('../../index');

        next();
    });

    afterEach(async (next) => {
        await server.close();
        await Score.deleteMany({});

        next();
    });

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get(baseRoute);
        }

        it('should return all scores located in the database', async (done) => {
            await Score.collection.insertMany([
                { score: 1238, author: 'Robert', mode: 'normal' },
                { score: 1123, author: 'Marc', mode: 'easy' }
            ]);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(s => s.author === 'Robert')).toBeTruthy();
            expect(res.body.some(s => s.author === 'Marc')).toBeTruthy();

            done();
        });
    });

    describe('GET /:scoreId', () => {
        let score = {
            score: 12345,
            author: 'get:id',
            mode: 'easy',
            player: player
        };

        const exec = async (id = score._id) => {
            return await request(server)
                .get(baseRoute + '/' + id);
        }

        beforeEach(async () => {
            score = new Score(_.pick(score, ['score', 'author', 'mode', 'player']));
            await score.save();
        });

        it('should return the score if the given id is valid', async (done) => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('score', score.score);
            expect(res.body).toHaveProperty('author', score.author);
            expect(res.body).toHaveProperty('mode', score.mode);

            done();
        });

        it('should return bad request if the given id is not valid', async (done) => {
            const res = await exec('123');

            expect(res.status).toBe(400);

            done();
        });

        it('should return not found if the given id does not exists in the databse', async (done) => {
            const res = await exec('6092b2d9c00ea81b94a90770');

            expect(res.status).toBe(404);

            done();
        });
    });

    describe('POST /', () => {
        let score;

        const exec = async () => {
            return await request(server)
                .post(baseRoute)
                .set('x-auth-token', token)
                .send(_.pick(score, ['score', 'author', 'mode']));
        }

        beforeEach(() => {
            score = {
                score: 12345,
                author: 'post',
                mode: 'normal',
                player: {
                    _id: player._id,
                    email: player.email,
                    nickname: 'noname'
                }
            };
            createToken(true);
        });

        it('should return the created score', async (done) => {
            const res = await exec();

            expect(res.status).toBe(201);

            done();
        });
        
        it('should return bad request when any property is not valid', async (done) => {
            score.mode = 'nan';
            let res = await exec();

            expect(res.status).toBe(400);

            score.author = 'a';
            res = await exec();

            expect(res.status).toBe(400);

            score.score = -123;
            res = await exec();

            expect(res.status).toBe(400);

            score.player = null;
            res = await exec();

            expect(res.status).toBe(400);

            res = await exec();

            expect(res.status).toBe(400);

            token = '123';
            res = await exec();

            expect(res.status).toBe(400);

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';
            const res = await exec();

            expect(res.status).toBe(401);

            done();
        });
    });

    describe('PATCH /:scoreId', () => {
        let score = {
            score: 0,
            author: 'patch',
            mode: 'hard',
            player: player
        };

        let points = {
            score: 123
        };

        const exec = async (id = score._id) => {
            return await request(server)
                .patch(baseRoute + '/' + id)
                .set('x-auth-token', token)
                .send(points);
        }

        beforeEach(async () => {
            points.score = 123;
            score = new Score(_.pick(score, ['score', 'author', 'mode', 'player']));
            await score.save();
            createToken(true);
        });

        it('should return the score object with the given score', async (done) => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('score', points.score);
            expect(res.body).toHaveProperty('author', score.author);
            expect(res.body).toHaveProperty('mode', score.mode);
            expect(res.body).toHaveProperty('dateUpdate');

            done();
        });

        it('should return bad request if any property is not valid', async (done) => {
            // Probar un id no válido
            let res = await exec('123');

            expect(res.status).toBe(400);

            // Probar un score no válido
            points.score = -234
            res = await exec();

            expect(res.status).toBe(400);

            done();
        });

        it('should return bad request if given token is not valid', async (done) => {
            token = '1234';
            const res = await exec();

            expect(res.status).toBe(400);

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';
            const res = await exec();

            expect(res.status).toBe(401);

            done();
        });

        it('should return forbidden if current user does not have administrator permissions', async (done) => {
            createToken(false);
            const res = await exec();

            expect(res.status).toBe(403);

            done();
        });

        it('should return not found if cannot retrieve the score with the given id', async (done) => {
            const res = await exec('6093afa6018c250bec3dd5e0');

            expect(res.status).toBe(404);
            
            done();
        });
    });

    describe('DELETE /:scoreId', () => {
        let score = {
            score: 1,
            author: 'delete',
            mode: 'lunatic',
            player: player
        };

        const exec = async (id = score._id) => {
            return await request(server)
                .delete(baseRoute + '/' + id)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            score = new Score(_.pick(score, ['score', 'author', 'mode', 'player']));
            await score.save();
            createToken(true);
        });

        it('should return no content response if the score was removed successfully', async (done) => {
            const res = await exec();

            expect(res.status).toBe(204);

            done();
        });

        it('should return bad request if given id is not valid', async (done) => {
            const res = await exec('123');

            expect(res.status).toBe(400);

            done();
        });

        it('should return bad request if given token is not valid', async (done) => {
            token = '123';
            const res = await exec();

            expect(res.status).toBe(400);

            done();
        });

        it('should return unauthorized if user is not logged in', async (done) => {
            token = '';
            const res = await exec();

            expect(res.status).toBe(401);

            done();
        });

        it('should return forbidden if current user does not have administrator permissions', async (done) => {
            createToken(false);
            const res = await exec();

            expect(res.status).toBe(403);
            
            done();
        });

        it('should return not found if the score with the given id does not exist', async (done) => {
            const res = await exec('6093afa6018c250bec3dd5e0');

            expect(res.status).toBe(404);

            done();
        });
    });
});