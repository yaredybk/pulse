const express = require('express');
const info = require('../controllers/info.js');

const apiRoutes = express.Router();

// root path /api
apiRoutes.route('/info/me').get(info.me);

module.exports = apiRoutes;
