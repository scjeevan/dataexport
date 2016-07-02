var mysql = require("mysql");

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

function getAllFtpAccounts(callback) {
	var query = 'SELECT * FROM ftp_accounts';
    var formatedQuery;

    formatedQuery = mysql.format(query, []);
    mysql_client.query(formatedQuery, function (err, result) {
        if (err) {
            console.log(err);
            callback([]);
        }
        else {
            callback(result);
        }
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
		console.log(req);
		var query = "";
		var params = [];
		if (req.ftp_account_id == 0) {
			query = "INSERT INTO ";
			//params = [new_name, torrents.length];
		} else {
			
			query = 'UPDATE "uptodate_aggregated_title_curated" SET "nooffiles" = ? WHERE "titlename" = ?';
			//params = [torrents.length, old_name.toString()];
		}
		console.log(query);
    }

};

module.exports = ftpAccountsData;

