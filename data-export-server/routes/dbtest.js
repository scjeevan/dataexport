var mysql = require('mysql');

var connection = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

console.log('MYSQL_HOST: ', process.env.DATAEXPORT_MYSQL_HOST);
console.log('MYSQL_USER: ', process.env.DATAEXPORT_MYSQL_USER);
console.log('MYSQL_PASSWORD: ', process.env.DATAEXPORT_MYSQL_PASSWORD);
console.log('MYSQL_DBNAME: ', process.env.DATAEXPORT_MYSQL_DBNAME);

//connection.connect();
 


function testDB(callback) {
	connection.query('SELECT * from imdb_titles1', function(err, rows, fields) {
	if (!err)
		console.log('The solution is: ', rows);
	else
		console.log('Error while performing Query.');
	});
}

//connection.end();

var testTableData = {

	testDB: function (req, res) {
        
        testDB(function (result) {
            res.json({
                values: result
            });
        });
    },

};

module.exports = testTableData;