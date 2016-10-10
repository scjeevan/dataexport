var mysql = require("mysql");
var fs = require("file-system");
var Client = require('ssh2').Client;
var csvWriter = require('csv-write-stream');
var schedule = require('node-schedule');
var exec = require('exec');
//var exec = require('child-process-promise').exec;
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

var mysql_client;

var db_config = {
    host: process.env.DATAEXPORT_MYSQL_HOST,
    user: process.env.DATAEXPORT_MYSQL_USER,
    password: process.env.DATAEXPORT_MYSQL_PASSWORD,
    database: process.env.DATAEXPORT_MYSQL_DBNAME
};

function handleDisconnect() {
	mysql_client = mysql.createConnection(db_config);
	mysql_client.connect(function(err) {
		if(err) {
			console.log('error when connecting to db:', err);
			setTimeout(handleDisconnect, 2000);
		}
	});

	mysql_client.on('error', function(err) {
		console.log('db error', err);
		handleDisconnect();
	});
}

handleDisconnect();

var conn = new Client();

var DEBUG = (function(){
    var timestamp = function(){};
    timestamp.toString = function(){
        return "[DEBUG " + (new Date).toLocaleString() + "]";    
    };
    return {
        log: console.log.bind(console, '%s', timestamp)
    }
})();

function executeGoogleBigQueryAllRows(sqlQuery, callback){
    bigquery.query(sqlQuery, function(err, rows) {
        if (!err) {
            callback(rows);
        }
        else{console.log(err);}
    });
}

