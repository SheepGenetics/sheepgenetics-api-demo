angular.module('services.AppState', ['ngStorage'])

.constant('appVersion','0.1')

.factory('AppState',function($log,$localStorage,appVersion) {
	var _ver=$localStorage.$default({ runVersion: '' }).runVersion;

	var service={

		/* is this the first time the the app has been run? */
		isFirstTime: function() {
			if(_ver != appVersion) {
				$localStorage.runVersion=appVersion;

				$log.debug("AppState: FIRST RUN");
				return true;
			}

			$log.debug("AppState: not first run");

			return false;						   
		},

		activeDataset: function(ds) {
			if(ds) {
				$localStorage.dataset=ds;
			}
			$log.debug("activeDataset:"+$localStorage.dataset);
			return $localStorage.dataset;
		},

		activeAnalysis: function(an) {
			if(an) {
				$localStorage.analysis=an;
			}
			$log.debug("activeAnalysis:"+$localStorage.analysis.title+" "+$localStorage.analysis.display_date);
			return $localStorage.analysis;
		}
	};

	return service;
});

