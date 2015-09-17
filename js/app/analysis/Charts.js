'use strict';

/*
 * list of available analyses
 */
angular.module('controllers.Charts', ['ionic', 'chart.js', 'ion-autocomplete', 'services.SGChart', 'services.SGUtil'])

.config(function ($stateProvider) {
    $stateProvider
		.state('app.charts', {
		    url: "/charts/:analysis",
		    views: {
		        'menuContent': {
		            templateUrl: "js/app/analysis/charts.html",
		            controller: "ChartsCtl"
		        }
		    }
		})
    ;
})


//	manage display of charts based on the active analysis
//
.controller('ChartsCtl', function ($window, $log, $state, $scope, $stateParams, $ionicScrollDelegate, $q, AppState, sgAnalyses, sgFlocks, sgUtil, sgChart, sgUI, UserAuth, AnalysisSearchState) {

    ///////////////////////////////////////////////////////////////////////////
    //
    //  controller initialisation
    //

    $scope.loadController = function () {
        console.log(UserAuth.currentUser);

        $scope.flocks = null;
        $scope.chart1 = {};
        $scope.chart2 = {};

        $scope.setFlock(null);

        $scope.loading = true;

        sgUI.startLoading();

        sgAnalyses.get(UserAuth.currentUser, AppState.activeDataset(), $stateParams.analysis)
			.then(
				// receive analysis details, launch request for option list contents
				function (analysis) {
				    AppState.activeAnalysis(analysis);

				    $scope.analysis = analysis;

				    return sgFlocks.flock_analysis_data(UserAuth.currentUser, analysis);
				},
				function (err) {
				    $q.reject();    // pass error on
				})
			.then(
				// receive flock analysis data
				function (data) {
				    if (data.flocks && data.flocks.length) {
				        $scope.flocks = data.flocks;    //  list of flocks in the analysis visible to the current user
				        $scope.asbvs = data.asbvs;      //  list of asbvs in the analysis

				        $scope.drop_averages = sgUtil.group_sorted_by_nfield(data.drop_averages, 'breakdown', 'drop_year');

				        console.log("drop_averages");
				        console.log($scope.drop_averages);
				    } else {
				        $scope.flocks = null;
				    }
				},
				sgUI.handleNetworkError //  show error
			).finally(function () {
			    $scope.loading = false;

			    sgUI.stopLoading();
			});
    };

    $scope.$on("login", $scope.loadController); // if user login/logout then reload because flocks list will change

    ///////////////////////////////////////////////////////////////////////////
    //
    //  action handlers


    $scope.getFlockPickerFlocks = function (query) {
        query = query.toUpperCase();
        var len = query.length;

        var matches = [];
        for (var i = 0; i < $scope.flocks.length; i++) {
            var fi = $scope.flocks[i];
            if (fi.breed_flock_code.substring(0, len) == query || fi.description.substring(0, len) == query) {
                fi.name = "" + fi.breed_flock_code + " - " + fi.description;
                matches.push(fi);
                if (matches.length > 10) {
                    return matches;
                }
            }
        }

        return matches;
    };

    /*
	*   onSetFlock(flock)
	*
	*   Called when user chooses flock in the flock-picker.
    *
    *   Populates $scope.data with { details, flock_averages, group_averages, drop_year, break_downs }
	*/
    $scope.onFlockPickerSetFlock = function (item) {
        var flock = item.item;

        if ($scope.flock && flock && $scope.flock.breed_flock_code == flock.breed_flock_code) {
            return; // nothing changed
        }

        sgUI.startLoading();

        $scope.setFlock(flock);

        sgFlocks.get(UserAuth.currentUser, $scope.analysis, flock.breed_flock_code, flock.group_type.trim())
			.then(
			   function (data) {
			       // reset the traits to nothing selected
			       $scope.chart1.trait = "";
			       $scope.chart2.trait = "";

			       // set a default time span 
			       if (data.drop_years.length >= 5) {
			           if (!$scope.drop_year || $scope.drop_year > data.drop_years[data.drop_years.length - 1]) {
			               $scope.drop_year = data.drop_years[5];
			           }
			       }

			       // set a default break down
			       if (!$scope.chart1.break_down || data.break_downs.indexOf($scope.chart1.break_down) == -1) {
			           if (data.break_downs.indexOf('SIRES') > -1) {
			               $scope.chart1.break_down = 'SIRES';
			           } else {
			               $scope.chart1.break_down = data.break_downs[0];
			           }

			           $scope.chart2.break_down = $scope.chart1.break_down;
			       }

			       $scope.data_drop_years = data.drop_years;

			       $scope.data = {
			           details: data.details,
			           break_downs: data.break_downs,

			           // structure the data into breakdown groups so it is ready to extract for the charts
			           flock_averages: sgUtil.group_sorted_by_nfield(data.flock_averages, 'breakdown', 'drop_year'),
			           group_averages: sgUtil.group_sorted_by_nfield(data.group_averages, 'breakdown', 'drop_year')
			       };

                   //   construct the chart object which provides the data to the charts
			       $scope.chart = sgChart.get_trend_chart($scope.data.flock_averages, $scope.data.group_averages, $scope.drop_averages);
			   },
			   sgUI.handleNetworkError
		   ).finally(function () {
		       sgUI.stopLoading();		       
		   });
    };

    $scope.setFlock = function (flock) {
        console.log("setFlock"); console.log(flock);

        $scope.flock = flock;

        $scope.data = null;

        // hide until ready to redisplay so charts don't resize to zero height
        $scope.chart1_show = false;
        $scope.chart2.show = false;
    };

    $scope.onYearChange = function (year) {
        console.log("onYearChange " + year);

        $scope.drop_year = year;

        $scope.onDisplayChart1();
        $scope.onDisplayChart2();
    };

    /*
	*   onDisplayChart1()
	*
	*   user changed control which requires (re)rendering of chart1
	*/
    $scope.onDisplayChart1 = function () {
        if (!($scope.drop_year && $scope.chart1.trait && $scope.chart1.break_down)) {
            $scope.chart1_show = false;
            return; // nothing to render
        }

        $scope.chart1.data = $scope.chart.data($scope.drop_year, $scope.chart1.break_down, $scope.chart1.trait);
       
        $scope.chart1_show = true;
    };

    $scope.onDisplayChart2 = function () {
        if (!($scope.drop_year && $scope.chart2.trait && $scope.chart2.break_down)) {
            $scope.chart2.show = false;
            return; // nothing to render
        }

        $scope.chart2.data = $scope.chart.data($scope.drop_year, $scope.chart2.break_down, $scope.chart2.trait);
        
        $scope.chart2.show = true;
    };

    $scope.line_chart_options = {
        bezierCurve: true,
        showTooltips: false,
        responsive: true,
        animation: true,
        maintainAspectRatio: true
    };

    /////////////////////////////////////////////
    // run controller code
    //
    if (!AppState.activeDataset()) { // only if debugging in browser?
        return sgUI.goFirst(); // bounce back to the first page
    }

    // initial load of the controller
    $scope.loadController();


})

;

