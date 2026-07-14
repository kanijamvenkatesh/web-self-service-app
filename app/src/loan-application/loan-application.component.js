(function(){
    'use strict';

    angular.module('selfService')
        .controller('LoanApplicationCtrl', ['$scope', '$filter', '$mdToast', 'AccountService', 'LoanApplicationService', LoanApplicationCtrl]);

    /**
     * @module LoanApplicationCtrl
     * @description
     * Controls Application for Loan
     */
    function LoanApplicationCtrl($scope, $filter, $mdToast, AccountService, LoanApplicationService) {
        var vm = this;

        vm.form = {
            locale: 'en_GB',
            dateFormat: 'dd MMMM yyyy',
            loanType: 'individual'
        };
        vm.template = {};
        vm.clientId = null;

        vm.init = init;
        vm.getLoanTemplate = getLoanTemplate;
        vm.clearForm = clearForm;
        vm.submit = submit;

        init();

        function init() {
            AccountService.getClientId().then(function (clientId) {
                vm.clientId = clientId;
                getLoanTemplate(clientId, null);
            });
        }

        function getLoanTemplate(clientId, productId) {
            LoanApplicationService.template().get({
                templateType: 'individual',
                clientId: clientId,
                productId: productId
            }).$promise.then(function(template) {
                vm.template = template;
                vm.form.principal = vm.template.principal;
                vm.form.loanTermFrequency = vm.template.termFrequency;
                if (vm.template.termPeriodFrequencyType) {
                    vm.form.loanTermFrequencyType = vm.template.termPeriodFrequencyType.id;
                }
                vm.form.numberOfRepayments = vm.template.numberOfRepayments;
                vm.form.repaymentEvery = vm.template.repaymentEvery;
                if (vm.template.repaymentFrequencyType) {
                    vm.form.repaymentFrequencyType = vm.template.repaymentFrequencyType.id;
                }
                vm.form.interestRatePerPeriod = vm.template.interestRatePerPeriod;
                if (vm.template.amortizationType) {
                    vm.form.amortizationType = vm.template.amortizationType.id;
                }
                if (vm.template.interestType) {
                    vm.form.interestType = vm.template.interestType.id;
                }
                if (vm.template.interestCalculationPeriodType) {
                    vm.form.interestCalculationPeriodType = vm.template.interestCalculationPeriodType.id;
                }
                vm.form.submittedOnDate = $filter('date')(new Date(), 'dd MMMM yyyy');
                vm.form.expectedDisbursementDate = $filter('date')(new Date(), 'dd MMMM yyyy');
            });
        }

        function clearForm() {
            if ($scope.loanApplicationForm) {
                $scope.loanApplicationForm.$setPristine();
                $scope.loanApplicationForm.$setUntouched();
            }
            vm.template = {};
            vm.form = {
                locale: 'en_GB',
                dateFormat: 'dd MMMM yyyy',
                loanType: 'individual'
            };
            init();
        }

        function submit() {
            var loanTemp = {
                clientId: vm.clientId,
                transactionProcessingStrategyId: vm.template.transactionProcessingStrategyId
            };
            var data = Object.assign({}, loanTemp, vm.form);
            LoanApplicationService.loan().save(data).$promise.then(function() {
                clearForm();
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("Loan Application Submitted Successfully")
                        .hideDelay(2000)
                        .position('top right')
                );
            }, function(){
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("Error Creating Loan Application")
                        .hideDelay(2000)
                        .position('top right')
                );
            });
        }
    }
})();