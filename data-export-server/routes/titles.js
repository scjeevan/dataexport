var mysql = require("mysql");

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

/*
var mysql_client = mysql.createConnection({
    host: '10.0.1.12',
    user: 'usrimdb_new',
    password: 'Admin$323',
    database: 'imdb_new'
});
*/

function searchById(titleId, callback) {
	//mysql_client.connect();
    var query = 'SELECT * FROM titles WHERE title_imdb_id = ? LIMIT 1 ';
    var formatedQuery;

    formatedQuery = mysql.format(query, [titleId]);
    mysql_client.query(formatedQuery, function (err, result) {
        if (err) {
            console.log(err);
            callback([]);
        }
        else {
            callback(result);
			//mysql_client.end();
        }
    });
	
}

function searchByTitle(title, callback) {
    var query = "SELECT * FROM titles WHERE title LIKE ?";
    var formatedQuery;
	//mysql_client.connect();
    formatedQuery = mysql.format(query, [title]);
    mysql_client.query(formatedQuery, function (err, result) {
        if (err) {
            console.log(err);
            callback([]);
        }
        else {
            callback(result);
        }
    });
	//mysql_client.end();
}



var titleTableData = {

    searchTitleById: function (req, res) {
        var start = 0;
        var titleId = req.query.titleid  // get any value from get request  
        
        searchById(titleId, function (result) {
            res.json({
                values: result
            });
        });
       
    },

    saveTitleData: function (req, res) {
        var data = req.body;
        var titleData = data.titleData; // use to get data from post

        res.json({
            data: {
                "status": 'done'
            }
        });
    },
	
	searchTitle: function (req, res) {
        var title = req.query.title+'%';

        searchByTitle(title, function (result) {
            res.json({
                values: result
            });
        });
    },

};

module.exports = titleTableData;