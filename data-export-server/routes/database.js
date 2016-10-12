var mysql = require("mysql");

var db_config = {
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
};

var pool = mysql.createPool(db_config);

module.exports = {
	getConnection:function(callback) {
		pool.getConnection(function(err, connection) {
			callback(err, connection);
		});
	},
	format:function (callback){
		mysql.format(query, params, function(formatedQuery){
			callback(formatedQuery);
		});
	}
};
/*
var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

var format = function (callback){
	mysql.format(query, params, function(formatedQuery){
		callback(formatedQuery);
	});
};

module.exports = getConnection;
*/