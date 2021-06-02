const request = require('supertest');

let server;

describe('/', () => {
    beforeEach(() => {
        server = require('../../index');
    });
    
    afterEach(async () => {
        await server.close();
    });

    describe('GET /', () => {
        it('should return the standard message of the home page', async (done) => {
            const res = await request(server).get('/');

            expect(res.status).toBe(200);

            done();
        });
    });
});