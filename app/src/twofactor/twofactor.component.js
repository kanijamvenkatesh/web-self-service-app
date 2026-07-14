(function () {
    'use strict';

    angular.module('selfService')
        .controller('TwoFactorCtrl', ['$scope', '$state', '$mdToast',
            'AuthService', 'AccountService', TwoFactorCtrl]);

    function TwoFactorCtrl($scope, $state, $mdToast, AuthService, AccountService) {

        var vm      = this;
        vm.otp      = '';
        vm.sending  = false;
        vm.verifying = false;
        vm.otpSent  = false;

        // ── Guard: if user is not at 2FA step, send them back ────────────────
        if (!AuthService.isAuthenticated()) {
            $state.go('login');
            return;
        }

        // ── Auto-request OTP as soon as the page loads ───────────────────────
        vm.requestOTP = function () {
            vm.sending = true;
            AuthService.requestOTP()
                .then(function () {
                    vm.otpSent = true;
                    vm.sending = false;
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('OTP sent to your registered email / phone.')
                            .hideDelay(3000)
                            .position('top right')
                    );
                })
                .catch(function () {
                    vm.sending = false;
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Failed to send OTP. Please try again.')
                            .hideDelay(3000)
                            .position('top right')
                    );
                });
        };

        // ── Validate the OTP entered by the user ─────────────────────────────
        vm.validateOTP = function () {
            if (!vm.otp || vm.otp.trim() === '') {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Please enter the OTP.')
                        .hideDelay(2000)
                        .position('top right')
                );
                return;
            }

            vm.verifying = true;

            AuthService.validateOTP(vm.otp.trim())
                .then(function (tfaToken) {

                    // Store the full TFA token — interceptor will send it hereafter
                    AuthService.setTwoFactorToken(tfaToken);
                    AuthService.setPendingTwoFactor(false);

                    // Now fetch the client list (was blocked before OTP validation)
                    AccountService.getClients().get().$promise
                        .then(function (res) {
                            vm.verifying = false;
                            if (res.pageItems.length !== 0) {
                                AccountService.setClientId(res.pageItems[0].id);
                                $state.go('app.dashboard');
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Login Successful!')
                                        .hideDelay(2000)
                                        .position('top right')
                                );
                            } else {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('No Clients Found.')
                                        .hideDelay(2000)
                                        .position('top right')
                                );
                                AuthService.logout();
                            }
                        })
                        .catch(function () {
                            vm.verifying = false;
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Error loading account. Please login again.')
                                    .hideDelay(3000)
                                    .position('top right')
                            );
                            AuthService.logout();
                        });

                })
                .catch(function () {
                    vm.verifying = false;
                    vm.otp = '';
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Invalid OTP. Please try again.')
                            .hideDelay(3000)
                            .position('top right')
                    );
                });
        };

        // ── Cancel: go back to login ──────────────────────────────────────────
        vm.cancel = function () {
            AuthService.logout();
        };

        // Trigger OTP delivery on page load
        vm.requestOTP();
    }

})();