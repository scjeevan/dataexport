var fs = require('fs');
var Client = require('ftp');

var c = new Client();

var connectionProperties = {
	host: "104.198.206.191",
	user: "jeevan_dataexport",
	port: "22",
	password: "!Jeevan@1234"
};

function testFTP(callback) {
	c.on('ready', function() {
		/*c.list(function(err, list) {
			if (err) throw err;
			console.dir(list);
			c.end();
		});*/
		c.put('foo.txt', 'foo.remote-copy.txt', function(err) {
			if (err) throw err;
			c.end();
		});
	});
}
c.connect(connectionProperties);

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