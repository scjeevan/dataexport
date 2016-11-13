var db = require('./database');
var mysql = require("mysql");
var fs = require("file-system");
var Client = require('ssh2').Client;
var csvWriter = require('csv-write-stream');
var schedule = require('node-schedule');
var child_process = require('child_process');
//var exec = require('exec');
//var exec = require('child-process-promise').exec;
var writer = csvWriter();
var conn = new Client();

var BIGQUERY_DATASET_HIST = process.env.DATAEXPORT_GQ_PROJECT_ID.trim();

var gcloud = require('gcloud')({
	projectId: BIGQUERY_DATASET_HIST,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});
var bigquery = gcloud.bigquery({
	projectId: BIGQUERY_DATASET_HIST,
	keyFilename: process.env.DATAEXPORT_GQ_KEY_PATH
});

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
function buildTitleQuery(paramArr, isCount, isSchedule){
	var titleColumns = {diggit_id:'mt.diggit_title_id as diggit_id' ,title:'mt.title as title' ,season:'mt.season as season' ,episode:'mt.episode as episode',studio:'mt.studio as studio',content_type:'mt.category as content_type',genre:'mt.genre as genre',mpaa_rating:'mt.mpaa_rating as mpaa_rating', imdb_id:'mt.imdb_id as imdb_id', episode_imdb_id:'mt.episode_imdb_id as episode_imdb_id', episode_Year:'ie.Year as episode_Year',episode_Rating:'ie.Rating as episode_Rating',episode_Runtime:'ie.Runtime as episode_Runtime' ,episode_Genre:'ie.Genre as episode_Genre' ,episode_Released:'ie.Released as episode_Released',episode_Season:'ie.Season as episode_Season',episode_title:'ie.Title as episode_title', episode_Director:'ie.Director as episode_Director',episode_Writer:'ie.Writer as episode_Writer',episode_Cast:'ie.Cast as episode_Cast',episode_Metacritic:'ie.Metacritic as episode_Metacritic',episode_imdbRating:'ie.imdbRating as episode_imdbRating',episode_imdbVotes:'ie.imdbVotes as episode_imdbVotes',episode_Poster:'ie.Poster as episode_Poster', episode_Plot:'ie.Plot as episode_Plot',episode_FullPlot:'ie.FullPlot as episode_FullPlot',episode_Language:'ie.Language as episode_Language',episode_Country:'ie.Country as episode_Country',episode_Awards:'ie.Awards as episode_Awards',Year:'id.Year as Year',Rating:'id.Rating as Rating',Runtime:'id.Runtime as Runtime',Genre:'id.Genre as Genre',Released:'id.Released as Released', Director:'id.Director as Director',Writer:'id.Writer as Writer',Cast:'id.Cast as Cast',Metacritic:'id.Metacritic as Metacritic',imdbRating:'id.imdbRating as imdbRating',imdbVotes:'id.imdbVotes as imdbVotes',Plot:'id.Plot as Plot',FullPlot:'id.FullPlot as FullPlot',Language:'id.Language as Language',Country:'id.Country as Country'};
	var _query = "SELECT ";
	if(isCount){
		_query += " COUNT(mt.diggit_title_id) AS c from torrents.mm_titles mt ";
	}
	else{
		var fields = "";
		for (var i in paramArr.tColumns) {
			_query += "'"+paramArr.tColumns[i] + "',";
			fields += titleColumns[paramArr.tColumns[i]] + ",";
		}
		_query = _query.substring(0, _query.length - 1);
		fields = fields.substring(0, fields.length - 1);
		_query += " UNION ALL select " + fields;
		_query += " from torrents.mm_titles mt left join imdb.episodes ie on ie.imdbID=mt.imdb_id left join imdb.imdb_details id on id.imdbID=mt.imdb_id";
	}
	DEBUG.log("TITLE_QUERY : " + _query);
	return _query;
}

