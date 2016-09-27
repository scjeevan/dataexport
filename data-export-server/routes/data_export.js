var mysql = require("mysql");
var fs = require("file-system");
var Client = require('ssh2').Client;
var csvWriter = require('csv-write-stream');
var schedule = require('node-schedule');
var exec = require('exec');
var writer = csvWriter();


var BIGQUERY_DATASET_HIST = process.env.DATAEXPORT_GQ_PROJECT_ID.trim();

var gcloud = require('gcloud')({
	projectId: BIGQUERY_DATASET_HIST,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});
var bigquery = gcloud.bigquery({
	projectId: BIGQUERY_DATASET_HIST,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});

var mysql_client = mysql.createConnection({
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
});

var conn = new Client();

function executeGoogleBigQueryAllRows(sqlQuery, callback){
	var options = {
		query: sqlQuery,
		timeoutMs: 10000,
		useLegacySql: false,
		allowLargeResults:true
	};

    bigquery.query(options, function(err, rows) {
        if (!err) {
            callback(rows);
        }
        else{console.log(err);}
    });
}

function saveDateRemort(file_name, headers, rows, connectionProperties, ftl_loc) {
	var act_file = process.env.DATAEXPORT_CSV_SAVE_PATH + file_name;
	var writer = csvWriter({ 
		headers: headers,
		separator: ',',
		newline: '\n',
		sendHeaders: true
	});
	writer.pipe(fs.createWriteStream( act_file ));
	rows.forEach(function (row) {
		if (row != null) {
			var rowData = [];
			headers.forEach(function (header) {
				rowData.push(row[header]);
			});
			writer.write(rowData);
		}
	});
	writer.end();
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
			console.log( "- finished" );
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
			var readStream = fs.createReadStream(act_file);
			var writeStream = sftp.createWriteStream(ftl_loc + file_name);
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

function isExist(array, value){
	for (var i = 0; i < array.length; i++) {
		if(array[i].label === value){
			return i;
		}
	}
	return -1;
}

var exportDataMng = {
	
	getMovies : function(req, res){
        var movieQuery = "SELECT title FROM [devdiggit-1:DevDiggit_Hist.title_title_id] GROUP BY title";
		var movieArray = [];
		executeGoogleBigQueryAllRows(movieQuery,function(rows){
            rows.forEach(function(movie){
                if(movie != null && movie.title != '') 
					movieArray.push({name: movie.title});
            });
            res.json(movieArray);
        });
    },
	
	getLocations : function(req, res){
        var locationQuery = "SELECT Continent, Country, Region, State, City FROM [devdiggit-1:DevDiggit_Hist.unique_ip_count_for_location]";
		var locationArray = [];
		executeGoogleBigQueryAllRows(locationQuery,function(rows){
            rows.forEach(function(loc){
                if(loc != null){
					var a = isExist(locationArray, loc.Continent);
					if(a == -1){
						var aData = {label: loc.Continent, value: loc.Continent, children:[]}
						locationArray.push(aData);
					}
					else{
						var b = isExist(locationArray[a].children, loc.Country);
						if(b == -1){
							var bData = {label: loc.Country, value: loc.Country, children:[]};
							locationArray[a].children.push(bData);
						}
						else{
							var c = isExist(locationArray[a].children[b].children, loc.Region);
							if(c == -1){
								var cData = {label: loc.Region, value: loc.Region, children:[]};
								locationArray[a].children[b].children.push(cData);
							}
							else{
								var d = isExist(locationArray[a].children[b].children[c].children, loc.State);
								if(d == -1){
									var dData = {label: loc.State, value: loc.State, children:[]};
									locationArray[a].children[b].children[c].children.push(dData);
								}
								else{
									var e = isExist(locationArray[a].children[b].children[c].children[d].children, loc.City);
									if(e == -1){
										var eData = {label: loc.City, value: loc.City};
										locationArray[a].children[b].children[c].children[d].children.push(eData);
									}
								}
							}
						}
					}
				}
            });
            res.json(locationArray);
        });
		
		/*
		var locationArray = [];
		executeGoogleBigQueryAllRows(locationQuery,function(rows){
            rows.forEach(function(loc){
                if(loc != null){
					var foundKeys = Object.keys(locationArray).filter(function(key) {
						return locationArray[key] == loc.Continent;
					});
					console.log(loc.Continent + " | " + foundKeys);
					locationArray.push({label: loc.Continent, });
				}
            });
            res.json(locationArray);
        });
		*/
    },
	
	getGroups : function(req, res){
		var query = "SELECT `group_name` FROM `groups` GROUP BY `group_name`";
		var formatedQuery = mysql.format(query);
		mysql_client.query(formatedQuery, function (err, rows) {
			res.json(rows);
		});
    },
	
	exportData: function (req, res) {
		var query = "";
		var params = [];
		var connectionProperties = {};
		var ftp_loc = "";

		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		var genreQ = "(";
		for (var i in req.body.genres) {
			genreQ += req.body.genres[i] + ",";
		}
		genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
		
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [ftp_account_id];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				ftp_loc = rows[0].location;
				connectionProperties = {
					host: rows[0].ip,
					user: rows[0].username,
					port: rows[0].port,
					password: rows[0].password
				};
				var _query = "SELECT ";
				var headers = [];
				for (var i in req.body.columns) {
					_query += "t."+req.body.columns[i] + ",";
					headers.push(req.body.columns[i]);
				}
				_query = _query.substring(0, _query.length - 1);
				var start = req.body.startDate.replace(/T/, ' ').replace(/\..+/, '');
				var end = req.body.endDate.replace(/T/, ' ').replace(/\..+/, '');
				var file_name = req.body.fileName + "-" + Math.floor(new Date() / 1000) + ".csv";
				if(req.body.table == 'ip'){
					if(req.body.isGenre){
						_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
					} else {
						_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
					}
					
					var exportCommand = process.env.DATAEXPORT_GQ_SCRIPT_PATH+' -dataset DevDiggit_Hist -query "' + _query + '"  -download_local -local_path '+process.env.DATAEXPORT_CSV_SAVE_PATH+' -bucket_name devdiggitbucket  -project_id '+process.env.DATAEXPORT_GQ_PROJECT_ID+' -sftp_transfer  -ftp_user "'+connectionProperties.user+'"  -ftp_pass "'+connectionProperties.password+'"  -ftp_server "'+connectionProperties.host+'" -export_file_name="'+req.body.fileName+'"';
					console.log("[COMMAND]:"+exportCommand);
					exec(exportCommand, function(err, out, code) {
						if (err instanceof Error)
							throw err;
						process.stderr.write(err);
						process.stdout.write(out);
						process.exit(code);
					});
					res.json({
						values: "File exported successfully"
					});
				}
				else{
					var _formatedQuery = null;
					if(req.body.table === 'title'){
						if(req.body.isGenre){
							_query += " FROM mm_titles t, mm_title_genres g WHERE t.title_id = g.title_id AND g.genre_id IN "+genreQ;
						} else {
							_query += " FROM mm_titles t";
						}
						_formatedQuery = mysql.format(_query);
					}
					else{
						if(req.body.isGenre){
							_query += " FROM infohashes t, mm_title_genres g WHERE t.mm_title_id = g.title_id AND t.added_time BETWEEN ? AND ? AND g.genre_id IN "+genreQ;
						} else {
							_query += " FROM infohashes t WHERE t.added_time BETWEEN ? AND ?";
						}
						_formatedQuery = mysql.format(_query, [start, end]);
					}
					console.log("[QUERY]:"+_query);
					mysql_client.query(_formatedQuery, function (err, rows) {
						if(err) console.log(err);
						var status = "No data found"
						if(rows.length > 0){
							status = "File exported successfully";
							saveDateRemort(file_name, headers, rows, connectionProperties, ftp_loc);
						}
						res.json({
							values: status
						});
						
					});
				}
			}
		});
		
		
	},
	
	exportAndSave: function (req, res) {
		var query = "";
		var params = [];
		var connectionProperties = {};
		var ftp_loc = "";

		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		var genreQ = "";
		if(typeof req.body.genres_all == 'undefined' || req.body.genres_all != '1') {
			if(typeof req.body.genres != 'undefined' && req.body.genres.length > 0){
				genreQ += "(";
				for (var i in req.body.genres) {
					genreQ += req.body.genres[i] + ",";
				}
				genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
			}
		}
		console.log("GENRES : " + genreQ);
		
		var selTitles = "";
		if(typeof req.body.selected_titles != 'undefined' && req.body.selected_titles.length > 0){
			selTitles += "(";
			for (var i in req.body.selected_titles) {
				selTitles += req.body.selected_titles[i].title + ",";
			}
			selTitles = selTitles.substring(0, selTitles.length - 1) + ")";
			
		}
		console.log("TITLES : " + selTitles);
		
		var selGroups = "";
		if(typeof req.body.selected_groups != 'undefined' && req.body.selected_groups.length > 0){
			selGroups += "(";
			for (var i in req.body.selected_groups) {
				selGroups += req.body.selected_groups[i].title + ",";
			}
			selGroups = selGroups.substring(0, selGroups.length - 1) + ")";
		}
		console.log("GROUPS : " + selGroups);
		
		if(typeof req.body.export_type != 'undefined' && typeof req.body.file_format != 'undefined'){
			var start = req.body.startDate.replace(/T/, ' ').replace(/\..+/, '');
			var end = req.body.endDate.replace(/T/, ' ').replace(/\..+/, '');
			var _query = "SELECT ";
			for (var i in req.body.columns) {
				_query += "t."+req.body.columns[i] + ",";
			}
			_query = _query.substring(0, _query.length - 1);
			if(genreQ.length > 0){
				_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
			} else {
				_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
			}
			console.log("QUERY : " + _query);
			executeGoogleBigQueryAllRows(_query,function(rows){
				res.json({
					values: rows
				});
			});
		}
		else{
			res.json({
				values: []
			});
		}
			/*
			if(req.body.isGenre){
						_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
					} else {
						_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
					}
			
			if(req.body.export_type == '1'){
				
			}
			else{
				
			}
		}
		
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [ftp_account_id];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				ftp_loc = rows[0].location;
				connectionProperties = {
					host: rows[0].ip,
					user: rows[0].username,
					port: rows[0].port,
					password: rows[0].password
				};
				var _query = "SELECT ";
				var headers = [];
				for (var i in req.body.columns) {
					_query += "t."+req.body.columns[i] + ",";
					headers.push(req.body.columns[i]);
				}
				_query = _query.substring(0, _query.length - 1);
				var start = req.body.startDate.replace(/T/, ' ').replace(/\..+/, '');
				var end = req.body.endDate.replace(/T/, ' ').replace(/\..+/, '');
				var file_name = req.body.fileName + "-" + Math.floor(new Date() / 1000) + ".csv";
				if(req.body.table == 'ip'){
					if(req.body.isGenre){
						_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
					} else {
						_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
					}
					
					var exportCommand = process.env.DATAEXPORT_GQ_SCRIPT_PATH+' -dataset DevDiggit_Hist -query "' + _query + '"  -download_local -local_path '+process.env.DATAEXPORT_CSV_SAVE_PATH+' -bucket_name devdiggitbucket  -project_id '+process.env.DATAEXPORT_GQ_PROJECT_ID+' -sftp_transfer  -ftp_user "'+connectionProperties.user+'"  -ftp_pass "'+connectionProperties.password+'"  -ftp_server "'+connectionProperties.host+'" -export_file_name="'+req.body.fileName+'"';
					console.log("[COMMAND]:"+exportCommand);
					exec(exportCommand, function(err, out, code) {
						if (err instanceof Error)
							throw err;
						process.stderr.write(err);
						process.stdout.write(out);
						process.exit(code);
					});
					res.json({
						values: "File exported successfully"
					});
				}
				else{
					var _formatedQuery = null;
					if(req.body.table === 'title'){
						if(req.body.isGenre){
							_query += " FROM mm_titles t, mm_title_genres g WHERE t.title_id = g.title_id AND g.genre_id IN "+genreQ;
						} else {
							_query += " FROM mm_titles t";
						}
						_formatedQuery = mysql.format(_query);
					}
					else{
						if(req.body.isGenre){
							_query += " FROM infohashes t, mm_title_genres g WHERE t.mm_title_id = g.title_id AND t.added_time BETWEEN ? AND ? AND g.genre_id IN "+genreQ;
						} else {
							_query += " FROM infohashes t WHERE t.added_time BETWEEN ? AND ?";
						}
						_formatedQuery = mysql.format(_query, [start, end]);
					}
					console.log("[QUERY]:"+_query);
					mysql_client.query(_formatedQuery, function (err, rows) {
						if(err) console.log(err);
						var status = "No data found"
						if(rows.length > 0){
							status = "File exported successfully";
							saveDateRemort(file_name, headers, rows, connectionProperties, ftp_loc);
						}
						res.json({
							values: status
						});
						
					});
				}
			}
		});
		*/
		
	},
	
	listJobs: function (req, res) {
		var query = 'SELECT d.data_export_schedule_id, d.frequency, d.table_name, d.selected_columns, d.added_date, f.title FROM torrents.data_export_schedules d LEFT JOIN ftp_accounts f on d.ftp_account_id = f.ftp_account_id;';
		var formatedQuery = mysql.format(query, []);
		mysql_client.query(formatedQuery, function (err, result) {
			if (err) {
				console.log(err);
			}
			else {
				res.json({
					values: result
				});
			}
		});
	},
	
	scheduleExportData: function (req, res) {
		var query = "";
		var params = [];
		var genreQ = "";
		if(req.body.isGenre){
			genreQ = "(";
			for (var i in req.body.genres) {
				genreQ += req.body.genres[i] + ",";
			}
			genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
		}

		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}		
		var _columns = "";
		for (var i in req.body.columns) {
			_columns += req.body.columns[i] + ",";
		}
		_columns = _columns.substring(0, _columns.length - 1);
		var is_genre = req.body.isGenre?"1":"0";
		var now = new Date();
		var _query = "INSERT INTO data_export_schedules (frequency,table_name,selected_columns,added_date,ftp_account_id, is_genre, genres) VALUES (?, ?, ?, ?, ?, ?, ?)";
		var _formatedQuery = mysql.format(_query, [req.body.switch_3, req.body.table, _columns, now, ftp_account_id, is_genre, genreQ]);
		mysql_client.query(_formatedQuery, function (err, rows) {
			console.log("SAVED");
		});
		res.json({
            data: {
                "status": 'done'
            }
        });
	},
	
	genresList: function (req, res) {
		var query = 'SELECT * FROM genres';
		var formatedQuery = mysql.format(query, []);
		mysql_client.query(formatedQuery, function (err, result) {
			if (err) {
				console.log(err);
			}
			else {
				res.json({
					data: {
						values: result
					}
				});
			}
		});
	}
};