function buildQuery(paramArr, isCount, isSchedule){
	var genreQ = "";
	if(typeof paramArr.genres_all == 'undefined' || paramArr.genres_all != '1') {
		if(typeof paramArr.genres != 'undefined' && paramArr.genres.length > 0){
			genreQ += "(";
			for (var i in paramArr.genres) {
				genreQ += paramArr.genres[i] + ",";
			}
			genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
		}
		DEBUG.log("GENRES : " + genreQ);
	}
	
	var selTitles = "";
	if(typeof paramArr.selected_titles != 'undefined' && paramArr.selected_titles.length > 0){
		selTitles += "(";
		for (var i in paramArr.selected_titles) {
			selTitles += "'"+paramArr.selected_titles[i].title + "',";
		}
		selTitles = selTitles.substring(0, selTitles.length - 1) + ")";
		DEBUG.log("TITLES : " + selTitles);
	}
	
	var selGroups = "";
	if(typeof paramArr.selected_groups != 'undefined' && paramArr.selected_groups.length > 0){
		selGroups += "(";
		for (var i in paramArr.selected_groups) {
			selGroups += paramArr.selected_groups[i].title + ",";
		}
		selGroups = selGroups.substring(0, selGroups.length - 1) + ")";
		DEBUG.log("GROUPS : " + selGroups);
	}
	
	var dateRange = "";
	if((typeof paramArr.startDate != 'undefined' && paramArr.startDate.length > 0)&&(typeof paramArr.endDate != 'undefined' && paramArr.endDate.length > 0)){
		var start = paramArr.startDate.replace(/T/, ' ').replace(/\..+/, '');
		var end = paramArr.endDate.replace(/T/, ' ').replace(/\..+/, '');
		dateRange = " t.Date BETWEEN '"+start+"' AND '"+end+"' ";
	}
	if(isSchedule){
		dateRange = " t.Date BETWEEN '<start>' AND '<end>' ";
	}
	var locations = paramArr.locations;
	var continents = "";
	if(!locations[0].isSelected && locations[0].children.length > 0){
		continents += "(";
		locations[0].children.forEach(function(entry) {
			if(entry.isSelected){
				continents += entry.value + ",";
			}
		});
		continents = continents.substring(0, continents.length - 1) + ")";
	}
	console.log(continents);
	var _query = "SELECT ";
	if(isCount){
		_query += " COUNT(*) AS c ";
	}
	else{
		if(typeof paramArr.columns != 'undefined' && paramArr.columns.length > 0){
			for (var i in paramArr.columns) {
				_query += "t."+paramArr.columns[i] + ",";
			}
			_query = _query.substring(0, _query.length - 1);
		}
		else{
			_query += " * ";
		}
	}
	if(selTitles.length > 0 && genreQ.length > 0){ /*** NEED TO BE MODIFIED ***/
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t JOIN DevDiggit_Hist.title_title_id AS gt ON t.TitleID = gt.title_id WHERE gt.title IN "+selTitles+" ";
		if(dateRange != ""){
			_query += " AND " + dateRange;
		}
	}
	else if(selTitles.length > 0 && genreQ.length == 0){
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t JOIN DevDiggit_Hist.title_title_id AS gt ON t.TitleID = gt.title_id WHERE gt.title IN "+selTitles+" ";
		if(dateRange != ""){
			_query += " AND " + dateRange;
		}
	}
	else if(genreQ.length > 0 && selTitles.length == 0){
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t JOIN DevDiggit_Hist.mm_title_genres AS gt ON t.TitleID = gt.title_id WHERE gt.genre_id IN "+genreQ+" ";
		if(dateRange != ""){
			_query += " AND " + dateRange;
		}
	} else {
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t ";
		if(dateRange != ""){
			_query += " WHERE " + dateRange;
		}
	}
	DEBUG.log("QUERY : " + _query);
	return _query;
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
	
	executeJob : function(req, res){
		var jobId = parseInt(req.body.jobid);
		var query = "SELECT `data_export_schedule_id`, `table_name`, `selected_columns`, `filename`, `frequency`, `file_format`, `titles`, `query`, `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `data_export_schedules`,`ftp_accounts` WHERE `data_export_schedules`.`ftp_account_id` = `ftp_accounts`.`ftp_account_id` AND `data_export_schedules`.`data_export_schedule_id`=?";
		var params = [jobId];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				if(rows.length == 1 ){
					var row = rows[0];
					var date = new Date();
					var month = date.getMonth() + 1;
					var day  = date.getDate();
					if(row.frequency == 'daily'){
						date.setDate(day - 1);
					}
					else if(row.frequency == 'weekly'){
						date.setDate(day - 7);
					}
					else {
						date.setMonth(month - 1);
					}
					var start = date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
					var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
					console.log(start);
					console.log(end);
					
					processToExport(row, start, end, function (result) {
						console.log(result);
					});
				}
			}
		});
	},
	
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
	
	continents : function (req, res) {
		var query = 'SELECT Continent AS name FROM DevDiggit_Hist.unique_ip_count_for_location GROUP BY name ORDER BY name';
		responseAll(query, res);
	},
	countries : function (req, res) {
		var query = "SELECT Country AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.params.continent) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	regions : function (req, res) {
		var query = "SELECT Region AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.params.continent) + "' AND Country = '" + escape(req.params.country) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	states : function (req, res) {
		var query = "SELECT State AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.params.continent) + "' AND Country = '" + escape(req.params.country) + "' AND Region = '" + escape(req.params.region) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	cities : function (req, res) {
		var query = "SELECT City AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.params.continent) + "' AND Country = '" + escape(req.params.country) + "' AND Region = '" + escape(req.params.region) + "' AND State = '" + escape(req.params.state) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
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
				var file_name = req.body.fileName;
				if(req.body.table == 'ip'){
					file_name = file_name + "_IP";
					if(req.body.isGenre){
						_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
					} else {
						_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
					}
					exportDataUsingScript(_query, connectionProperties, file_name);
					res.json({
						values: "Selected data is being exported"
					});
				}
				else{
					file_name = file_name + "_title";
					if(req.body.isGenre){
						_query += " FROM mm_titles t, mm_title_genres g WHERE t.title_id = g.title_id AND g.genre_id IN "+genreQ;
					} else {
						_query += " FROM mm_titles t";
					}
					_formatedQuery = mysql.format(_query);
					console.log("[QUERY]:"+_query);
					mysql_client.query(_formatedQuery, function (err, rows) {
						if(err) console.log(err);
						var status = "No data found"
						if(typeof rows.length != 'undefined' && rows.length > 0){
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
	
	filterData: function (req, res) {
		var _query = buildQuery(req.body, false, false);
		var _countQuery = buildQuery(req.body, true, false);
		executeGoogleBigQueryAllRows(_countQuery,function(r){
			if(r[0].c > 0){
				var pagenumber = req.body.pagenumber;
				var itemsPerPage = req.body.itemsPerPage;
				var lim1 = (pagenumber-1)*itemsPerPage;
				console.log("pagenumber:"+pagenumber+", itemsPerPage:"+itemsPerPage+", lim1:"+lim1);
				_query += " LIMIT "+itemsPerPage+" OFFSET "+lim1;
				var options = {
					query: _query,
					timeoutMs: 10000,
					useLegacySql: false,
					allowLargeResults:true
				};
				executeGoogleBigQueryAllRows(options,function(rows){
					res.json({
						headers: req.body.columns,
						values: rows,
						total_count:r[0].c
					});
				});
			}
			else{
				res.json({
					headers: req.body.columns,
					values: [],
					total_count:0
				});
			}
		});

		
	},
	
	exportAndSave: function (req, res) {
		var isTitle = (req.body.file_format == '1')?true:false;
		var isSchedule = (req.body.export_type == '0')?true:false;
		var _query = buildQuery(req.body, false, isSchedule);
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}
		var query = "";
		var params = [];
		var connectionProperties = {};
		var ftp_loc = "";
		if(typeof req.body.export_type != 'undefined' && typeof req.body.file_format != 'undefined'){
			if(req.body.export_type == '1'){
				DEBUG.log("Exporting Data to FTP Location");
				query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
				params = [ftp_account_id];
				var formatedQuery = mysql.format(query, params);
				mysql_client.query(formatedQuery, function (err, rows) {
					if (err) {
						DEBUG.log(err);
					}
					else {
						var ftpTitle = rows[0].title;
						ftp_loc = rows[0].location;
						connectionProperties = {
							host: rows[0].ip,
							user: rows[0].username,
							port: rows[0].port,
							password: rows[0].password
						};
						DEBUG.log("Start to export IP data to : " + ftpTitle);
						exportDataUsingScript(_query, connectionProperties, req.body.fileName+"_IP");
						if(isTitle){
							DEBUG.log("Start to export title data");
							var selTitles = "";
							if(typeof req.body.selected_titles != 'undefined' && req.body.selected_titles.length > 0){
								selTitles += "(";
								for (var i in req.body.selected_titles) {
									selTitles += "'"+req.body.selected_titles[i].title + "',";
								}
								selTitles = selTitles.substring(0, selTitles.length - 1) + ")";
								
							}
							var titleQuery = "SELECT * FROM title_title_id WHERE title IN ("+selTitles+")";
							exportDataUsingScript(titleQuery, connectionProperties, req.body.fileName+"_TITLE");
						}
						res.json({
							values: "Selected data is being exported"
						});
					}
				});
			}
			else{
				var now = new Date();
				var fileFormat = req.body.file_format;
				var frequency = req.body.frequency;
				var fileName = req.body.fileName;
				var selTitles = "";
				if(typeof req.body.selected_titles != 'undefined' && req.body.selected_titles.length > 0){
					selTitles += "(";
					for (var i in req.body.selected_titles) {
						selTitles += "'"+req.body.selected_titles[i].title + "',";
					}
					selTitles = selTitles.substring(0, selTitles.length - 1) + ")";
				}
				var fields = "";
				if(typeof req.body.columns != 'undefined' && req.body.columns.length > 0){
					for (var i in req.body.columns) {
						fields += req.body.columns[i] + ",";
					}
					fields = fields.substring(0, fields.length - 1);
				}
				DEBUG.log("Saving data export job : " + frequency);
				var _inQuery = "INSERT INTO data_export_schedules (frequency,table_name,selected_columns,added_date,ftp_account_id, filename, file_format, titles, query) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
				var _formatedQuery = mysql.format(_inQuery, [frequency, 'Diggit_IP', fields, now, ftp_account_id, fileName, fileFormat, selTitles, _query]);
				mysql_client.query(_formatedQuery, function (err, rows) {
					DEBUG.log("Job has been saved successfully");
					res.json({
						values: "Job has been saved successfully"
					});
				});
			}
		}
		else{
			res.json({
				values: []
			});
		}
	},
	
	listJobs: function (req, res) {
		var query = 'SELECT d.data_export_schedule_id, d.frequency, d.table_name, d.selected_columns, d.added_date, f.title FROM torrents.data_export_schedules d LEFT JOIN ftp_accounts f on d.ftp_account_id = f.ftp_account_id ORDER BY d.data_export_schedule_id DESC';
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
		var _query = "";
		if(req.body.table=='Diggit_IP'){
			_query = buildQuery(req.body, false, true);
		}
		else{
			_query = "SELECT ";
			for (var i in req.body.columns) {
				_query += "t."+req.body.columns[i] + ",";
			}
			_query = _query.substring(0, _query.length - 1);
			if(req.body.isGenre){
				var genreQ = "(";
				for (var i in req.body.genres) {
					genreQ += req.body.genres[i] + ",";
				}
				genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
				_query += " FROM mm_titles t, mm_title_genres g WHERE t.mm_title_id = g.title_id AND g.genre_id IN "+genreQ;
			} else {
				_query += " FROM mm_titles t";
			}
		}
		DEBUG.log("Saving [query]:"+_query);
		var ftp_account_id = 1;
		if (typeof req.body.ftp_account_id != 'undefined'){
			ftp_account_id = parseInt(req.body.ftp_account_id);
		}		
		var _columns = "";
		for (var i in req.body.columns) {
			_columns += req.body.columns[i] + ",";
		}
		_columns = _columns.substring(0, _columns.length - 1);
		var now = new Date();
		var _insQuery = "INSERT INTO data_export_schedules (frequency,table_name,selected_columns,added_date,ftp_account_id, filename, file_format, query) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
		var _formatedQuery = mysql.format(_insQuery, [req.body.switch_3, req.body.table, _columns, now, ftp_account_id, req.body.fileName, '1' ,_query]);
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

var j = schedule.scheduleJob('0 0 0 * * *', function(){
	DEBUG.log("Started data export job");
	var date = new Date();
	var month = date.getMonth() + 1;
	var day  = date.getDate();
	var weekDay = date.getDay();
	var query = "SELECT `table_name`, `selected_columns`, `filename`, `file_format`, `titles`, `query`, `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `data_export_schedules`,`ftp_accounts` WHERE `data_export_schedules`.`ftp_account_id` = `ftp_accounts`.`ftp_account_id` AND `data_export_schedules`.`frequency`=?";
	var params = [];
	if(day == 1){
		DEBUG.log("Running Monthly jobs");
		params = ['monthly'];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				rows.forEach(function (row) {
					if (row != null) {
						var d = new Date();
						d.setMonth(month - 1);
						var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
						var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						processToExport(row, start, end, function (result) {
							console.log(result);
						})
					}
				});
			}
		});
	}
	if(weekDay == 1){
		DEBUG.log("Running Weekly jobs");
		params = ['weekly'];
		var formatedQuery = mysql.format(query, params);
		mysql_client.query(formatedQuery, function (err, rows) {
			if (err) {
				console.log(err);
			}
			else {
				rows.forEach(function (row) {
					if (row != null) {
						var d = new Date();
						d.setDate(day - 7);
						var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
						var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						processToExport(row, start, end, function (result) {
							console.log(result);
						})
					}
				});
			}
		});
	}
	DEBUG.log("Running Daily jobs");
	params = ['daily'];
	var formatedQuery = mysql.format(query, params);
	mysql_client.query(formatedQuery, function (err, rows) {
		if (err) {
			console.log(err);
		}
		else {
			rows.forEach(function (row) {
				if (row != null) {
					var d = new Date();
					d.setDate(day - 1);
					var start = d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
					var end = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
					processToExport(row, start, end, function (result) {
						console.log(result);
					})
				}
			});
		}
	});
	DEBUG.log("Data export jobs ended");
});

function exportDataUsingScript(_query, connectionProperties, fileName){
	var exportCommand = process.env.DATAEXPORT_GQ_SCRIPT_PATH + ' -dataset DevDiggit_Hist -query "' + _query + '" -download_local -local_path '+process.env.DATAEXPORT_CSV_SAVE_PATH+' -bucket_name devdiggitbucket -project_id '+process.env.DATAEXPORT_GQ_PROJECT_ID+' -sftp_transfer -ftp_user "'+connectionProperties.user+'"  -ftp_pass \''+connectionProperties.password+'\' -ftp_server "'+connectionProperties.host+'" -ftp_port '+connectionProperties.port+' -export_file_name '+fileName+'';
	exec(exportCommand, function(err, out, code) {
		if (err instanceof Error)
			throw err;
		DEBUG.log("Data Exported Successfully");
		process.stderr.write(err);
		process.stdout.write(out);
		process.exit(code);
	});
}

function processToExport(row, startDate, endDate, callback) {
	if(typeof row != 'undefined'){
		var jobId = row.data_export_schedule_id;
		DEBUG.log("Running Job #"+jobId);
		var fileName = row.filename;
		var fileFormat = row.file_format;
		var tableName = row.table_name;
		var title = row.titles;
		var query = row.query;
		var ftpLocation = row.location;
		var connProps = {
			host: row.ip,
			user: row.username,
			port: row.port,
			password: row.password
		};
		if(typeof query != 'undefined' && tableName == 'Diggit_IP'){
			query = query.replace("<start>", startDate);
			query = query.replace("<end>", endDate);
			console.log(query);
			exportDataUsingScript(query, connProps, fileName+"_IP");
			DEBUG.log("Completed Job #"+jobId);
			callback("SUCCESS");
		}
	}
	
}

function responseAll(query, res) {
	console.log(query);
	bigquery.query(query, function (err, rows) {
		if (err) {
			error(res, err);
		} else {
			if (rows.length > 0) {
				success(res, rows);
			} else {
				error(res, "No Data Found");
			}
		}
	});
}

function error(res, err) {
	var response = {
		status : false,
		message : "Error",
		data : err
	};
	res.json(response);
}

function success(res, data) {
	var response = {
		status : true,
		message : "Success",
		data : data
	};
	res.json(response);
}

module.exports = exportDataMng;

