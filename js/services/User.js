'use strict';


angular.module('services.User', ['ngResource', 'ngStorage', 'services.SGCore'])

.service('UserAuth', function ($log, $q, $localStorage, $ionicPopup, $ionicLoading, $resource, $rootScope, sgCache, sgAuth, SG_URL) {
    var default_user = {
        'login': 'public',
        'password': 'public'
    };

    return {
        currentUser: $localStorage.$default({ 'user': default_user }).user,

        ///////////////////////////////////////////////////////////////////
        //
        // methods

        isLoggedIn : function() {
            return this.currentUser.login != default_user.login;
        }

        , login: function (name, password) {
            var deferred = $q.defer();

            $ionicLoading.show({ content: "Logging in", animation: 'fade-in' });

            var set_user = this;

            this.isValidUser(name, password).then(function (valid) {
                $ionicLoading.hide();

                if (valid) {
                    set_user.currentUser = {
                        'login': name,
                        'password': password
                    };

                    $localStorage.user = set_user.currentUser;

                    // clear everything so we query with the new user credentials
                    sgCache.reset();

                    set_user.broadcast();

                    deferred.resolve(true);
                } else {
                    $ionicPopup.alert({
                        title: 'Login Failed',
                        content: 'Please check your username and password and try again'
                    }).then(function () {
                        deferred.resolve(false);
                    });
                }

            });

            return deferred.promise;
        }

        , logout: function () {
            $log.debug("LOGOUT");
            this.currentUser = default_user;
            $localStorage.user = this.currentUser;

            // clear everything so we query with the new user credentials
            sgCache.reset();

            this.broadcast();
        }

        , broadcast: function () {
            $rootScope.$broadcast("login");
        }

        /**
        *   @description
        *       checks if user_id/password are valid user login
        *
        *   @param {string} user_id
        *   @param {string} password
        *
        *   @returns promise of (boolean) returning true if valid user, false if not
        */
		, isValidUser: function (user_id, password) {
		    var url = SG_URL.replace(':location', 'user.json');

		    var rest = $resource(url, {}, {
		        'query': {
		            // user.json results a single result, not a list
		            'method': 'GET', isArray: false
		        }
		    });

		    var deferred = $q.defer();

		    rest.query(sgAuth.request(user_id, password), function (result) {

		        if (result && result.first_name && result.last_name) {
		            // this looks like we got a user
		            deferred.resolve(true);
		        } else {
		            // not a user - probably mistakenly redirected to Login.aspx
		            deferred.resolve(false);
		        }
		    },
            function (error) {
                // most likely a 404 (user unknown) - we don't care as we haven't verified the user regardless
                deferred.resolve(false);
            });

		    return deferred.promise;
		}
    };
});

