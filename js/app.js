'use strict';

angular.module('SG', [
		'ionic' 
		,'angular-data.DSCacheFactory'
		,'controllers.Main'
		,'controllers.Datasets'
		,'controllers.Analysis'
		,'controllers.Charts'
		,'controllers.Animal'
		,'controllers.FirstTime'
		,'services.User'
		,'services.SGUI'
		,'services.SGCore'
		,'services.SGAPI'
		,'services.AppState'
		])

.run(function($ionicPlatform, $state, $localStorage, AppState) {
	$ionicPlatform.ready(function() {
	// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	// for form inputs)
	if(window.cordova && window.cordova.plugins.Keyboard) {
	  cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	}

	if(window.StatusBar) {
	  // org.apache.cordova.statusbar required
	  StatusBar.styleDefault();
	}

	// $localStorage.$reset(); // uncomment to debug running from a completely fresh start

	if(AppState.isFirstTime()) {
		$state.go("app.first-time");
	}
  });
})

.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, DSCacheFactoryProvider) {

	DSCacheFactoryProvider.setCacheDefaults({
		maxAge: 			900000, // 15 mins
		cacheFlushInterval: 3600000
	});

	// $ionicConfigProvider.backButton.text('').previousTitleText(false);

	$stateProvider
	    .state('app', {
	      url: "/app",
	      abstract: true,
	      templateUrl: "js/menu.html",
	      controller: 'AppCtrl'
	    });

  // if no states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/analysis-list');
});

