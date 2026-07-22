(function () {
    'use strict';

    angular.module('selfService')
        .controller('ForgotCtrl', ['$scope', '$element', '$state', '$mdToast', ForgotPwdCtrl])
        .controller('ForgotPwdCtrl', ['$scope', '$element', '$state', '$mdToast', ForgotPwdCtrl]);

    /**
     * @module ForgotPwdCtrl
     * @description
     * Handles Forgot Password Simulation Flow dynamically on the element
     */
    function ForgotPwdCtrl($scope, $element, $state, $mdToast) {
        var vm = this;
        vm.form = {
            email: ''
        };

        // Dynamically bind the submit event handler to the form element
        // to execute business logic without modifying the HTML template
        var formEl = $element.find('form');
        formEl.on('submit', function (e) {
            e.preventDefault();
            if (!vm.form.email) return;

            $mdToast.show($mdToast.simple()
                .textContent('Password reset link sent to ' + vm.form.email + ' successfully!')
                .position('top right')
            );
            $state.go('login');
        });
    }

})();
