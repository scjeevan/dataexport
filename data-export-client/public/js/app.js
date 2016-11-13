'use strict';
//var server_path = 'http://146.148.110.133:4142/';
var server_path = 'http://104.197.10.155:80/';


var mvpApp = angular.module('dataExportApp', ['ngCookies', 'ngAnimate', 'ngRoute', 'googlechart', 'ui.bootstrap', 'infinite-scroll', 'smart-table', 'ngToast', 'angularSpinner', 'checklist-model', 'angucomplete-alt', 'ivh.treeview', 'angularUtils.directives.dirPagination', 'ngMaterial']);

var titleColumns = ['diggit_id' ,'title','season' ,'episode','studio','content_type','genre','mpaa_rating','imdb_id','episode_imdb_id',
	'episode_Year','episode_Rating','episode_Runtime' ,'episode_Genre','episode_Released','episode_Season','episode_title',
	'episode_Director','episode_Writer','episode_Cast','episode_Metacritic','episode_imdbRating','episode_imdbVotes','episode_Poster',
	'episode_Plot','episode_FullPlot','episode_Language','episode_Country','episode_Awards','Year','Rating','Runtime','Genre','Released',
	'Director','Writer','Cast','Metacritic','imdbRating','imdbVotes','Plot','FullPlot','Language','Country'];

var infohashesColumns = ['infohash','diggit_id','file_name','network','file_size','media_format','quality','audio_language','subtitle_language',
	'created_time','added_time','episode_title','added_by','languages','verified','resolution','aspect_ratio','frame_rate','subtitles','bitrate'];

var ipColumns = ['IP','Infohash','diggit_id','Port','Date','Continent','Country','Region','State','City','Latitude','Longitude','ISP',
	'OrganizationType','NameofProtocol'];


mvpApp.constant('root_url', server_path).service('Api', function(root_url) {
	this.root_url = root_url;
});

mvpApp.config(function($routeProvider, $httpProvider) {
	$routeProvider
		.when('/bulk', {
			templateUrl: 'views/bulkdata.html',
			controller: 'MainCtrl'
		})
		.when('/schedule', {
			templateUrl: 'views/schedule.html',
			controller: 'MainCtrl'
		})
		.when('/credentials', {
			templateUrl: 'views/credentials.html',
			controller: 'MainCtrl'
		})
		.when('/export', {
			templateUrl: 'views/export.html',
			controller: 'MainCtrl'
		})
		.when('/jobs', {
			templateUrl: 'views/jobs.html',
			controller: 'MainCtrl'
		})
		.otherwise({
			redirectTo: '/login'
		});
});


mvpApp.controller('MvpCtrl', ['$window', '$scope', '$location', function($window, $scope, $location) {
	$scope.activeMenu = "";
	$scope.setActive = function(menuItem) {
		$scope.activeMenu = menuItem
	}
}
]);

