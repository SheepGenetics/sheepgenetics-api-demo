/*
 * controller for first run of the app to display welcome page
 */
angular.module('controllers.FirstTime',['ionic'])

.config(function($stateProvider,$urlRouterProvider) {
	$stateProvider
		.state('app.first-time', {
			url: "/first",
			views: {
				'menuContent': {
					templateUrl: "js/app/firsttime/first.html",
					controller: "FirstTimeCtl"
				}
			}
		});
})

.controller('FirstTimeCtl', function ($log,$scope, $state, $ionicHistory, $ionicPopup, sgUI, UserAuth, goFIRST) {
    $ionicHistory.nextViewOptions({
		// remove the back button from the next view so user can't navigate back here
		disableBack: true
	});

	$scope.doLogin = function () {
	    var user = sgUI.trimmed($scope.login.username);
	    var pass = sgUI.trimmed($scope.login.password);

	    if (user.length && pass.length) {
	        UserAuth.login($scope.login.username, $scope.login.password).then(function (valid) {
	            if (valid) {
	                $state.go(goFIRST);
	            }
	        });
	    } else if (!user.length) {
	        $ionicPopup.alert({
	            title: 'Username required',
	            content: 'Please enter your username'
	        });
	    } else {
	        $ionicPopup.alert({
	            title: 'Password required',
	            content: 'Please enter your password'
	        });
	    }
	};

	$scope.doPublic=function() {
		$state.go(goFIRST);
	};
});

