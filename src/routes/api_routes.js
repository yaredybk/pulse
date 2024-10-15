const express = require('express');
const info = require('../controllers/info.js');
const {requiresAuth} = require('express-openid-connect');

const apiRoutes = express.Router();

// root path /api
apiRoutes.route('/info/me').get(info.me);
apiRoutes.route('/info/user/:uuid').get(requiresAuth());
apiRoutes.route('/info/user/:uuid').get(info.user);

module.exports = apiRoutes;
