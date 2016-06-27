var express = require('express');

var app = express();

app.set('port', process.env.IMDB_SERVER_PORT);

var server = app.listen(app.get('port'));

var handler = function() {
	server.close();
};