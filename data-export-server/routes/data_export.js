var mysql = require("mysql");
var fs = require("file-system");
var Client = require('ssh2').Client;
var csvWriter = require('csv-write-stream');
var writer = csvWriter();

var gcloud = require('gcloud')({
	projectId: process.env.DATAEXPORT_GQ_PROJECT_ID,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});
var bigquery = gcloud.bigquery({
	projectId: process.env.DATAEXPORT_GQ_PROJECT_ID,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var conn = new Client();
var connectionProperties = {};
var ftl_loc = "";

function saveDateRemort(file_name, headers, rows, callback) {
	var act_file = process.env.DATAEXPORT_CSV_SAVE_PATH + file_name;
	var writer = csvWriter({ 
		headers: headers,
		separator: ',',
		newline: '\n',
		sendHeaders: true
	});
	writer.pipe(fs.createWriteStream( act_file ));
	var resultRow = [];
	rows.forEach(function (row) {
		if (row != null) {
			var rowData = [];
			headers.forEach(function (header) {
				rowData.push(row[header]);
			});
			resultRow.push(rowData);
			writer.write(rowData);
			//console.log("ROW - " + JSON.stringify(row));
			//console.log("ROW_DATA - " + JSON.stringify(rowData));
		}
	});
	//console.log("FULL - " + JSON.stringify(resultRow));
	//writer.write(resultRow);
	writer.end();
				
	console.log('act_file : '+act_file);
	//var ftl_loc = process.env.DATAEXPORT_FTP_LOCATION;
	console.log('ftl_loc : '+ftl_loc);
	conn.connect(connectionProperties);

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
			var writeStream = sftp.createWriteStream(ftl_loc + file_name);
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
	callback("SUCCESS");
}

var exportDataMng = {
	
	exportData: function (req, res) {
		
		var query = "";
		var params = [];
		
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [ftp_account_id];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				console.log("title : " + rows[0].title+", ip : " + rows[0].ip);
				ftl_loc = rows[0].location;
				connectionProperties = {
					host: rows[0].ip,
					user: rows[0].username,
					port: rows[0].port,
					password: rows[0].password
				};
			}
		});
		
		var _query = "SELECT ";
		var headers = [];
		for (var i in req.body.columns) {
			_query += req.body.columns[i] + ",";
			headers.push(req.body.columns[i]);
		}
		_query = _query.substring(0, _query.length - 1);
		var start = req.body.startDate.replace(/T/, ' ').replace(/\..+/, '');
		var end = req.body.endDate.replace(/T/, ' ').replace(/\..+/, '');
		var file_name = req.body.table + "-" + Math.floor(new Date() / 1000) + ".csv";
		if(req.body.table == 'ip'){
			_query += " FROM diggit_hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"'";
			bigquery.query(_query, function(err,rows){
				if(err) console.log(err);
				saveDateRemort(file_name, headers, rows, function (result) {
					res.json({
						values: result
					});
				});
			});
		}
		else{
			var tableName = (req.body.table === 'title')?'mm_titles':'infohashes';
			_query += " FROM " + tableName + " WHERE added_time BETWEEN ? AND ?";
			console.log(_query);
			var _formatedQuery = mysql.format(_query, [start, end]);
			mysql_client.query(_formatedQuery, function (err, rows) {
				if(err) console.log(err);
				saveDateRemort(file_name, headers, rows, function (result) {
					res.json({
						values: result
					});
				});
			});
		}
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

