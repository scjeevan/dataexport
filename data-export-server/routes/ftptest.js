var fs = require('fs');
var Client = require('ftp');


/*
var connectionProperties = {
	host: "104.198.206.191",
	user: "jeevan_dataexport",
	port: "22",
	password: "!Jeevan@1234"
};
*/
var connectionProperties = {
	host: "173.201.169.1",
	user: "superior4gunn",
	port: "22",
	password: "Gunnjoe1995#"
};

function testFTP(callback) {
	console.log("START METHOD");
	var c = new Client();
	c.on('ready', function() {
		console.log("START ON");
		c.list(function(err, list) {
			if (err) throw err;
			console.log("OK");
			console.dir(list);
			c.end();
		});
		console.log("END");
		/*c.put(fs.createReadStream('/home/jeevan/dataexport/dataexport/your-file.csv'), 'your-file.csv', function(err) {
			if (err) throw err;
			c.end();
		});*/
	}).on('error', function (err) {
            console.log("ERR");
          }).connect(connectionProperties);
	console.log("END METHOD");
}
//c.connect(connectionProperties);

var testFtpData = {

	testFTP: function (req, res) {
        
        testFTP(function (result) {
            res.json({
                values: result
            });
        });
    },

};

module.exports = testFtpData;