angular.module('services.SGUI', [])

.service('sgUI', function ($ionicHistory, $ionicLoading, $ionicPopup, $state, goFIRST) {

    this.goFirst = function() {
        return $state.go(goFIRST);
    };

    this.goBack = function () {
        var backView = $ionicHistory.backView();
        backView && backView.go();
    };

	this.getDisplayID=function(id) {
		return id.substr(0,6)+"-"+id.substr(6,4)+"-"+id.substring(10);
	};

	this.ucfirst = function (str) {
	    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

	this.trimmed = function (str) {
	    try {
	        return str.trim();
	    } catch (e) {
	        return "";
	    }
	};

	this.goBack = function () {
	    var backView = $ionicHistory.backView();

	    backView && backView.go();
	};

	this.handleNetworkError = function (error) {
	    error = error | { status: 0 };

	    $ionicLoading.hide();

	    var msg = "Data unavailable. Please check your network correction and try again.";
	    if (error.status == 404) {
	        msg = "Sorry, the data you requested is not available";
	    }
	    $ionicPopup.alert({
	        title: 'Failed to fetch data',
	        content: msg
	    }).then(this.goBack);
	};

	this.startLoading = function (message) {
	    $ionicLoading.show({ content: message, animation: 'fade-in' });
	};

	this.stopLoading = function () {
	    $ionicLoading.hide();
	};
})



;

