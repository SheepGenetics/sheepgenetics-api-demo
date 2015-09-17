'use strict';

/*
 * list of available analyses
 */
angular.module('controllers.Analysis',['ionic'])

.config(function($stateProvider) {
    $stateProvider
		.state('app.analysis', {
			url: "/analysis/:analysis",
			views: {
				'menuContent': {
					templateUrl: "js/app/analysis/analysis.html",
					controller: "AnalysisCtl"
				}
			}
		})
		.state('app.analysis_list', {
			url: "/analysis-list/:dataset",
			views: {
				'menuContent': {
					templateUrl: "js/app/analysis/analysis-list.html",
					controller: "AnalysisListCtl"
				}
			}
		})
		.state('app.active-analysis-list', {
			url: "/analysis-list",
			views: {
				'menuContent': {
					templateUrl: "js/app/analysis/analysis-list.html",
					controller: "ActiveAnalysisListCtl"
				}
			}
		});
})

.factory('AnalysisSearchState', function () {
	return {
		animalId: '',
		showAdvanced: false,
		query: {
		    asbv_min: {},
		    asbv_max: {}
		},
		results: false,
		limit: 30,  //  default max number of results displayed

		analysis: { id: 0, dataset: 0 },

		resetForAnalysis: function (analysis) {
			if (analysis.dataset != this.analysis.dataset || analysis.id != this.analysis.id) {
				this.animalId = '';
				this.showAdvanced = false;
				this.query = {
				    asbv_min: {},
				    asbv_max: {}
				};
				this.results = false;
				this.limit = 30;

				this.analysis.dataset = analysis.dataset;
				this.analysis.id = analysis.id;
			}
		}
	};
})
//	display view for searching/interacting with the active analysis
//
.controller('AnalysisCtl', function ($log, $state, $scope, $stateParams, $ionicScrollDelegate, $q, AppState, sgAnalyses, sgUI, UserAuth, AnalysisSearchState) {
	var dataset=AppState.activeDataset();
	if(!dataset) {
		// bounce back to the first page
	    return sgUI.goFirst();
	}

    // fetch details of the current analysis and then populate the page
	sgAnalyses.get(UserAuth.currentUser, dataset, $stateParams.analysis)
		.then(function (analysis) {
		    AppState.activeAnalysis(analysis);
		    AnalysisSearchState.resetForAnalysis(analysis);

		    $scope.analysis = analysis; // for 'then' and display rendering

		    $scope.anid = AnalysisSearchState.anid;
		    $scope.query = AnalysisSearchState.query;
		    $scope.showAdvanced = AnalysisSearchState.showAdvanced;
		    $scope.results = AnalysisSearchState.results;
		    $scope.showResults = AnalysisSearchState.results !== false;
		    $scope.limit = AnalysisSearchState.limit;

		    return sgAnalyses.options(UserAuth.currentUser, analysis);
		}, function (err) {
		    $q.reject();
		}).then(function (options) {
		    $scope.options = options;

            // default to first in list, now we have all the options populated
		    $scope.query.SortBy = AnalysisSearchState.query.SortBy ? AnalysisSearchState.query.SortBy : options.sorts[0].id;

		    return sgAnalyses.asbvDefinitions(UserAuth.currentUser, $scope.analysis);
		}, function (err) {
		    $q.reject();
		}).then(function (asbvs) {
		    $scope.asbvs = asbvs;
		},
        sgUI.handleNetworkError);

	// handle advanced search for animals in active analysis
	$scope.searchAnalysis = function () {
	    AnalysisSearchState.showAdvanced = $scope.showAdvanced = false;

		AnalysisSearchState.query = $scope.query;

		sgAnalyses.search(UserAuth.currentUser, AppState.activeAnalysis(), $scope.query).then(
            function (result) {
                if (result && result.length>0) {
                    $scope.results = result;
                } else {
                    $scope.results = false;
                }
                AnalysisSearchState.results = result;

                $scope.showResults = true;

                // scroll page to top because results list can be scrolled out of sight because user
                // has scrolled down through the advanced search options
                //
                $ionicScrollDelegate.scrollTop();

                if (result && result.length == 1) {
                    // display the one match without making the user click into the animal
                    $state.go('app.animal', { anid: result[0].id });
                }
            },
            sgUI.handleNetworkError
        );
	};

	$scope.toggleShowAdvanced = function () {
	    $scope.showAdvanced = !$scope.showAdvanced;
	    AnalysisSearchState.showAdvanced = $scope.showAdvanced; // remember state for when we return to this page from viewing an animal
	};

    // 'infinite scroll' so we can cheat and just render part of the animal list initially.
    // With a 200 animal list this makes stepping back from viewing an animal a lot
    // faster on a phone.
    //
	$scope.loadMoreData = function () {
	    //$log.debug("loadMoreData");

	    AnalysisSearchState.limit += 20;
	    $scope.limit = AnalysisSearchState.limit;
	    $scope.$broadcast('scroll.infiniteScrollComplete');
	    // $scope.$broadcast('scroll.resize');
	};

	$scope.moreDataCanBeLoaded = function () {
	    var more = AnalysisSearchState.results && $scope.limit < AnalysisSearchState.results.length;
	    // $log.debug("moreDataCanBeLoaded: " + more + " " + $scope.limit + " < " + AnalysisSearchState.results.length);
	    return more;
	};
})

//	list analyses in the selected dataset ($stateParams.dataset)
//
.controller('AnalysisListCtl', function ($scope, $stateParams, AppState, sgUI, sgAnalyses, UserAuth) {
	var dataset=$stateParams.dataset;
	if(!dataset) {
		// bounce back to the first page
	    return sgUI.goFirst();
	}

	// store the selected dataset as we need this when restarting the app
	// and viewing within an analysis
	AppState.activeDataset(dataset);

	var user=UserAuth.currentUser;

	sgAnalyses.list(user, dataset).then(function (data) {
		$scope.analyses=data;
	    },
		sgUI.handleNetworkError
    );
})

//	list analyses in the default active dataset (AppState.activeDateset())
//
.controller('ActiveAnalysisListCtl',function($scope,AppState,sgUI,sgAnalyses,UserAuth,$state) {
	var dataset=AppState.activeDataset();
	if(!dataset) {
		// bounce back to the first page
	    return sgUI.goFirst();
	}

	var user=UserAuth.currentUser;

	sgAnalyses.list(user,dataset).then(function(data) {
	    $scope.analyses=data;
	    },
		sgUI.handleNetworkError       
    );
});