mvpApp.controller('dataExportForm', ['$window', '$scope', '$location', '$http', 'Api', 'ngToast', function($window, $scope, $location, $http, Api, ngToast) {
	$scope.ftp_acc_list = [];
	$http.get(Api.root_url+ "api/listftpaccounts").
	success(function (response, status, headers, config) {
		angular.forEach(response.values, function (v, k) {
			this.push(v);
		}, $scope.ftp_acc_list);
	}).
	error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
	$scope.exp = {};
	$scope.columns = [];
	/*
	$scope.exp = {
        startDate: new Date(),
        endDate: new Date()
    };
    $scope.dt1 = new Date($scope.exp.startDate);
    $scope.dt2 = new Date($scope.exp.endDate);
	*/
	$scope.loadColumns = function(value) {
		$scope.columns = [];
		$scope.exp.columns = [];
		if(value=='title'){
			$scope.columns = titleColumns; //mm_titles
		} else if(value=='infohashes'){
			$scope.columns = infohashesColumns; // infohashes
		} else if(value=='Diggit_IP'){
			$scope.columns = ipColumns;
		}
	};
	$scope.toggleAll = function() {
		if($scope.exp.genres_all == '1'){
			$scope.exp.genres = $scope.genreList.map(function(item) { return item.genre_id; });
		}
		else{
			$scope.exp.genres = [];
		}
	};
	$scope.toggleAllColumns = function() {
		if($scope.exp.columns_all == '1'){
			$scope.exp.columns = $scope.columns.map(function(item) { return item; });
		}
		else{
			$scope.exp.columns = [];
		}
	};
	$scope.exportData = function() {
		if((typeof $scope.exp.startDate == 'undefined') || (typeof $scope.exp.endDate == 'undefined')){
			alert("Please select date range");
		}
		else if(typeof $scope.exp.table == 'undefined'){
			alert("Please select table");
		}
		else if(typeof $scope.exp.columns == 'undefined' || $scope.exp.columns.length == 0){
			alert("Please select atleast one column");
		}
		else if(typeof $scope.exp.ftp_account_id == 'undefined'){
			alert("Please select FTP account");
		}
		else if($scope.exp.isGenre && (typeof $scope.exp.genres == 'undefined' || $scope.exp.genres.length == 0)){
			alert("Please select atleast one genre");
		}
		else{
			$scope.exp.startDate = formatDate($scope.exp.startDate);
			$scope.exp.endDate = formatDate($scope.exp.endDate);
			$http.post(Api.root_url+ "api/export", $scope.exp).
			success(function (data, status, headers, config) {
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content:data.values,
					dismissButton:true
				});
				$scope.exp = [];
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while saving data'
				});
			});
		}
	};
	$scope.dateOptions = {
		dateFormat:'dd-mm-yy',
    };
	$scope.genreList = [];
	$scope.isFilterByGenre = function() {
		if($scope.exp.isGenre){
			$http.get(Api.root_url+ "api/genres").
			success(function (response, status, headers, config) {
				angular.forEach(response.data.values, function (v, k) {
					this.push(v);
				}, $scope.genreList);
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while retrieving data'
				});
			});
		}
		else{
			$scope.genreList = [];
		}
	};
	
}
]);

mvpApp.controller('scheduleDataExport', ['$window', '$scope', '$location', '$http', 'Api', 'ngToast', function($window, $scope, $location, $http, Api, ngToast) {
	$scope.ftp_acc_list = [];
	$http.get(Api.root_url+ "api/listftpaccounts").
	success(function (response, status, headers, config) {
		angular.forEach(response.values, function (v, k) {
			this.push(v);
		}, $scope.ftp_acc_list);
	}).
	error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
	$scope.exp = {};
	$scope.columns = [];
	$scope.loadColumns = function(value) {
		$scope.columns = [];
		$scope.exp.columns = [];
		if(value=='title'){
			$scope.columns = titleColumns; //mm_titles
		} else if(value=='infohashes'){
			$scope.columns = infohashesColumns; // infohashes
		} else if(value=='Diggit_IP'){
			$scope.columns = ipColumns;
		}
	};
	$scope.toggleAll = function() {
		if($scope.exp.genres_all == '1'){
			$scope.exp.genres = $scope.genreList.map(function(item) { return item.genre_id; });
		}
		else{
			$scope.exp.genres = [];
		}
	};
	$scope.toggleAllColumns = function() {
		if($scope.exp.columns_all == '1'){
			$scope.exp.columns = $scope.columns.map(function(item) { return item; });
		}
		else{
			$scope.exp.columns = [];
		}
	};
	$scope.createSchedule = function() {
		if(typeof $scope.exp.schedule_title == 'undefined'){
			alert("Please enter schedule title");
		}
		else if(typeof $scope.exp.switch_3 == 'undefined'){
			alert("Please select schedule type");
		}
		else if(typeof $scope.exp.table == 'undefined'){
			alert("Please select table");
		}
		else if(typeof $scope.exp.columns == 'undefined' || $scope.exp.columns.length == 0){
			alert("Please select atleast one column");
		}
		else if(typeof $scope.exp.ftp_account_id == 'undefined'){
			alert("Please select FTP account");
		}
		else if($scope.exp.isGenre && (typeof $scope.exp.genres == 'undefined' || $scope.exp.genres.length == 0)){
			alert("Please select atleast one genre");
		}
		else{
			$http.post(Api.root_url+ "api/schedule", $scope.exp).
			success(function (data, status, headers, config) {
				console.log(data);
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content:'Data Export schedule has been saved successfully',
					dismissButton:true
				});
				$scope.exp = [];
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while saving data'
				});
			});
		}
	};
	$scope.dateOptions = {
		dateFormat:'dd-mm-yy',
    };
	$scope.genreList = [];
	$scope.isFilterByGenre = function() {
		if($scope.exp.isGenre){
			$http.get(Api.root_url+ "api/genres").
			success(function (response, status, headers, config) {
				angular.forEach(response.data.values, function (v, k) {
					this.push(v);
				}, $scope.genreList);
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while retrieving data'
				});
			});
		}
		else{
			$scope.genreList = [];
		}
	};
}
]);

