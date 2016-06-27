'use strict';

mvpApp.controller('MainCtrl', function ($scope, $routeParams, $http, Api, ngToast, usSpinnerService) {
    var start = 0;
    var search = "";
    var orderBy = "nooffiles";//"timesdownloaded";
    var order = "DESC";

    function startSpinner() {
        if (!$scope.spinneractive) {
            usSpinnerService.spin('spinner-1');
        }
    }

    function stopSpinner() {
        if ($scope.spinneractive) {
            usSpinnerService.stop('spinner-1');
        }
    }

    if (typeof $routeParams.Search != "undefined") {
        search = $routeParams.Search;
    }

    $scope.movies = new Array();
    $scope.busy = false;
    $scope.viewType = 2; // 1: list view, 2: tile view

    $scope.orderByValues = [/*{
        name: 'Number of Downloads',
        value: 'timesdownloaded'
    },*/
    {
        name: 'Number of Files',
        value: 'nooffiles'
    },
    {
        name: 'Title',
        value: 'title'
    }];
    $scope.orderBy = function (selected) {
        orderBy = selected.value;
        start = 0;
        $scope.movies = new Array();
        $scope.busy = false;
        $scope.nextPage();

    };

   

    $scope.orderValues = [{
        name: 'Descending',
        value: 'DESC'
    }, {
        name: 'Ascending',
        value: 'ASC'
    }];
    $scope.order = function (selected) {
        order = selected.value;
        start = 0;
        $scope.movies = new Array();
        $scope.busy = false;
        $scope.nextPage();

    };

    $scope.delete = function (imdbId, index) {
       
        //startSpinner();
        var data = {
            imdbData: {
                imdbId: imdbId
            }
        };
        $http.post(Api.root_url + "api/deletetitlenew", data).
			success(function (data, status, headers, config) {
			    console.log(data);
			    //stopSpinner();
			    if (data.data.state == 'successful') {
			        ngToast.create({
			            className: 'success',
			            content: 'Data deleted successfully'
			        });
			        start--;
			        $scope.movies.splice(index, 1);
			    } else {
			        ngToast.create({
			            className: 'danger',
			            content: 'Error while deleting data'
			        });
			    }


			}).
			error(function (data, status, headers, config) {
			    //stopSpinner();
			    ngToast.create({
			        className: 'danger',
			        content: 'Error while deleting data'
			    });
			});
    };

    $scope.nextPage = function () {
        if (!$scope.busy) {
            $scope.busy = true;
            $http.get(Api.root_url + "api/videosnew?start=" + start + "&search=" + search + "&orderBy=" + orderBy + "&order=" + order).success(function (response) {
                angular.forEach(response.data, function (v, k) {
                    this.push(v);
                }, $scope.movies);
                start += response.data.length;
                $scope.busy = false;
                //stopSpinner();
                if (!start) {
                    ngToast.create({
                        className: 'danger',
                        content: 'No Result Found'
                    });
                    $scope.busy = true;
                }

            });
        }
    };


    $scope.isOwnFile = function (val) {
        var ownFile = false;
        if (parseInt(val) == 1) {
            ownFile = true;
        }
        return ownFile;
    }

});