var j = schedule.scheduleJob('0 0 0 1 * *', function(){
	var date = new Date();
	console.log('Data Export Job Runnig at ' + date);
	var month = date.getMonth() + 1;
	var day  = date.getDate();
	var weekDay = date.getDay();
	var query = "SELECT `table_name`, `selected_columns`, `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol`, `is_genre`, `genres` FROM `data_export_schedules`,`ftp_accounts` WHERE `data_export_schedules`.`ftp_account_id` = `ftp_accounts`.`ftp_account_id` AND `data_export_schedules`.`frequency`=?";
	var params = [];
	
	if((month == 1 || month == 5 || month == 9) && day == 1){
		params = ['weekly'];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				rows.forEach(function (row) {
					if (row != null) {
						var tableName = row.table_name;
						var selected_columns = row.selected_columns;
						var ftpLocation = row.location;
						var connProps = {
							host: row.ip,
							user: row.username,
							port: row.port,
							password: row.password
						};
						var d = new Date();
						d.setMonth(month - 4);
						var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
						var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						var columns = selected_columns.split(",");
						processToExport(tableName, columns, connProps, start, end, ftpLocation, function (result) {
							console.log(result);
						});
					}
				});
				
				
			}
		});
	}
	else if(day == 1){
		params = ['monthly'];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				rows.forEach(function (row) {
					if (row != null) {
						var tableName = row.table_name;
						var selected_columns = row.selected_columns;
						var ftpLocation = row.location;
						var connProps = {
							host: row.ip,
							user: row.username,
							port: row.port,
							password: row.password
						};
						var d = new Date();
						d.setMonth(month - 1);
						var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
						var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						var columns = selected_columns.split(",");
						processToExport(tableName, columns, connProps, start, end, ftpLocation, function (result) {
							console.log(result);
						});
					}
				});
				
				
			}
		});
	}
	if(weekDay == 1){
		params = ['weekly'];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				rows.forEach(function (row) {
					if (row != null) {
						var tableName = row.table_name;
						var selected_columns = row.selected_columns;
						var ftpLocation = row.location;
						var connProps = {
							host: row.ip,
							user: row.username,
							port: row.port,
							password: row.password
						};
						var d = new Date();
						d.setDate(day - 7);
						var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
						var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						var columns = selected_columns.split(",");
						processToExport(tableName, columns, connProps, start, end, ftpLocation, function (result) {
							console.log(result);
						});
					}
				});
				
				
			}
		});
	}
	console.log('Data Export Job Ended at ' + date);	
});

