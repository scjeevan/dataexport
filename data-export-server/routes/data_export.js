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
	conn.connect(connectionProperties);
	//fs.appendFile(fileName, rows.join(','), function (err) { });
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
			process.exit( 0 );
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
			var readStream = fs.createReadStream('/home/jeevan/dataexport/dataexport/your-file.csv');
			var writeStream = sftp.createWriteStream('/dataexport_sftp/your-file2.csv');
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
				var file_name = req.body.table + "-" + Math.floor(new Date() / 1000) + ".csv";
				saveDateRemort(file_name, rows);
			}
		});
	}
};

module.exports = exportDataMng;

