var mysql      = require('mysql');

var connection = mysql.createConnection({
	host: process.env.IMDB_MYSQL_HOST,
    user: process.env.IMDB_MYSQL_USER,
    password: process.env.IMDB_MYSQL_PASSWORD,
    database: process.env.IMDB_MYSQL_DBNAME
});

console.log('IMDB_MYSQL_HOST: ', process.env.IMDB_MYSQL_HOST);
console.log('IMDB_MYSQL_USER: ', process.env.IMDB_MYSQL_USER);
console.log('IMDB_MYSQL_PASSWORD: ', process.env.IMDB_MYSQL_PASSWORD);
console.log('IMDB_MYSQL_DBNAME: ', process.env.IMDB_MYSQL_DBNAME);

connection.connect();
 
connection.query('SELECT * from titles', function(err, rows, fields) {
	if (!err)
		console.log('The solution is: ', rows);
	else
		console.log('Error while performing Query.');
});
 
connection.end();