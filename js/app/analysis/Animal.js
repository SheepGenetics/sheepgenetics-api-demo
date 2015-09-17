'use strict';

/*
 * list of available analyses
 */
angular.module('controllers.Animal', ['ionic'])

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
		.state('app.animal', {
		    url: "/animal/:anid",
		    views: {
		        'menuContent': {
		            templateUrl: "js/app/analysis/animal.html",
		            controller: "AnimalDetailsCtl"
		        }
		    }
		})

    	.state('app.pedigree', {
    	    url: "/animal/pedigree/:anid",
    		views: {
    		    'menuContent': {
    		        templateUrl: "js/app/analysis/pedigree.html",
    		        controller: "AnimalPedigreeCtl"
    		    }
    		}
    	})
    ;
})

//	display a single animal
//
.controller('AnimalDetailsCtl', function ($q, $state, $scope, $stateParams, $ionicPopup, sgUI, AppState, sgAnalyses, UserAuth) {
    var anid = $stateParams.anid;

    $scope.analysis = AppState.activeAnalysis();

    sgAnalyses.getAnimalDetailsById(UserAuth.currentUser, AppState.activeAnalysis(), anid).then(
        function (animal) {
            $scope.animal = animal;
        },
        sgUI.handleNetworkError       
    );
})

.controller('AnimalPedigreeCtl', function ($q, $state, $scope, $stateParams, sgUI, AppState, sgAnalyses, UserAuth) {
    var anid = $stateParams.anid;

    sgAnalyses.getAnimalPedigreeById(UserAuth.currentUser, AppState.activeAnalysis(), anid).then(
        function (pedigree) {
            $scope.pedigree = pedigree;
            $scope.analysis = AppState.activeAnalysis();
        },
        sgUI.handleNetworkError
    );

    $scope.goBack = sgUI.goBack;     
})

;


