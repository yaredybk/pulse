const express = require('express');

const fileUpload = require('express-fileupload');
const info = require('../controllers/info.js');
const { requiresAuth } = require('express-openid-connect');

const apiRoutes = express.Router();

// root path /api

apiRoutes
  .route('/info/me')
  .get(requiresAuth(), info.me)
  .post(
    requiresAuth(),
    fileUpload({
      abortOnLimit: true,
      limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB (optional)
      // useTempFiles: true, // Enable temporary file storage (optional)
    }),
    info.editMe,
  );
apiRoutes.route('/info/user/:uuid').get(requiresAuth(), info.user);
// apiRoutes.route('/info/user/:uuid').get(info.user);

module.exports = apiRoutes;