function buildInfohashesQuery(paramArr, isCount, isSchedule){
	var infohashesColumns = {infohash:'i.infohash',diggit_id:'mt.diggit_title_id',file_name:'i.file_name',network:'i.network',file_size:'i.file_size',media_format:'i.media_format',quality:'i.quality',audio_language:'i.audio_language',subtitle_language:'i.subtitle_language',
	created_time:'i.created_time',added_time:'i.added_time',episode_title:'i.episode_title',added_by:'i.added_by',languages:'i.languages',verified:'i.verified',resolution:'i.resolution',aspect_ratio:'i.aspect_ratio',frame_rate:'i.frame_rate',subtitles:'i.subtitles',bitrate:'i.bitrate'};
	var _query = "SELECT ";
	if(isCount){
		_query += " COUNT(i.infohash) AS c from torrents.mm_titles mt left join torrents.infohashes i on i.mm_title_id=mt.mm_title_id";
	}
	else{
		var fields = "";
		for (var i in paramArr.infColumns) {
			_query += "'"+paramArr.infColumns[i] + "',";
			fields += infohashesColumns[paramArr.infColumns[i]] + ",";
		}
		_query = _query.substring(0, _query.length - 1);
		fields = fields.substring(0, fields.length - 1);
		_query += " UNION ALL select " + fields;
		_query += " from torrents.mm_titles mt left join torrents.infohashes i on i.mm_title_id=mt.mm_title_id";
	}
	DEBUG.log("INFOHASHES_QUERY : " + _query);
	return _query;
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
		start = start.substring(0, 10)+' 00:00:00'; 
		var end = paramArr.endDate.replace(/T/, ' ').replace(/\..+/, '');
		end = end.substring(0, 10)+' 23:59:59'; 
		dateRange = " t.Date >= '"+start+"' AND t.Date <= '"+end+"' ";
	}
	if(isSchedule){
		dateRange = " t.Date BETWEEN '<start>' AND '<end>' ";
	}
	var locations = paramArr.locations;
	var continents = "";
	if(typeof locations != 'undefined' && !locations[0].isSelected && locations[0].children.length > 0){
		locations[0].children.forEach(function(entry) {
			if(entry.isSelected){
				continents += " t.Continent LIKE '"+entry.value + "' OR";
			}
		});
		continents = continents.substring(0, continents.length - 2);
		DEBUG.log("CONTINENTS : " + continents);
	}
	var appendedParams = 0;
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
		appendedParams++;
	}
	else if(selTitles.length > 0 && genreQ.length == 0){
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t JOIN DevDiggit_Hist.title_title_id AS gt ON t.TitleID = gt.title_id WHERE gt.title IN "+selTitles+" ";
		appendedParams++;
	}
	else if(genreQ.length > 0 && selTitles.length == 0){
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t JOIN DevDiggit_Hist.mm_title_genres AS gt ON t.TitleID = gt.title_id WHERE gt.genre_id IN "+genreQ+" ";
		appendedParams++;
	} else {
		_query += " FROM DevDiggit_Hist.Diggit_IP AS t ";
	}
	if(dateRange != ""){
		if(appendedParams == 0){
			_query += " WHERE " + dateRange;
			appendedParams++;
		}
		else{
			_query += " AND " + dateRange;
		}
	}
	if(continents != ""){
		if(appendedParams == 0){
			_query += " WHERE " + continents ;
		}
		else{
			_query += " AND " + continents ;
		}
	}
	/*
	if(selGroups != ""){
		if(appendedParams == 0){
			_query += " WHERE group_id IN " + selGroups ;
			appendedParams++;
		}
		else{
			_query += " AND group_id IN " + selGroups ;
		}
	}
	*/
	DEBUG.log("QUERY : " + _query);
	return _query;
}

