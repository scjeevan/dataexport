var schedule = require('node-schedule');
var mysql = require("mysql");
var fs = require("file-system");

var j = schedule.scheduleJob('0 * * * *', function(){
	console.log('The answer to life, the universe, and everything!');
});