const express = require('express');
const list = require('../controllers/list.js');

const listRoutes = express.Router();

// root path /api/list/
listRoutes.route('/chat/:category').get(list.chat_nav);
listRoutes.route('/chat/:category/:uuid').get(list.chat_content);
listRoutes.route('/contact/:category').get(list.contacts_nav);

module.exports = listRoutes;
