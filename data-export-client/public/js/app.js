'use strict';
//var server_path = 'http://146.148.110.133:4142/';
var server_path = 'http://104.197.10.155:80/';


var mvpApp = angular.module('dataExportApp', ['ngCookies', 'ngAnimate', 'ngRoute', 'googlechart', 'ui.bootstrap', 'infinite-scroll', 'smart-table', 'ngToast', 'angularSpinner', 'checklist-model', 'ui.date', 'angucomplete-alt', 'ivh.treeview']);

var titleColumns = ["title_id", "title", "season", "episode", "studio", "content_type", "genre", "mpaa_rating", "imdb_id", "episode_imdb_id", "diggit_id"];
var infohashesColumns = ["infohash", "file_name", "created_by", "created_time", "added_time", "updated_time", "episode_title", "added_by", "languages", "verified", "media_format", "resolution", "aspect_ratio", "frame_rate", "subtitles", "bitrate", "quality", "no_of_files", "episode_id", "episode_airdate", "season", "source", "category", "torrent_url", "mm_hash_id", "mm_title_id", "file_size", "audio_language", "subtitle_language", "network", "metadata_source", "is_tracked"];
var ipColumns = ["Infohash", "TitleID", "Date", "IP", "Port", "Continent", "Country", "Region", "State", "City", "Latitude", "Longitude", "ISP", "OrganizationType", "NameofProtocol", "UniqueDownloads", "source"];


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
		.otherwise({
			redirectTo: '/login'
		});
});


mvpApp.controller('MvpCtrl', ['$window', '$scope', '$location', function($window, $scope, $location) {
	$scope.showMenu = true;
	$scope.isCollapsed = true;
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
	$scope.loadColumns = function(value) {
		$scope.columns = [];
		$scope.exp.columns = [];
		if(value=='title'){
			$scope.columns = titleColumns; //mm_titles
		} else if(value=='infohashes'){
			$scope.columns = infohashesColumns; // infohashes
		} else if(value=='ip'){
			$scope.columns = ipColumns;
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
			$http.post(Api.root_url+ "api/export", $scope.exp).
			success(function (data, status, headers, config) {
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content:data.values,
					dismissButton:true
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
		$scope.exp.columns = [];
		if(value=='title'){
			$scope.columns = titleColumns; //mm_titles
		} else if(value=='infohashes'){
			$scope.columns = infohashesColumns; // infohashes
		} else if(value=='ip'){
			$scope.columns = ipColumns;
		}
	};
	$scope.createSchedule = function() {
		if(typeof $scope.exp.switch_3 == 'undefined'){
			alert("Please select Schedule type");
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
		} else if (typeof $scope.ftp.ip == 'undefined') {
			alert("Please enter a Host");
		} else if (typeof $scope.ftp.port == 'undefined') {
			alert("Please enter a Port");
		} else if (typeof $scope.ftp.location == 'undefined') {
			alert("Please enter Location");
		} else if (typeof $scope.ftp.protocol == 'undefined') {
			alert("Please enter a Protocol");
		} else {
			$http.post(Api.root_url+ "api/saveftpaccount", $scope.ftp).
			success(function (data, status, headers, config) {
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content:'FTP account has been saved',
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

mvpApp.controller('dataExportFilter', ['$window', '$scope', '$location', '$http', 'Api', 'ngToast', function($window, $scope, $location, $http, Api, ngToast) {
	$scope.columns = infohashesColumns;
	$scope.selectedMovies = [];
	$scope.selectedGroups = [];
	$scope.ftp_acc_list = [];
	$scope.movies = [];
	$scope.groups = [];
	$scope.exp = {};
	$scope.exp.genres = [];
	var someobj = {
		'Africa': ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina faso', 'Burundi', 'Cameroon', 'Cape verde'],
		'Asia': ['Afghanistan', 'Antarctica', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bermuda', 'Bhutan'],
		'Europe': ['Aland islands', 'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium'],
		'North America': ['Aland islands', 'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium'],
		'Oceania': ['Aland islands', 'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium'],
		'Other': ['Aland islands', 'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium']
	};

	$scope.genreList = [];
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
	$scope.toggleAllColumns = function() {
		if($scope.exp.columns_all == '1'){
			$scope.exp.columns = $scope.columns.map(function(item) { return item; });
		}
		else{
			$scope.exp.columns = [];
		}
	};
	getLocations(function(data){
        $scope.locations = [{
			label: 'Global',
			value: 'global',
			children: data
		}];
    });
	getMovies(function(data){
        $scope.movies = data;
    });
	getGroups(function(data){
        $scope.groups = data;
    });
	function getLocations(callback){
		var data = [{
			label: 'Glasses',
			value: 'glasses',
			children: [{
				label: 'Top Hat',
				value: 'top_hat'
			},{
				label: 'Curly Mustache',
				value: 'mustachio'
			}]
		}];
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
		console.log("val : " + $scope.exp.genres_all );
	};
	/*
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
			$http.post(Api.root_url+ "api/export", $scope.exp).
			success(function (data, status, headers, config) {
				ngToast.create({
					dismissOnTimeout:true,
					timeout:4000,
					content:data.values,
					dismissButton:true
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
	};
	$scope.dateOptions = {
		dateFormat:'dd-mm-yy',
    };
	
	
	*/
}
]);

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
		twistieLeafTpl: '&nbsp;&nbsp;'
	});
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


