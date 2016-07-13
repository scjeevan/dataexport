var gcloud = require('gcloud')({
  projectId: 'diggit-1266',
  keyFilename: '/home/dileepa/gcloud.key/Diggit-ffb0bd215a66.json'
});
var util = require('util');
var bigquery = gcloud.bigquery({
  projectId: 'diggit-1266',
  keyFilename: '/home/dileepa/gcloud.key/Diggit-ffb0bd215a66.json'
});
 
function testDB(callback) {
	/*
	bigquery.job.query('diggit-1266', 'select count(*) from diggit-1266:diggit_hist.Diggit_IP', function(e,r,d){
		if(e) console.log(e);
		console.log(JSON.stringify(d));
		callback(d);
	});
	*/
}

//connection.end();

var testBQData = {

	testBigQuery: function (req, res) {
        
        testDB(function (result) {
            res.json({
                values: result
            });
        });
    },

};

module.exports = testBQData;