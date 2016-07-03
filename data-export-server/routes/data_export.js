var mysql = require("mysql");

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var exportDataMng = {
	
	exportData: function (req, res) {
		var query = "";
		var params = [];
		var ftp_account = {};
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [parseInt(req.body.ftp_account_id)];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				console.log(rows.title+ " | " + rows.ip);
				ftp_account = rows[0];
			}
		});
		console.log(ftp_account.title + " | " + ftp_account.ip);
	}

};

module.exports = exportDataMng;
