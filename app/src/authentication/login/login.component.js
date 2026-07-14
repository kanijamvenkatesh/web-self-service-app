(function () {
    'use strict';

    angular.module('selfService')
        .controller('LoginCtrl', ['$scope', '$rootScope', '$state', '$mdToast',
            'AUTH_EVENTS', 'AuthService', 'AccountService', LoginCtrl]);

    function LoginCtrl($scope, $rootScope, $state, $mdToast,
        AUTH_EVENTS, AuthService, AccountService) {

        var vm = this;
        vm.authenticating = false;

        $scope.doLogin = function () {
            vm.authenticating = true;

            AuthService.doLogin().save($scope.loginData).$promise
                .then(function (result) {

                    AuthService.setUser(result);

                    // ── 2FA required ─────────────────────────────────────────
                    if (result.isTwoFactorAuthenticationRequired === true) {
                        vm.authenticating = false;
                        $state.go('twofactor');   // redirect to OTP page
                        return;
                    }

                    // ── No 2FA — proceed normally ─────────────────────────────
                    AccountService.getClients().get().$promise
                        .then(function (res) {
                            vm.authenticating = false;
                            if (res.pageItems.length !== 0) {
                                AccountService.setClientId(res.pageItems[0].id);
                                $state.go('app.dashboard');
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Successful Login')
                                        .hideDelay(2000)
                                        .position('top right')
                                );
                            } else {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('No Clients Found')
                                        .hideDelay(2000)
                                        .position('top right')
                                );
                                AuthService.logout();
                            }
                        })
                        .catch(function () {
                            vm.authenticating = false;
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Not a Self Service User')
                                    .hideDelay(2000)
                                    .position('top right')
                            );
                            AuthService.logout();
                        });

                }).catch(function () {
                    vm.authenticating = false;
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Invalid Login Credentials')
                            .hideDelay(2000)
                            .position('top right')
                    );
                });
        };
    }

})();