function processToExport(tableName, columns, connProps, startDate, endDate, ftpLocation, callback) {
	var file_name = tableName + "-" + Math.floor(new Date() / 1000) + ".csv";
	var _query = "SELECT ";
	var headers = [];
	for (var i in columns) {
		_query += columns[i] + ",";
		headers.push(columns[i]);
	}
	_query = _query.substring(0, _query.length - 1);
	
	if(tableName == 'ip'){
		_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+startDate+"' AND '"+endDate+"'";
		console.log("[QUERY]:"+_query);
		
		/*
		bigquery.startQuery(_query, function(err, job) {
			if (!err) {
				job.getQueryResults(function(err, rows, apiResponse) {
					if(err) console.log(err);
					var status = (rows.length==0)?"No data found":"Data saved successfully";
					callback(status);
					saveDateRemort(file_name, headers, rows, connProps, ftpLocation);
				});
			}
		});
		
		bigquery.query(_query, function(err,rows){
			if(err) console.log(err);
			var status = (rows.length==0)?"No data found":"Data saved successfully";
			res.json({
				values: status
			});
			saveDateRemort(file_name, headers, rows);
		});
		*/
	}
	else{
		var _formatedQuery = null;
		if(tableName === 'title'){
			_query += " FROM mm_titles";
			_formatedQuery = mysql.format(_query);
		}
		else{
			_query += " FROM infohashes WHERE added_time BETWEEN ? AND ?";
			_formatedQuery = mysql.format(_query, [startDate, endDate]);
		}
		console.log("[QUERY]:"+_query);
		mysql_client.query(_formatedQuery, function (err, rows) {
			if(err) console.log(err);
			var status = (rows.length==0)?"No data found":"Data saved successfully";
			callback(status);
			saveDateRemort(file_name, headers, rows, connProps, ftpLocation);
		});
	}
	
}

module.exports = exportDataMng;

