angular.module('controllers.Main', [])

.controller('AppCtrl', function ($scope, $ionicModal, $ionicPopup, sgUI, UserAuth) {
    $scope.logged_in = UserAuth.isLoggedIn();
    $scope.user = UserAuth.currentUser.login;

    $ionicModal.fromTemplateUrl("js/app/main/login.html", {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

    $scope.login = function () {
        $scope.modal.show();
    };

    $scope.logout = function () {
        UserAuth.logout();
        $scope.logged_in = UserAuth.isLoggedIn();
    };

    //  handle menu request to launch login modal form
    $scope.doLogin = function () {
        var user = sgUI.trimmed($scope.login.username);
        var pass = sgUI.trimmed($scope.login.password);

        if (user.length && pass.length) {
            UserAuth.login(user, pass).then(function (valid) {
                if (valid) {
                    $scope.logged_in = UserAuth.isLoggedIn();
                    $scope.user = UserAuth.currentUser.login;

                    $scope.closeLogin();
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


});