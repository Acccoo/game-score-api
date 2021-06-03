const { Player } = require('../../models/player');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');

describe('auth middleware', () => {
    it('should populate req.player with the payload of a valid jwt', () => {
        const player = {
            _id: mongoose.Types.ObjectId().toHexString(),
            email: 'unittest@test.com',
            isAdmin: false
        };
        const token = new Player(player).generateToken();
        const req = {
            header: jest.fn().mockReturnValue(token)
        };
        const next = jest.fn();
        const res = {};

        auth(req, res, next);

        expect(req.player).toMatchObject(player);
    });
});