mvpApp.controller('jobsManager', ['$window', '$scope', '$location', '$http', 'Api', 'ngToast', function($window, $scope, $location, $http, Api, ngToast) {
	$scope.jobs_data = [];
	$http.get(Api.root_url+ "api/listjobs").
	success(function (response, status, headers, config) {
		angular.forEach(response.values, function (v, k) {
			this.push(v);
		}, $scope.jobs_data);
	}).error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
}]);

mvpApp.controller('ftpAccountManager', ['$window', '$scope', '$location', '$http', 'Api', 'ngToast', function($window, $scope, $location, $http, Api, ngToast) {
	$scope.ftp_data = [];
	$scope.ftp = {};
	$http.get(Api.root_url+ "api/listftpaccounts").
	success(function (response, status, headers, config) {
		angular.forEach(response.values, function (v, k) {
			this.push(v);
		}, $scope.ftp_data);
	}).
	error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
	
	$scope.selectedRow = null;
	$scope.setClickedRow = function(index){
		$scope.selectedRow = index;
		angular.copy($scope.ftp_data[index], $scope.ftp);
	}
	
	$scope.resetForm = function(){
		angular.copy({},$scope.ftp);
		$scope.ftp = {
			ip:'146.148.110.133',
			port:22,
			location:'/home/jeevan_dataexport/',
			protocol:'SFTP'
		};
		$scope.selectedRow = null;
	}
	
	$scope.deleteFtp = function(){
		if (typeof $scope.ftp.ftp_account_id != 'undefined') {
			var deleteFtpAcc = $window.confirm('Are you absolutely sure you want to delete?');
			if (deleteFtpAcc) {
				$http.post(Api.root_url+ "api/deleteftpaccount", $scope.ftp).
				success(function (data, status, headers, config) {
					ngToast.create({
						dismissOnTimeout:true,
						timeout:4000,
						content:'FTP account has been deleted',
						dismissButton:true
					});
					angular.copy({},$scope.ftp);
					$scope.ftp_data = [];
					$http.get(Api.root_url+ "api/listftpaccounts").
					success(function (response, status, headers, config) {
						angular.forEach(response.values, function (v, k) {
							this.push(v);
						}, $scope.ftp_data);
					}).
					error(function (data, status, headers, config) {
						ngToast.create({
							className: 'danger',
							dismissButton:true,
							content: 'Error while retrieving data'
						});
					});
				}).
				error(function (data, status, headers, config) {
					ngToast.create({
						className: 'danger',
						dismissButton:true,
						content: 'Error while saving data'
					});
				});
			}
		}
	}
	
	$scope.saveFtp = function(){
		console.log($scope.ftp);
		if (typeof $scope.ftp.title == 'undefined') {
			alert("Please enter a title");
		} else if (typeof $scope.ftp.username == 'undefined') {
			alert("Please enter Username");
		} else if (typeof $scope.ftp.password == 'undefined') {
			alert("Please enter Password");
		} else {			
			$http.post(Api.root_url+ "api/saveftpaccount", $scope.ftp).
			success(function (data, status, headers, config) {
				if(data.values == 'USER_ADDED_SUCCESSFULLY'){
					ngToast.create({
						dismissOnTimeout:true,
						timeout:4000,
						content:'FTP account has been created successfully',
						dismissButton:true
					});
					$scope.ftp_data = [];
					$http.get(Api.root_url+ "api/listftpaccounts").
					success(function (response, status, headers, config) {
						angular.forEach(response.values, function (v, k) {
							this.push(v);
						}, $scope.ftp_data);
					}).
					error(function (data, status, headers, config) {
						ngToast.create({
							className: 'danger',
							dismissButton:true,
							content: 'Error while retrieving data'
						});
					});
				}
				else{
					ngToast.create({
						className: 'danger',
						dismissButton:true,
						content:data.values,
					});
				}
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while saving data'
				});
			});
		}
	}
}]);

