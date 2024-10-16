const express = require('express');
const info = require('../controllers/info.js');
const { requiresAuth } = require('express-openid-connect');

const apiRoutes = express.Router();

// root path /api
apiRoutes
  .route('/info/me')
  .get(requiresAuth(), info.me)
  .post(requiresAuth(), info.editMe);
apiRoutes.route('/info/user/:uuid').get(requiresAuth(), info.user);
// apiRoutes.route('/info/user/:uuid').get(info.user);

module.exports = apiRoutes;
