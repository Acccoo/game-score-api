const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Here will be some text');
});

module.exports = router;