mvpApp.config(function(ivhTreeviewOptionsProvider) {
		ivhTreeviewOptionsProvider.set({
		idAttribute: 'id',
		labelAttribute: 'label',
		childrenAttribute: 'children',
		selectedAttribute: 'selected',
		useCheckboxes: true,
		expandToDepth: 0,
		indeterminateAttribute: '__ivhTreeviewIndeterminate',
		expandedAttribute: '__ivhTreeviewExpanded',
		defaultSelectedState: true,
		validate: true,
		twistieExpandedTpl: '-',
		twistieCollapsedTpl: '+',
		twistieLeafTpl: '<leaf></leaf>'
	});
});

/*
mvpApp.directive('leaf', function($rootScope, makeTree) {
	return {
		restrict: 'AE',
		link: function(scope, element, attrs) {
			console.log(scope)
			element.text('#');
			element.on('click', function() {
				//element.text('@');
				setTimeout(function() {
					//element.text('#');
					scope.$apply(function() {
						Array.prototype.push.apply(scope.node.children,  makeTree(3, 3));
					});
				}, 500);
			});
		}
	};
});

mvpApp.controller('DemoCtrl', function($scope, ivhTreeviewBfs, ivhTreeviewMgr) {
	$scope.exp = {};
	var data = [{
			label: 'Asia',
			value: 'Asia',
			children: []
		},
		{
			label: 'Europe',
			value: 'Europe',
			children: []
		},
		{
			label: 'North America',
			value: 'North America',
			children: []
		},
		{
			label: 'South America',
			value: 'South America',
			children: []
		},
		{
			label: 'Oceania',
			value: 'Oceania',
			children: []
		},
		{
			label: 'Other',
			value: 'Other',
			children: []
		},
		{
			label: 'Africa',
			value: 'Africa',
			children: []
		}
		];
	
	$scope.exp.locations = [{
		label: 'Global',
		value: 'Global', 
		children: data
	}];
	
	var selectedNodes = [];
	ivhTreeviewBfs(data, function(node) {
		console.log(node);
		if(node.selected) {
			console.log(node);
			selectedNodes.push(node)
		}
	});
	
	
});

mvpApp.service('makeTree', function() {
	var t = [ 'Mustachio','Cane','Monacle','Umbrella','Headphones','Top hat','Fedora','Flat cap','Phone','Wallet','Squirrel','Wizard hat','Great sword',   'Playing cards','Post-it notes','Stickers','Tea','Patch'];
  
	var makeNode = function(label) {
		return {
			label: label,
			children: []
		};
	};
  
	return function(arity, count) {
		var list = count ? t.slice(0, count) : t.slice(0);
		var node = makeNode(list.shift())
			, nodes = [node]
			, tree = [node];
		while(list.length && nodes.length) {
			node = nodes.shift();
			while(list.length && node.children.length < arity) {
				node.children.push(makeNode(list.shift()));
			}
			Array.prototype.push.apply(nodes, node.children);
		}
		return tree;
	};
});
*/

