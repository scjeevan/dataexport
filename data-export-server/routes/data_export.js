var mysql = require("mysql");
var fs = require("file-system");
var Client = require('ssh2').Client;

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var conn = new Client();
var connectionProperties = {};

function saveDateRemort(fileName, data) {
	var act_file = process.env.DATAEXPORT_CSV_SAVE_PATH + fileName;
	console.log('act_file : '+act_file);
	var ftl_loc = process.env.DATAEXPORT_FTP_LOCATION;
	console.log('ftl_loc : '+ftl_loc);
	conn.connect(connectionProperties);
	fs.appendFile(act_file, data.join(','), function (err) {
		if (err) throw err;
		console.log('Saved!');
	});
	conn.on(
		'connect',
		function () {
			console.log( "- connected" );
		}
	);
	conn.on(
		'error',
		function (err) {
			console.log( "- connection error: %s", err );
			process.exit( 1 );
		}
	);
	 
	conn.on(
		'end',
		function () {
			console.log( "- finished" );
		}
	);
	conn.on('ready', function () {
		console.log( "- ready" );
		conn.sftp(function (err, sftp) {
			if (err) {
				console.log( "Error, problem starting SFTP: %s", err );
				process.exit( 2 );
			}
			console.log( "- SFTP started" );
			var readStream = fs.createReadStream(act_file);
			var writeStream = sftp.createWriteStream(ftl_loc + fileName);
			writeStream.on(
				'close',
				function () {
					console.log( "- file transferred" );
					sftp.end();
					process.exit( 0 );
				}
			);
			readStream.pipe( writeStream );
		});
	}); 
	console.log("END METHOD");
}

var exportDataMng = {
	
	exportData: function (req, res) {
		
		var query = "";
		var params = [];
		
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [ftp_account_id];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				console.log("title : " + rows[0].title+", ip : " + rows[0].ip);
				connectionProperties = {
					host: rows[0].ip,
					user: rows[0].username,
					port: rows[0].port,
					password: rows[0].password
				};
				
			}
		});
		
		var _query = "SELECT ";
		for (var i in req.body.columns) {
			_query += req.body.columns[i] + ",";
		}
		_query = _query.substring(0, _query.length - 1);
		_query += " FROM " + req.body.table + " WHERE added_time BETWEEN ? AND ?";
		var start = req.body.startDate.replace(/T/, ' ').replace(/\..+/, '');
		var end = req.body.endDate.replace(/T/, ' ').replace(/\..+/, '');
		var _formatedQuery = mysql.format(_query, [start, end]);
		mysql_client.query(_formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				var file_name = process.env.DATAEXPORT_CSV_SAVE_PATH + req.body.table + "-" + Math.floor(new Date() / 1000) + ".csv";
				var cols = req.body.columns;
				fs.appendFile(file_name, rows.join(','), function (err) {
				});
				/*
				res.json({
					values: rows
				});
				*/
				//saveDateRemort(file_name, rows);
			}
		});
	},
	
	scheduleExportData: function (req, res) {
		var query = "";
		var params = [];
		
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}		
		var _columns = "";
		for (var i in req.body.columns) {
			_columns += req.body.columns[i] + ",";
		}
		_columns = _columns.substring(0, _columns.length - 1);
		var _cron = "0 * * * * *";
		if(req.body.switch_3 == "weekly"){
			_cron = "0 0 0 * * 0";
		} else if(req.body.switch_3 == "monthly"){
			_cron = "0 0 0 1 * *";
		} else if(req.body.switch_3 == "quarterly"){
			_cron = "0 0 0 1 0/4 *";
		}
		var now = new Date();
		var _query = "INSERT INTO data_export_schedules (cron_expression,table_name,selected_columns,added_date,ftp_account_id) VALUES (?, ?, ?, ?, ?)";
		var _formatedQuery = mysql.format(_query, [_cron, req.body.table, _columns, now, ftp_account_id]);
		mysql_client.query(_formatedQuery, function (err, rows) {
			console.log("SAVED");
		});
		res.json({
            data: {
                "status": 'done'
            }
        });
	}
};

module.exports = exportDataMng;

