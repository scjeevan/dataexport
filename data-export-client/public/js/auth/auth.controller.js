mvpApp.controller('LoginCtrl', ['$scope','UserAuthFactory',
		function ($scope, UserAuthFactory) {
			$scope.login = function () {
				UserAuthFactory.login();
			};
		}
	]);
