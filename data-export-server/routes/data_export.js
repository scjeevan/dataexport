var mysql = require("mysql");
var fs = require("file-system");

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var ftp_account = [];
function setValue(value) {
  ftp_account = value;
  console.log(ftp_account);
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
				setValue(rows[0]);
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
				fs.appendFile(file_name, rows.join(','), function (err) {
				});
			}
		});
		//console.log("2 . " + ftp_account.title + " | " + ftp_account.ip);
	}
};

module.exports = exportDataMng;

