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
	}
};
/*
var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

module.exports = getConnection;