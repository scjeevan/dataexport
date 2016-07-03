var mysql = require("mysql");

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var exportDataMng = {
	
	exportData: function (req, res) {
		console.log("OK")
		/*
		var query = "";
		var params = [];
		if (typeof req.body.ftp_account_id == 'undefined'){
			query = "INSERT INTO `ftp_accounts` (`title`,`username`,`password`,`ip`,`port`,`protocol`) VALUES (?,?,?,?,?,?)";
			params = [req.body.title, req.body.username, req.body.password, req.body.ip, req.body.port, req.body.protocol];
		} else {
			query = "UPDATE `ftp_accounts` SET `title` = ?, `username` = ?, `password` = ?, `ip` = ?, `port` = ?,`protocol` = ?  WHERE `ftp_account_id` = ?";
			params = [req.body.title, req.body.username, req.body.password, req.body.ip, req.body.port, req.body.protocol, parseInt(req.body.ftp_account_id)];
		}
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, result) {
			if (err) {
				console.log(err);
			}
			else {
				res.json({
					values: result
				});
			}
		});
		*/
	}

};

module.exports = exportDataMng;

