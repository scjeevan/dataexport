var schedule = require('node-schedule');
var mysql = require("mysql");
var fs = require("file-system");



var j = schedule.scheduleJob('0 * * * * *', function(){
	var date = new Date();

	var month = date.getMonth() + 1;
	var day  = date.getDate();
	var weekDay = date.getDay();

	console.log('Data Export Job Runnig at ' + date);
	printVal("WORKING");
	if((month == 1 || month == 5 || month == 9) && day == 1){
		
	}
	else if(day == 1){
		
	}
	else if(weekDay == 1){
		
	}
	console.log('Data Export Job Ended at ' + date);	
});