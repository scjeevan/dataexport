var db = require('./database');
var mysql = require("mysql");

function getAllFtpAccounts(callback) {
	var query = 'SELECT * FROM ftp_accounts';
    var formatedQuery;

    formatedQuery = mysql.format(query, []);
	db.getConnection(function(err, connection){
		connection.query(formatedQuery, function (err, result) {
			if (err) {
				console.log(err);
				callback([]);
			}
			else {
				callback(result);
			}
		});
		connection.release();
	});
}

var ftpAccountsData = {

    listFtpAccounts: function (req, res) {
        getAllFtpAccounts(function (result) {
            res.json({
                values: result
            });
        });
       
    },
	
	saveFtpAccount: function (req, res) {
		var query = "";
		var params = [];
		if (typeof req.body.ftp_account_id == 'undefined'){
			query = "INSERT INTO `ftp_accounts` (`title`,`username`,`password`,`ip`,`port`,`location`,`protocol`) VALUES (?,?,?,?,?,?,?)";
			params = [req.body.title, req.body.username, req.body.password, req.body.ip, req.body.port, req.body.location, req.body.protocol];
		} else {
			query = "UPDATE `ftp_accounts` SET `title` = ?, `username` = ?, `password` = ?, `ip` = ?, `port` = ?, `location` = ?, `protocol` = ?  WHERE `ftp_account_id` = ?";
			params = [req.body.title, req.body.username, req.body.password, req.body.ip, req.body.port, req.body.location, req.body.protocol, parseInt(req.body.ftp_account_id)];
		}
		var formatedQuery = mysql.format(query, params);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, result) {
				if (err) {
					console.log(err);
				}
				else {
					res.json({
						values: result
					});
				}
			});
			connection.release();
		});
	},
	
	deleteFtpAccount: function (req, res) {
		var query = "";
		var params = [];
		if (typeof req.body.ftp_account_id != 'undefined'){
			query = "DELETE FROM `ftp_accounts` WHERE `ftp_account_id` = ?";
			params = [parseInt(req.body.ftp_account_id)];
			var formatedQuery = mysql.format(query, params);
			db.getConnection(function(err, connection){
				connection.query(formatedQuery, function (err, result) {
					if (err) {
						console.log(err);
					}
					else {
						res.json({
							values: result
						});
					}
				});
				connection.release();
			});
		}
	}

};

module.exports = ftpAccountsData;

