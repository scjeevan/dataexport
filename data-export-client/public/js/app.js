'use strict';
var server_path = 'http://146.148.110.133:4142/';

var mvpApp = angular.module('dataExportApp', ['ngCookies', 'ngAnimate', 'ngRoute', 'googlechart', 'ui.bootstrap', 'infinite-scroll', 'smart-table', 'ngToast', 'angularSpinner', 'checklist-model', 'ui.date']);

mvpApp.constant('root_url', server_path).service('Api', function(root_url) {
	this.root_url = root_url;
});

mvpApp.config(function($routeProvider, $httpProvider) {
	$routeProvider
		.when('/bulk', {
			templateUrl: 'views/bulkdata.html',
			controller: 'MainCtrl'
		})
		.when('/thematic', {
			templateUrl: 'views/thematicdata.html',
			controller: 'MainCtrl'
		})
		.when('/credentials', {
			templateUrl: 'views/credentials.html',
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

mvpApp.controller('dataExportForm', ['$window', '$scope', '$location', '$http', 'Api', function($window, $scope, $location, $http, Api) {
	$scope.exp = {};
	$scope.table = "Title Table";
	$scope.columns = ["title", "season", "episode", "studio", "content-type", "genre", "mpaa_rating"]; //mm_titles
	$scope.loadColumns = function(value) {
		if(value=='title'){
			$scope.table = "Title Table";
			$scope.columns = ["title", "season", "episode", "studio", "content-type", "genre", "mpaa_rating"]; //mm_titles
		} else if(value=='infohash'){
			$scope.table = "Infohash Table";
			$scope.columns = ["infohash", "file_name", "created_by", "created_time", "added_time", "updated_time", "episode_title", "added_by", "languages", "verified"]; // infohashes
		} else if(value=='ip'){
			$scope.table = "IP";
			$scope.columns = ["Infohash", "Type", "TimeStamp", "Aspect Ratio"];
		}
	};
	$scope.exportData = function() {
		if((typeof $scope.exp.startDate == 'undefined') || (typeof $scope.exp.endDate == 'undefined')){
			alert("Please select date range");
		}
		else if(typeof $scope.exp.optradio == 'undefined'){
			alert("Please select table");
		}
		else if(typeof $scope.exp.columns == 'undefined'){
			alert("Please select atleast one column");
		}
		else{
			$http.post(Api.root_url+ "api/export", $scope.exp).
			success(function (data, status, headers, config) {
				console.log(data);
				ngToast.create('Data saved successfully');
			}).
			error(function (data, status, headers, config) {
				alert("Error while saving data");
			});
		}
	};
	$scope.dateOptions = {
		dateFormat:'dd-mm-yy',
    };
}
]);


mvpApp.controller('ftpAccountManager', ['$window', '$scope', '$location', '$http', 'Api', function($window, $scope, $location, $http, Api) {
	$http.get(Api.root_url+ "api/listftpaccounts").
			success(function (data, status, headers, config) {
				console.log(data);
				ngToast.create('Data saved successfully');
			}).
			error(function (data, status, headers, config) {
				alert("Error while saving data");
			});
}]);

mvpApp.controller('NavBarCtrl', ['$scope', '$location', function($scope, $location) {

}]);


