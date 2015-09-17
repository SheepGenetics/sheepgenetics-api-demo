/*
 * list of available datasets
 */
angular.module('controllers.Datasets',['ionic'])

.constant('goFIRST','app.dataset-list')

.config(function($stateProvider,$urlRouterProvider) {
	$stateProvider
		.state('app.dataset-list', {
			url: "/dataset-list",
			views: {
				'menuContent': {
					templateUrl: "js/app/dataset/dataset-list.html",
					controller: "DatasetListCtl"
				}
			}
		});
})

.controller('DatasetListCtl',function($scope,sgDatasets,UserAuth) {
	sgDatasets.list(UserAuth.currentUser).then(function(data) {
		$scope.datasets=data;
	});
});

