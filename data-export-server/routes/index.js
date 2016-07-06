var express = require('express');
var router = express.Router();

var test = require('./dbtest.js');
var testftp = require('./ftptest.js');
var ftpDetailsManager = require('./ftp_accounts.js');
var dataExportManager = require('./data_export.js');
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
router.get('/api/testftp', testftp.testFTP); //auth.hasPrivilege(CONTENT_PRIVILEGE),
router.get('/api/listftpaccounts', ftpDetailsManager.listFtpAccounts);
router.post('/api/saveftpaccount', ftpDetailsManager.saveFtpAccount);
router.post('/api/export', dataExportManager.exportData);

module.exports = router;
