var fs = require('fs');
var Client = require('ssh2').Client;

var connectionProperties = {
	host: "104.198.206.191",
	user: "jeevan_dataexport",
	port: "22",
	password: "!Jeevan@1234"
};

function testFTP2(callback) {
	console.log("START METHOD");
	var conn = new Client();
	conn.connect(connectionProperties);
	conn.on(
		'connect',
		function () {
			console.log( "- connected" );
		}
	);
	conn.on(
		'error',
		function (err) {
			console.log( "- connection error: %s", err );
			process.exit( 1 );
		}
	);
	 
	conn.on(
		'end',
		function () {
			process.exit( 0 );
		}
	);
	conn.on('ready', function () {
		console.log( "- ready" );
		conn.sftp(function (err, sftp) {
			if (err) {
				console.log( "Error, problem starting SFTP: %s", err );
				process.exit( 2 );
			}
			console.log( "- SFTP started" );
			var readStream = fs.createReadStream('/home/jeevan/dataexport/dataexport/your-file.csv');
			var writeStream = sftp.createWriteStream('/dataexport_sftp/your-file.csv');
			writeStream.on(
				'close',
				function () {
					console.log( "- file transferred" );
					sftp.end();
					process.exit( 0 );
				}
			);
			readStream.pipe( writeStream );
		});
	}); 
	console.log("END METHOD");
}

var testFtpData2 = {

	testFTP2: function (req, res) {
        
        testFTP2(function (result) {
            res.json({
                values: result
            });
        });
    },

};
module.exports = testFtpData2;