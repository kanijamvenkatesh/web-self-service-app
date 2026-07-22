(function () {
    'use strict';

    angular.module('selfService')
        .controller('LoginCtrl', ['$scope', '$rootScope', '$state', '$mdToast',
            'AUTH_EVENTS', 'AuthService', 'AccountService', 'TradeFinanceService', LoginCtrl]);

    function LoginCtrl($scope, $rootScope, $state, $mdToast,
        AUTH_EVENTS, AuthService, AccountService, TradeFinanceService) {

        var vm = this;
        vm.authenticating = false;
        vm.showPassword = false;

        $scope.loginData = {
            username: '',
            password: '',
            role: 'BUYER'
        };

        $scope.doLogin = function () {
            vm.authenticating = true;

            var role = $scope.loginData.role;
            var username = $scope.loginData.username;
            var password = $scope.loginData.password;
            var fineractCredentials = {
                username: username,
                password: password
            };

            if (role === 'BUYER') {
                AuthService.doLogin().save(fineractCredentials).$promise
                    .then(function (result) {
                        AuthService.setUser(result, 'BUYER');

                        if (result.isTwoFactorAuthenticationRequired === true) {
                            vm.authenticating = false;
                            $state.go('twofactor');
                            return;
                        }

                        AccountService.getClients().get().$promise
                            .then(function (res) {
                                vm.authenticating = false;
                                if (res.pageItems && res.pageItems.length !== 0) {
                                    AccountService.setClientId(res.pageItems[0].id);
                                    $state.go('app.dashboard');
                                    showToast('Successful Buyer Login');
                                } else {
                                    showToast('Error: No Buyer Profile Linked');
                                    AuthService.logout();
                                }
                            })
                            .catch(function () {
                                vm.authenticating = false;
                                showToast('Not registered as Self-Service client');
                                AuthService.logout();
                            });
                    })
                    .catch(function () {
                        vm.authenticating = false;
                        showToast('Invalid Buyer Credentials');
                    });

            } else if (role === 'STAFF') {
                AuthService.doStaffLogin().save(fineractCredentials).$promise
                    .then(function (result) {
                        AuthService.setUser(result, 'STAFF');
                        AccountService.setClientId(null);
                        vm.authenticating = false;
                        $state.go('app.tradefinance');
                        showToast('Successful Staff Login');
                    })
                    .catch(function () {
                        vm.authenticating = false;
                        showToast('Invalid Staff Credentials');
                    });

            } else if (role === 'SELLER') {
                TradeFinanceService.sellerLogin(username, password)
                    .then(function (res) {
                        vm.authenticating = false;
                        AuthService.setSellerUser(res.data);
                        AccountService.setClientId(null);
                        $state.go('app.tradefinance');
                        showToast('Successful Seller Login');
                    })
                    .catch(function (error) {
                        vm.authenticating = false;
                        var message = 'Seller login failed';
                        if (error && error.status === 401) {
                            message = 'Seller username or password is incorrect';
                        } else if (error && error.status) {
                            message += ' (' + error.status + '): ' + (error.data || 'Trade middleware request failed');
                        }
                        showToast(message);
                        AuthService.logout();
                    });
            }
        };

        function showToast(text) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(text)
                    .hideDelay(2500)
                    .position('top right')
            );
        }
    }
})();
