var express = require('express');
var router = express.Router();

var ftpDetailsManager = require('./ftp_accounts.js');
var dataExportManager = require('./data_export.js');
//var schedular = require('./schedular.js');
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
router.get('/api/listftpaccounts', ftpDetailsManager.listFtpAccounts);
router.post('/api/saveftpaccount', ftpDetailsManager.saveFtpAccount);
router.post('/api/deleteftpaccount', ftpDetailsManager.deleteFtpAccount);
router.post('/api/export', dataExportManager.exportData);
router.post('/api/exportsave', dataExportManager.exportAndSave);
router.post('/api/schedule', dataExportManager.scheduleExportData);
router.get('/api/genres', dataExportManager.genresList);
router.get('/api/getmovies', dataExportManager.getMovies);
router.get('/api/getgroups', dataExportManager.getGroups);
router.get('/api/getlocations', dataExportManager.getLocations);
router.get('/api/listjobs', dataExportManager.listJobs);
router.post('/api/filterData', dataExportManager.filterData);
router.post('/api/filterTitleData', dataExportManager.filterTitleData);

router.post('/api/continents', dataExportManager.continents);
router.post('/api/countries', dataExportManager.countries);
router.post('/api/regions', dataExportManager.regions);
router.post('/api/states', dataExportManager.states);
router.post('/api/cities', dataExportManager.cities);

router.post('/api/executejob', dataExportManager.executeJob);

module.exports = router;
