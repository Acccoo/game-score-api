const express = require('express');
const app = express();

require('./startup/validation')();
require('./startup/database')();
require('./startup/routes')(app);

const port = process.env.PORT || 3000;
