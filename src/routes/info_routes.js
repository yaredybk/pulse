const express = require('express');

const fileUpload = require('express-fileupload');
const info = require('../controllers/info.js');
const { requiresAuth } = require('express-openid-connect');
const { _db } = require('../../utils/db.js');

const apiRoutes = express.Router();

// root path /api/info

apiRoutes
  .route('/me')
  .get(info.me)
  .post(
    fileUpload({
      abortOnLimit: true,
      limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB (optional)
      // useTempFiles: true, // Enable temporary file storage (optional)
    }),
    info.editMe,
  );
apiRoutes.route('/user/:uuid').get(info.user);
apiRoutes
  .route('/room')
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
  .route('/room/:idroom')
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
  .route('/room/:idroom/members')
  .get(info.roomMembers)
  .post(info.addRoomMembers)
  // .delete(info.deleteRoomMembers);

// apiRoutes.route('/user/:uuid').get(info.user);

module.exports = apiRoutes;