mvpApp.controller('dataExportFilter', ['ivhTreeviewBfs', '$window', '$scope', '$location', '$http', 'Api', 'ngToast', function(ivhTreeviewBfs, $window, $scope, $location, $http, Api, ngToast) {
	$scope.columns = ipColumns;
	$scope.titleColumns = titleColumns;
	$scope.infohashesColumns = infohashesColumns;
	$scope.selectedMovies = [];
	$scope.selectedGroups = [];
	$scope.ftp_acc_list = [];
	$scope.ip_values = [];
	$scope.movies = [];
	$scope.groups = [];
	$scope.exp = {};
	$scope.exp.genres = [];
	$scope.genreList = [];
	$scope.headers = [];
	$scope.dataCount = -1;
	$scope.users = [];
    $scope.pageno = 1;
    $scope.total_count = 0;
    $scope.itemsPerPage = 20;
	/*
	$scope.exp = {
        startDate: new Date(),
        endDate: new Date()
    };
    $scope.dt1 = new Date($scope.exp.startDate);
    $scope.dt2 = new Date($scope.exp.endDate);
	*/
	$http.get(Api.root_url+ "api/genres").
	success(function (response, status, headers, config) {
		angular.forEach(response.data.values, function (v, k) {
			this.push(v);
		}, $scope.genreList);
	}).
	error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
	$scope.toggleAll = function() {
		if($scope.exp.genres_all == '1'){
			$scope.exp.genres = $scope.genreList.map(function(item) { return item.genre_id; });
		}
		else{
			$scope.exp.genres = [];
		}
	};
	$scope.toggleAllTitleColumns = function() {
		if($scope.exp.columns_all_title == '1'){
			$scope.exp.tColumns = $scope.titleColumns.map(function(item) { return item; });
		}
		else{
			$scope.exp.tColumns = [];
		}
	};
	$scope.toggleAllInfohashColumns = function() {
		if($scope.exp.columns_all_infohash == '1'){
			$scope.exp.infColumns = $scope.infohashesColumns.map(function(item) { return item; });
		}
		else{
			$scope.exp.infColumns = [];
		}
	};
	$scope.toggleAllColumns = function() {
		if($scope.exp.columns_all == '1'){
			$scope.exp.columns = $scope.columns.map(function(item) { return item; });
		}
		else{
			$scope.exp.columns = [];
		}
	};
	
	getMovies(function(data){
        $scope.movies = data;
    });
	getGroups(function(data){
        $scope.groups = data;
    });
	
	getLocations(function(data){
        $scope.exp.locations = [{
			label: 'Global',
			value: 'global',
			children: data
		}];
    });
	function getLocations(callback){
		var data = [{
			label: 'Asia',
			value: 'Asia',
			children: []
		},
		{
			label: 'Europe',
			value: 'Europe',
			children: []
		},
		{
			label: 'North America',
			value: 'North America',
			children: []
		},
		{
			label: 'South America',
			value: 'South America',
			children: []
		},
		{
			label: 'Oceania',
			value: 'Oceania',
			children: []
		},
		{
			label: 'Other',
			value: 'Other',
			children: []
		},
		{
			label: 'Africa',
			value: 'Africa',
			children: []
		}
		];
		callback(data);
		/*
		$http.get(Api.root_url + "api/getlocations").
		success(function (data) {
			callback(data);
		}).
		error(function (data) {
			console.log('error');
		});
		*/
    }

	function getMovies(callback){
        $http.get(Api.root_url + "api/getmovies").
		success(function (data) {                
			callback(data);
		}).
		error(function (data) {
			console.log('error');
		});
    }
	function getGroups(callback){
        $http.get(Api.root_url + "api/getgroups").
		success(function (data) {                
			callback(data);
		}).
		error(function (data) {
			console.log('error');
		});
    }
	$scope.selectedMovie = function ($item) {
        $scope.selectedMovies.push($item);
        console.log($item);
        $item.title // or description, or image - from your angucomplete attribute configuration
        $item.originalObject // the actual object which was selected
        this.$parent // the control which caused the change, contains useful things like $index for use in ng-repeat.
    }
	$scope.removeTitle = function ($item){
		var idx = $scope.selectedMovies.indexOf($item);
		$scope.selectedMovies.splice(idx, 1);
	}
	$scope.selectedGroup = function ($item) {
        $scope.selectedGroups.push($item);
        console.log($item);
        $item.title // or description, or image - from your angucomplete attribute configuration
        $item.originalObject // the actual object which was selected
        this.$parent // the control which caused the change, contains useful things like $index for use in ng-repeat.
    }
	$scope.removeGroup = function ($item){
		var idx = $scope.selectedGroups.indexOf($item);
		$scope.selectedGroups.splice(idx, 1);
	}
	$http.get(Api.root_url+ "api/listftpaccounts").
	success(function (response, status, headers, config) {
		angular.forEach(response.values, function (v, k) {
			this.push(v);
		}, $scope.ftp_acc_list);
	}).
	error(function (data, status, headers, config) {
		ngToast.create({
			className: 'danger',
			dismissButton:true,
			content: 'Error while retrieving data'
		});
	});
	
	$scope.submitForm = function() {
		if(typeof $scope.exp.columns == 'undefined' || $scope.exp.columns.length == 0){
			alert("Please select atleast one field");
		}
		else if(typeof $scope.exp.export_type == 'undefined' || $scope.exp.export_type.length == 0){
			alert("Please select Export Type");
		}
		else if(typeof $scope.exp.ftp_account_id == 'undefined'){
			alert("Please select FTP account");
		}
		else if(typeof $scope.exp.fileName == 'undefined'){
			alert("Please enter file name");
		}
		else if($scope.exp.export_type == '0' && typeof $scope.exp.frequency == 'undefined'){
			alert("Please select frequency");
		}
		else if($scope.exp.export_type == '0' && typeof $scope.exp.schedule_title == 'undefined'){
			alert("Please enter schedule title");
		}
		else{
			if($scope.selectedMovies.length > 0){
				$scope.exp.selected_titles = $scope.selectedMovies;
			}
			if($scope.selectedGroups.length > 0){
				$scope.exp.selected_groups = $scope.selectedGroups;
			}
			$http.post(Api.root_url+ "api/exportsave", $scope.exp).
			success(function (data, status, headers, config) {
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content: data.values,
					dismissButton:true
				});
				$scope.exp = [];
			}).
			error(function (data, status, headers, config) {
				ngToast.create({
					className: 'danger',
					dismissButton:true,
					content: 'Error while saving data'
				});
			});
		}
		
		
	};
	
	$scope.dataCount = 0;
	$scope.ip_values = [];
	$scope.title_values = [];
	$scope.infohashes_values = [];
	$scope.exp.itemsPerPage = 20;
	$scope.exp.pagenumber = 1;
	$scope.exp.tPagenumber = 1;
	$scope.exp.iPagenumber = 1;
	$scope.exp.tColumns = ['diggit_id' ,'title','season' ,'episode','studio','content_type'];
	$scope.exp.infColumns = ['infohash','diggit_id','file_name','network'];
	$scope.headers = [];
	$scope.getAllData = function(){
		$scope.exp.pagenumber = 1;
		$scope.exp.tPagenumber = 1;
		$scope.exp.iPagenumber = 1;
		if($scope.selectedMovies.length > 0){
			$scope.exp.selected_titles = $scope.selectedMovies;
		}
		if($scope.selectedGroups.length > 0){
			$scope.exp.selected_groups = $scope.selectedGroups;
		}
		$http.post(Api.root_url+ "api/filterData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.ip_values = data.values;
			$scope.total_count = data.total_count / $scope.itemsPerPage;
			if((typeof data.headers == 'undefined') || (data.headers.length == 0)){
				$scope.headers = ["Infohash", "TitleID", "Date", "IP", "Port"];
			}
			else{
				$scope.headers = data.headers;
			}
			if(data.total_count > 0){
				$scope.dataCount = 1;
			}
			else{
				$scope.dataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
		$http.post(Api.root_url+ "api/filterTitleData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.title_values = data.values;
			$scope.total_title_count = data.total_count / $scope.itemsPerPage;
			$scope.tHeaders = data.headers;
			if(data.total_count > 0){
				$scope.tDataCount = 1;
			}
			else{
				$scope.tDataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
		$http.post(Api.root_url+ "api/filterInfohashesData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.infohashes_values = data.values;
			$scope.total_infohashes_count = data.total_count / $scope.itemsPerPage;
			$scope.iHeaders = data.headers;
			if(data.total_count > 0){
				$scope.iDataCount = 1;
			}
			else{
				$scope.iDataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
    };	
	$scope.getIPData = function(pageno){
		console.log("pageno : " + pageno);
		$scope.exp.pagenumber = pageno;
		$http.post(Api.root_url+ "api/filterData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.ip_values = data.values;
			$scope.total_count = data.total_count / $scope.itemsPerPage;
			if(data.total_count > 0){
				$scope.dataCount = 1;
			}
			else{
				$scope.dataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
    };
	$scope.getTitleData = function(pageno){
		$scope.exp.tPagenumber = pageno;
		$http.post(Api.root_url+ "api/filterTitleData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.title_values = data.values;
			$scope.total_title_count = data.total_count / $scope.itemsPerPage;
			$scope.tHeaders = data.headers;
			if(data.total_count > 0){
				$scope.tDataCount = 1;
			}
			else{
				$scope.tDataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
    };
	$scope.getInfohashesData = function(pageno){
		$scope.exp.iPagenumber = pageno;
		$http.post(Api.root_url+ "api/filterData", $scope.exp).
		success(function (data, status, headers, config) {
			$scope.infohashes_values = data.values;
			$scope.total_infohashes_count = data.total_count / $scope.itemsPerPage;
			if(data.total_count > 0){
				$scope.iDataCount = 1;
			}
			else{
				$scope.iDataCount = -1;
			}
		}).
		error(function (data, status, headers, config) {
			ngToast.create({
				className: 'danger',
				dismissButton:true,
				content: 'Error while saving data'
			});
		});
    };
	$scope.dateOptions = {
		dateFormat:'dd-mm-yy',
    };
	$scope.view_tab = 'tab1';
	$scope.changeTab = function(tab) {
		$scope.view_tab = tab;
	}
	$scope.getAllData();
}
]);

mvpApp.config(function($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function(date) {
       return (typeof date != 'undefined')? moment(date).format('YYYY-MM-DD') : '';
    };
});

mvpApp.directive('datepickerPopup', function (dateFilter,$parse){
	return {
		restrict: 'EAC',
		require: '?ngModel',
		link: function(scope,element,attrs,ngModel,ctrl) {
			ngModel.$parsers.push(function(viewValue){
				return dateFilter(viewValue,'yyyy-MM-dd');
			});
		}
	}
});

mvpApp.controller('NavBarCtrl', ['$scope', '$location', function($scope, $location) {

}]);

function formatDate(d) {
	var date = new Date(d);
	var month = '' + (date.getMonth() + 1);
	var day = '' + date.getDate();
	var year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