function saveDateRemort(file_name, headers, rows, connectionProperties, ftl_loc) {
	var act_file = process.env.DATAEXPORT_CSV_SAVE_PATH + file_name;
	var writer = csvWriter({ 
		headers: headers,
		separator: '\t',
		newline: '\n',
		sendHeaders: false
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
			var destPath = ftl_loc +"/"+ file_name;
			var writeStream = sftp.createWriteStream(destPath);
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
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, rows) {
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
			connection.release();
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
		var query = 'SELECT Continent AS name FROM DevDiggit_Hist.ip_aggregation GROUP BY name ORDER BY name';
		responseAll(query, res);
	},
	countries : function (req, res) {
		console.log(req);
		var query = "SELECT Country AS name FROM DevDiggit_Hist.ip_aggregation WHERE Continent = '" + escape(req.body.continent) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	regions : function (req, res) {
		var query = "SELECT Region AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.body.continent) + "' AND Country = '" + escape(req.body.country) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	states : function (req, res) {
		var query = "SELECT State AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.body.continent) + "' AND Country = '" + escape(req.body.country) + "' AND Region = '" + escape(req.body.region) + "' GROUP BY name ORDER BY name";
		responseAll(query, res);
	},
	cities : function (req, res) {
		var query = "SELECT City AS name FROM DevDiggit_Hist.unique_ip_count_for_location WHERE Continent = '" + escape(req.body.continent) + "' AND Country = '" + escape(req.body.country) + "' AND Region = '" + escape(req.body.region) + "' AND State = '" + escape(req.body.state) + "' GROUP BY name ORDER BY name";
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
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, rows) {
				res.json(rows);
			});
			connection.release();
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
		var genreQ = "";
		if(req.body.isGenre){
			genreQ = "(";
			for (var i in req.body.genres) {
				genreQ += req.body.genres[i] + ",";
			}
			genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
		}
		
		query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
		params = [ftp_account_id];
		var formatedQuery = mysql.format(query, params);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, rows) {
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
						_query += "'"+req.body.columns[i] + "',";
						headers.push(req.body.columns[i]);
					}
					_query = _query.substring(0, _query.length - 1);
					var start = req.body.startDate;
					var end = req.body.endDate;
					var file_name = req.body.fileName;
					if(req.body.table == 'Diggit_IP'){
						file_name = file_name + "_IP";
						if(req.body.isGenre){
							_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '"+start+"' AND '"+end+"' AND gt.genre_id IN "+genreQ; // LIMIT 10000
						} else {
							_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '"+start+"' AND '"+end+"' "; // LIMIT 10000
						}
						_query += " AND IP!='Peer IP' LIMIT 1000";
						DEBUG.log(_query);
						exportDataUsingScript(_query, connectionProperties, file_name);
						res.json({
							values: "Selected data is being exported"
						});
					}
					else if(req.body.table == 'infohashes'){
						file_name = file_name + "_infohashes";
						_query += " UNION ALL select i.infohash,mt.diggit_title_id, i.file_name,i.network,i.file_size,i.media_format,i.quality,i.audio_language, i.subtitle_language,i.created_time,i.added_time,i.episode_title,i.added_by,i.languages,i.verified, i.resolution,i.aspect_ratio,i.frame_rate,i.subtitles,i.bitrate from  torrents.mm_titles mt left join torrents.infohashes i on i.mm_title_id=mt.mm_title_id";
						if(typeof req.body.startDate != 'undefined' && typeof req.body.endDate != 'undefined'){
							var start = req.body.startDate;
							var end = req.body.endDate;
							_query += " WHERE i.added_time BETWEEN '"+start+"' AND '"+end+"' ";
						}
						if(req.body.isGenre){
							_query += " left join torrents.mm_title_genres g on g.title_id = mt.mm_title_id where g.genre_id in "+genreQ;
						}
						_query += " limit 5 ";
						_formatedQuery = mysql.format(_query);
						DEBUG.log("[QUERY]:"+_query);
						connection.query(_formatedQuery, function (err, rows) {
							if(err) console.log(err);
							var status = "Data not found for selected criteria"
							if(typeof rows != 'undefined' && typeof rows.length != 'undefined' && rows.length > 0){
								status = "File exported successfully";
								saveDateRemort(file_name, headers, rows, connectionProperties, ftp_loc);
							}
							res.json({
								values: status
							});
							
						});
					}
					else{
						file_name = file_name + "_title";
						_query += " UNION ALL select mt.diggit_title_id as diggit_id,mt.title as title,mt.season ,mt.episode,mt.studio,mt.category, mt.genre,mt.mpaa_rating,mt.imdb_id,mt.episode_imdb_id, ie.Year as episode_Year,ie.Rating as episode_Rating,ie.Runtime as episode_Runtime ,ie.Genre as episode_Genre, ie.Released as episode_Released,ie.Season as episode_Season ,ie.Title as episode_title,ie.Director as episode_Director,ie.Writer as episode_Writer,ie.Cast as episode_Cast, ie.Metacritic as episode_Metacritic,ie.imdbRating as episode_imdbRating,ie.imdbVotes as episode_imdbVotes, ie.Poster as episode_Poster ,ie.Plot as episode_Plot,ie.FullPlot as episode_FullPlot, ie.Language as episode_Language,ie.Country as episode_Country,ie.Awards as episode_Awards, id.Year as Year,id.Rating,id.Runtime,id.Genre,id.Released,id.Director,id.Writer,id.Cast,id.Metacritic,id.imdbRating,   id.imdbVotes,id.Plot,id.FullPlot,id.Language,id.Country from torrents.mm_titles mt left join imdb.episodes ie on ie.imdbID=mt.imdb_id left join imdb.imdb_details id on id.imdbID=mt.imdb_id";
						if(req.body.isGenre){
							_query += " left join torrents.mm_title_genres g on g.title_id = mt.mm_title_id where g.genre_id in "+genreQ;
						}
						_query += " limit 5 ";
						_formatedQuery = mysql.format(_query);
						DEBUG.log("[QUERY]:"+_query);
						connection.query(_formatedQuery, function (err, rows) {
							if(err) console.log(err);
							var status = "Data not found for selected criteria"
							if(typeof rows != 'undefined' && typeof rows.length != 'undefined' && rows.length > 0){
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
			connection.release();
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
	filterTitleData: function (req, res) {
		var _query = buildTitleQuery(req.body, false, false);
		var _countQuery = buildTitleQuery(req.body, true, false);
		var formatedQuery = mysql.format(_countQuery);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, r) {
				if(r[0].c > 0){
					var pagenumber = req.body.tPagenumber;
					var itemsPerPage = req.body.itemsPerPage;
					var lim1 = (pagenumber-1)*itemsPerPage;
					console.log("pagenumber:"+pagenumber+", itemsPerPage:"+itemsPerPage+", lim1:"+lim1);
					_query += " LIMIT "+itemsPerPage+" OFFSET "+lim1;
					var formatedQuery2 = mysql.format(_query);
					connection.query(formatedQuery2, function (err, rows) {
						res.json({
							headers: req.body.tColumns,
							values: rows,
							total_count:r[0].c
						});
					});
				}
				else{
					res.json({
						headers: req.body.tColumns,
						values: [],
						total_count:0
					});
				}
			});
			connection.release();
		});
	},
	filterInfohashesData: function (req, res) {
		var _query = buildInfohashesQuery(req.body, false, false);
		var _countQuery = buildInfohashesQuery(req.body, true, false);
		var formatedQuery = mysql.format(_countQuery);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, r) {
				if(r[0].c > 0){
					var pagenumber = req.body.iPagenumber;
					var itemsPerPage = req.body.itemsPerPage;
					var lim1 = (pagenumber-1)*itemsPerPage;
					console.log("pagenumber:"+pagenumber+", itemsPerPage:"+itemsPerPage+", lim1:"+lim1);
					_query += " LIMIT "+itemsPerPage+" OFFSET "+lim1;
					var formatedQuery2 = mysql.format(_query);
					connection.query(formatedQuery2, function (err, rows) {
						res.json({
							headers: req.body.infColumns,
							values: rows,
							total_count:r[0].c
						});
					});
				}
				else{
					res.json({
						headers: req.body.infColumns,
						values: [],
						total_count:0
					});
				}
			});
			connection.release();
		});
	},
	
	exportAndSave: function (req, res) {
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
		if(typeof req.body.export_type != 'undefined'){
			if(req.body.export_type == '1'){
				DEBUG.log("Exporting Data to FTP Location");
				query = "SELECT `title`, `username`, `password`, `ip`, `port`, `location` ,`protocol` FROM `ftp_accounts` WHERE `ftp_account_id`=?";
				params = [ftp_account_id];
				var formatedQuery = mysql.format(query, params);
				db.getConnection(function(err, connection){
					connection.query(formatedQuery, function (err, rows) {
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
							/*
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
							*/
							res.json({
								values: "Selected data is being exported"
							});
						}
					});
					connection.release();
				});
			}
			else{
				var now = new Date();
				var frequency = req.body.frequency;
				var fileName = req.body.fileName;
				var scheduleTitle = req.body.schedule_title
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
				var _inQuery = "INSERT INTO data_export_schedules (title, frequency,table_name,selected_columns,added_date,ftp_account_id, filename, file_format, titles, query) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
				var _formatedQuery = mysql.format(_inQuery, [scheduleTitle, frequency, 'Diggit_IP', fields, now, ftp_account_id, fileName, 1, selTitles, _query]);
				db.getConnection(function(err, connection){
					connection.query(_formatedQuery, function (err, rows) {
						DEBUG.log("Job has been saved successfully");
						res.json({
							values: "Job has been saved successfully"
						});
					});
					connection.release();
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
		var query = 'SELECT d.data_export_schedule_id, d.title as schedule_title, d.frequency, d.table_name, d.selected_columns, d.added_date, f.title FROM torrents.data_export_schedules d LEFT JOIN ftp_accounts f on d.ftp_account_id = f.ftp_account_id ORDER BY d.data_export_schedule_id DESC';
		var formatedQuery = mysql.format(query, []);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, result) {
				if (err) {
					console.log(err);
				}
				else {
					res.json({
						values: result
					});
				}
			});
			connection.release();
		});
		
	},
	
	scheduleExportData: function (req, res) {
		var _query = "SELECT ";
		for (var i in req.body.columns) {
			_query += "'"+req.body.columns[i] + "',";
		}
		_query = _query.substring(0, _query.length - 1);
		var genreQ = "";
		if(req.body.isGenre){
			genreQ = "(";
			for (var i in req.body.genres) {
				genreQ += req.body.genres[i] + ",";
			}
			genreQ = genreQ.substring(0, genreQ.length - 1) + ")";
		}
		if(req.body.table=='Diggit_IP'){
			if(req.body.isGenre){
				_query += " FROM [DevDiggit_Hist.Diggit_IP] AS t JOIN [DevDiggit_Hist.mm_title_genres] AS gt ON t.TitleID = gt.title_id WHERE t.Date BETWEEN '<start>' AND '<end>' AND gt.genre_id IN "+genreQ;
			} else {
				_query += " FROM DevDiggit_Hist.Diggit_IP WHERE Date BETWEEN '<start>' AND '<end>' ";
			}
			_query += " AND IP!='Peer IP'";
		}
		else if(req.body.table == 'infohashes'){
			_query += " UNION ALL select i.infohash,mt.diggit_title_id, i.file_name,i.network,i.file_size,i.media_format,i.quality,i.audio_language, i.subtitle_language,i.created_time,i.added_time,i.episode_title,i.added_by,i.languages,i.verified, i.resolution,i.aspect_ratio,i.frame_rate,i.subtitles,i.bitrate from  torrents.mm_titles mt left join torrents.infohashes i on i.mm_title_id=mt.mm_title_id WHERE i.added_time BETWEEN '<start>' AND '<end>' ";
			if(req.body.isGenre){
				_query += " left join torrents.mm_title_genres g on g.title_id = mt.mm_title_id where g.genre_id in "+genreQ;
			}
			_query += " limit 5 ";
		}
		else{
			_query += " UNION ALL select mt.diggit_title_id as diggit_id,mt.title as title,mt.season ,mt.episode,mt.studio,mt.category, mt.genre,mt.mpaa_rating,mt.imdb_id,mt.episode_imdb_id, ie.Year as episode_Year,ie.Rating as episode_Rating,ie.Runtime as episode_Runtime ,ie.Genre as episode_Genre, ie.Released as episode_Released,ie.Season as episode_Season ,ie.Title as episode_title,ie.Director as episode_Director,ie.Writer as episode_Writer,ie.Cast as episode_Cast, ie.Metacritic as episode_Metacritic,ie.imdbRating as episode_imdbRating,ie.imdbVotes as episode_imdbVotes, ie.Poster as episode_Poster ,ie.Plot as episode_Plot,ie.FullPlot as episode_FullPlot, ie.Language as episode_Language,ie.Country as episode_Country,ie.Awards as episode_Awards, id.Year as Year,id.Rating,id.Runtime,id.Genre,id.Released,id.Director,id.Writer,id.Cast,id.Metacritic,id.imdbRating,   id.imdbVotes,id.Plot,id.FullPlot,id.Language,id.Country from torrents.mm_titles mt left join imdb.episodes ie on ie.imdbID=mt.imdb_id left join imdb.imdb_details id on id.imdbID=mt.imdb_id";
			if(req.body.isGenre){
				_query += " left join torrents.mm_title_genres g on g.title_id = mt.mm_title_id where g.genre_id in "+genreQ;
			}
			_query += " limit 5 ";
		}
		DEBUG.log("Saving [QUERY]:"+_query);
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
		var _insQuery = "INSERT INTO data_export_schedules (title, frequency,table_name,selected_columns,added_date,ftp_account_id, filename, file_format, query) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
		var _formatedQuery = mysql.format(_insQuery, [req.body.schedule_title, req.body.switch_3, req.body.table, _columns, now, ftp_account_id, req.body.fileName, '1' ,_query]);
		db.getConnection(function(err, connection){
			connection.query(_formatedQuery, function (err, rows) {
				console.log("SAVED");
			});
			connection.release();
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
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, result) {
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
			connection.release();
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
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, rows) {
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
			connection.release();
		});
		
	}
	if(weekDay == 1){
		DEBUG.log("Running Weekly jobs");
		params = ['weekly'];
		var formatedQuery = mysql.format(query, params);
		db.getConnection(function(err, connection){
			connection.query(formatedQuery, function (err, rows) {
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
			connection.release();
		});
		
	}
	DEBUG.log("Running Daily jobs");
	params = ['daily'];
	var formatedQuery = mysql.format(query, params);
	db.getConnection(function(err, connection){
		connection.query(formatedQuery, function (err, rows) {
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
		connection.release();
	});
	DEBUG.log("Data export jobs ended");
});

function exportDataUsingScript(_query, connectionProperties, fileName){
	var exportCommand = process.env.DATAEXPORT_GQ_SCRIPT_PATH + ' -dataset DevDiggit_Hist -query "' + _query + '" -download_local -local_path '+process.env.DATAEXPORT_CSV_SAVE_PATH+' -bucket_name devdiggitbucket -project_id '+process.env.DATAEXPORT_GQ_PROJECT_ID+' -sftp_transfer -ftp_user "'+connectionProperties.user+'"  -ftp_pass \''+connectionProperties.password+'\' -ftp_server "'+connectionProperties.host+'" -ftp_port '+connectionProperties.port+' -export_file_name '+fileName+'';
	console.log(exportCommand);
	
	var workerProcess = child_process.exec(exportCommand,function(error, stdout, stderr){
		if (error) {
			console.log(error.stack);
			console.log('Error code: '+error.code);
			console.log('Signal received: '+error.signal);
		}
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
	});
	workerProcess.on('exit', function (code) {
		console.log('Child process exited with exit code '+code);
	});
	/*
	child_process.execFile(process.env.DATAEXPORT_GQ_SCRIPT_PATH, [
		'-dataset','DevDiggit_Hist',
		'-query', _query,
		'-download_local',
		'-local_path',process.env.DATAEXPORT_CSV_SAVE_PATH,
		'-bucket_name','devdiggitbucket',
		'-project_id',process.env.DATAEXPORT_GQ_PROJECT_ID,
		'-sftp_transfer',
		'-ftp_user',connectionProperties.user,
		'-ftp_pass',connectionProperties.password,
		'-ftp_server',connectionProperties.host,
		'-ftp_port',connectionProperties.port,
		'-export_file_name',fileName], function(error, stdout, stderr){
			console.log(stdout);
	});
	
	var exportCommand = process.env.DATAEXPORT_GQ_SCRIPT_PATH + ' -dataset DevDiggit_Hist -query "' + _query + '" -download_local -local_path '+process.env.DATAEXPORT_CSV_SAVE_PATH+' -bucket_name devdiggitbucket -project_id '+process.env.DATAEXPORT_GQ_PROJECT_ID+' -sftp_transfer -ftp_user "'+connectionProperties.user+'"  -ftp_pass \''+connectionProperties.password+'\' -ftp_server "'+connectionProperties.host+'" -ftp_port '+connectionProperties.port+' -export_file_name '+fileName+'';
	console.log(exportCommand);
	
	exec(exportCommand, function(err, out, code) {
		if (err instanceof Error)
			throw err;
		DEBUG.log("Data Exported Successfully");
		process.stderr.write(err);
		process.stdout.write(out);
		process.exit(code);
	});
	*/
}

function processToExport(row, startDate, endDate, callback) {
	if(typeof row != 'undefined'){
		var jobId = row.data_export_schedule_id;
		DEBUG.log("Running Job #"+jobId);
		var fileName = row.filename;
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

