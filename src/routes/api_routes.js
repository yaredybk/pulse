const express = require('express');

const fileUpload = require('express-fileupload');
const info = require('../controllers/info.js');
const { requiresAuth } = require('express-openid-connect');
const { _db } = require('../../utils/db.js');

const apiRoutes = express.Router();

// root path /api

apiRoutes
  .route('/info/me')
  .get(info.me)
  .post(
    fileUpload({
      abortOnLimit: true,
      limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB (optional)
      // useTempFiles: true, // Enable temporary file storage (optional)
    }),
    info.editMe,
  );
apiRoutes.route('/info/user/:uuid').get(info.user);
apiRoutes
  .route('/info/room')
  // .get(info.me)
  .post(
    fileUpload({
      abortOnLimit: true,
      limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB (optional)
      // useTempFiles: true, // Enable temporary file storage (optional)
    }),
    info.newwRoom,
  );
apiRoutes
  .route('/info/room/:idroom')
  .get(info.room)
  .post(
    fileUpload({
      abortOnLimit: true,
      limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB (optional)
      // useTempFiles: true, // Enable temporary file storage (optional)
    }),
    info.editRoom,
  );
apiRoutes
  .route('/info/room/:idroom/members')
  .get(info.roomMembers)
  .post(info.addRoomMembers)
  // .delete(info.deleteRoomMembers);

// apiRoutes.route('/info/user/:uuid').get(info.user);

module.exports = apiRoutes;
