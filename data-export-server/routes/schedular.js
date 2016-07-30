var schedule = require('node-schedule');
var mysql = require("mysql");
var fs = require("file-system");

var date = new Date();
var month = date.getMonth() + 1;

var day  = date.getDate();
day = (day < 10 ? "0" : "") + day;


var j = schedule.scheduleJob('0 * * * * *', function(){
	console.log('Data Export Job Runnig at ' + date);
	console.log('month : ' + month);
	console.log('day : ' + day);
	
});