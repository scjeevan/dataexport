var schedule = require('node-schedule');
var mysql = require("mysql");
var fs = require("file-system");

var date = new Date();

var j = schedule.scheduleJob('0 * * * * *', function(){
	console.log('Data Export Job Runs at ' + date);
});