'use strict';
//var server_path = 'http://146.148.110.133:4142/';
var server_path = 'http://104.197.10.155:80/';


var mvpApp = angular.module('dataExportApp', ['ngCookies', 'ngAnimate', 'ngRoute', 'googlechart', 'ui.bootstrap', 'infinite-scroll', 'smart-table', 'ngToast', 'angularSpinner', 'checklist-model', 'ui.date']);

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
	$scope.toggleAll = function() {
		var toggleStatus = !$scope.isAllSelected;
		angular.forEach($scope.genreList, function(itm){ 
			$scope.exp.genres = toggleStatus;
			console.log(toggleStatus);
		});
	}
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
	$scope.columns = ipColumns;
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
		var toggleStatus = $scope.isAllSelected;
		angular.forEach($scope.genreList, function(itm){ 
			$scope.exp.genres = toggleStatus;
		});
	};
	$scope.toggleAllColumns = function() {
		var toggleStatus = $scope.isAllSelectedColumns;
		angular.forEach($scope.genreList, function(itm){ 
			$scope.exp.columns = toggleStatus;
		});
	}
}
]);

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


