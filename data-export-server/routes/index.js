var express = require('express');
var router = express.Router();

var titles = require('./titles.js');
var auth = require('../middlewares/authService');

var TITLE_MAMAGEMENT_PRIVILEGE = 'TITLE MANAGEMENT';
var CONTENT_PRIVILEGE = 'CONTENT';

/*
 * Routes that can be accessed by any one
 */
router.get('/api/login', auth.checkAuthenticity());

/*
 * Routes that can be accessed only by autheticated users
 */

router.get('/api/searchtitlebyid', titles.searchTitleById); //auth.hasPrivilege(CONTENT_PRIVILEGE),
router.get('/api/searchtitle', titles.searchTitle);
router.post('/api/savetitledata', titles.saveTitleData); //auth.hasPrivilege(CONTENT_PRIVILEGE),


module.exports = router;
