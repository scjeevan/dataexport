var express = require('express');
var router = express.Router();

var test = require('./dbtest.js');
var ftpDetailsManager = require('./ftp_accounts.js');
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
router.get('/api/test', test.testDB); //auth.hasPrivilege(CONTENT_PRIVILEGE),
router.get('/api/listftpaccounts', ftpDetailsManager.listFtpAccounts); //auth.hasPrivilege(CONTENT_PRIVILEGE),

module.exports = router;
