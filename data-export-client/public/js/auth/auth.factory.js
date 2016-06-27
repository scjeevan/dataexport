mvpApp.factory('AuthStatus', function () {
    var status = {
        isLogged: false,
        roles: [],
        user: {},
        clear: function () {
            this.isLogged = false,
            this.roles = [];
            this.user = {};
            this.isLogged = true;
            this.roles = ['CONTENT', 'TITLE MANAGEMENT'];
            this.user = 'Test';
        },
        set: function (response) {
            if (response.status == 200 && response.data && response.data.token) {
                this.isLogged = true;
                this.roles = response.data.role;
                this.user = response.data.user;
            }
        }
    }

    return status;
});


mvpApp.factory('AuthenticationFactory', function ($http, $q, $timeout, Api, $location, AuthStatus, ROLES) {
    function directTo(roles) {
        if (roles.indexOf(ROLES.CONTENT) >= 0) {
            $location.path("/home");
        }
        else if (roles.indexOf(ROLES.TITLE_MANAGEMENT) >= 0) {
            $location.path("/groups");
        }

    }
    var auth = {
        check: function () {
            var deferred = $q.defer();

            $http.get(Api.root_url + 'api/login').then(function (resopnse) {
                console.log(resopnse);
                if (resopnse.data.role.length == 0) {
                    AuthStatus.clear();
                    deferred.resolve(resopnse);
                }
                else {
                    AuthStatus.set(resopnse);
                    directTo(resopnse.data.role);
                    deferred.reject(resopnse);
                }

            }, function (status) {
                console.log(status);
                AuthStatus.clear();
                deferred.resolve(status);
            });

            return deferred.promise;
        }
    }

    return auth;
});

mvpApp.factory('UserAuthFactory', function ($window, $location, $cookies, Management, AuthStatus) {
    return {
        login: function () {
            $window.location.href = Management.mgmt_url + '/login';
        },
        logout: function () {

            if (AuthStatus.isLogged) {
                AuthStatus.clear();
                // remove any stale tokens
                $cookies.remove('token');
                $cookies.remove("token", { domain: ".diggit.com" });
                $location.path("/login");
            }

        }
    }
});

mvpApp.factory('TokenInterceptor', function ($q, $cookies, $location, AuthStatus) {
    var loginPageRedirectStatus = false;
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($cookies.get('token')) {
                config.headers.Authorization = 'Bearer ' + $cookies.get('token');
            } else {
                AuthStatus.clear();
            }

            return config;
        },
        responseError: function (response) {
            if (response.status === 401 || response.status === 403) {
                AuthStatus.clear();
                $location.path('/login');
                // remove any stale tokens
                $cookies.remove('token');
                $cookies.remove("token", { domain: ".diggit.com" });
                return $q.reject(response);
            }
            else {
                return $q.reject(response);
            }
        }
    };
});