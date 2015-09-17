'use strict';

/*
	provide a FlockPicker service which displays a modal page for choosing a flock from the current analysis

	usage:
					
			// Make FlockPicker available to controller:
			.controller('ChartsCtl', function ($log, $state, $scope, FlockPicker) {
				// open flock picker when button is pressed on current page
				$scope.flock_click=function() {
					FlockPicker.init($scope,function(result) {
					});                    
				};

				};
			});

*/
angular.module('services.FlockPicker', ['ionic','ion-autocomplete'])

.service('FlockPicker', function ($ionicModal, $rootScope, $q, AppState, UserAuth, sgFlocks, sgUI) {
	
    var local_scope = $rootScope.$new();
   
	var init = function(current_flock, result_callback) {
		var promise = $ionicModal.fromTemplateUrl('js/services/FlockPicker.html', {
		    scope: local_scope,
			animation: 'slide-in-up'
		}).then(function (modal) {

            // doesn't work - display is messed up
		    //if (current_flock) {
		    //    local_scope.prepopulatedItems = [current_flock]; // default to current flock selection
		    //}

		    local_scope.modal = modal;
		    local_scope.modal.show();

		    local_scope.loading = true;

			sgUI.startLoading();

			local_scope.analysis = AppState.activeAnalysis();

			return sgFlocks.list(UserAuth.currentUser, local_scope.analysis);
		}, function (err) {
			$q.reject();    //  pass error on
		}).then(function (flocks) {
		    local_scope.loading = false;

		    local_scope.flocks = flocks;

			sgUI.stopLoading();
		},
		sgUI.handleNetworkError //  show error
		);         

        // filter function, returns flocks matching the query
		local_scope.getFlocks = function (query) {
		    query = query.toUpperCase();
		    var len = query.length;

		    var matches = [];
		    for (var i = 0; i < local_scope.flocks.length; i++) {
		        var fi = local_scope.flocks[i];
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

		local_scope.onSetFlock = function (details) {
		    local_scope.closeModal();

		    var flock = details.item;

		    console.log("setFlock");
		    console.log(flock);

			result_callback(flock);
		};

		local_scope.closeModal = function () {
		    local_scope.modal.remove();
		};

		local_scope.$on('$destroy', function () {
		    local_scope.modal.remove();
		});

		local_scope.onCancel = function (callback) {
		    local_scope.closeModal();
		};

		return promise;
	}
  
	return {
		init: init
	}
  
});

