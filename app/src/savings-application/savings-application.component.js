(function(){
    'use strict';

    angular.module('selfService')
        .controller('SavingsApplicationCtrl', ['$scope', '$filter', '$mdToast', 'AccountService', 'SavingsApplicationService', SavingsApplicationCtrl]);

    /**
     * @module SavingsApplicationCtrl
     * @description
     * Controls Application for Savings
     */
    function SavingsApplicationCtrl($scope, $filter, $mdToast, AccountService, SavingsApplicationService) {
        var vm = this;

        vm.form = {
            locale: 'en_GB',
            dateFormat: 'dd MMMM yyyy'
        };
        vm.template = {};
        vm.clientId = null;

        vm.init = init;
        vm.getSavingsTemplate = getSavingsTemplate;
        vm.clearForm = clearForm;
        vm.submit = submit;

        init();

        function init() {
            AccountService.getClientId().then(function (clientId) {
                vm.clientId = clientId;
                getSavingsTemplate(clientId, null);
            });
        }

        function getSavingsTemplate(clientId, productId) {
            SavingsApplicationService.template().get({
                clientId: clientId,
                productId: productId
            }).$promise.then(function(template) {
                vm.template = template;
                vm.form.nominalAnnualInterest = vm.template.nominalAnnualInterestRate;
                vm.form.submittedOnDate = $filter('date')(new Date(), 'dd MMMM yyyy');
            });
        }

        function clearForm() {
            if ($scope.savingsApplicationForm) {
                $scope.savingsApplicationForm.$setPristine();
                $scope.savingsApplicationForm.$setUntouched();
            }
            vm.template = {};
            vm.form = {
                locale: 'en_GB',
                dateFormat: 'dd MMMM yyyy'
            };
            init();
        }

        function submit() {
            var savingsTemp = {
                clientId: vm.clientId,
                interestCompoundingPeriodType: vm.template.interestCompoundingPeriodType.id,
                interestPostingPeriodType: vm.template.interestPostingPeriodType.id,
                interestCalculationType: vm.template.interestCalculationType.id,
                interestCalculationDaysInYearType: vm.template.interestCalculationDaysInYearType.id
            };
            var data = Object.assign({}, savingsTemp, vm.form);
            SavingsApplicationService.savings().save(data).$promise.then(function() {
                clearForm();
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("Savings Application Submitted Successfully")
                        .hideDelay(2000)
                        .position('top right')
                );
            }, function(){
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("Error Creating Savings Application")
                        .hideDelay(2000)
                        .position('top right')
                );
            });
        }
    }
})();