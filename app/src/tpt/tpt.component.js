(function () {
    'use strict';

    angular.module('selfService')
        .controller('TPTCtrl', ['$scope', '$rootScope', '$stateParams', '$filter', '$mdDialog', '$mdDateLocale', '$mdToast', 'AccountTransferService', TPTCtrl]);

    function TPTCtrl($scope, $rootScope, $stateParams, $filter, $mdDialog, $mdDateLocale, $mdToast, AccountTransferService) {

        var vm = this;
        vm.fromAccountOptions = [];
        vm.toAccountOptions = [];
        vm.transferFormData = getTransferFormDataObj()

        vm.getTransferTemplate = getTransferTemplate();
        vm.clearForm = clearForm;
        vm.submit = submit;
        vm.isTransferInvalid = isTransferInvalid;

        // FORMAT THE DATE FOR THE DATEPICKER
        $mdDateLocale.formatDate = function (date) {
            return $filter('date')(date, "dd-MM-yyyy");
        };

        function isTransferInvalid() {
            if (vm.transferFormData.fromAccount) {
                var fromType = vm.transferFormData.fromAccount.accountType ? vm.transferFormData.fromAccount.accountType.value : '';
                if (fromType === 'Fixed Deposit' || fromType === 'Recurring Deposit') {
                    return 'invalid_source';
                }
            }

            if (vm.transferFormData.toAccount) {
                var toType = vm.transferFormData.toAccount.accountType ? vm.transferFormData.toAccount.accountType.value : '';
                if (toType === 'Fixed Deposit' || toType === 'Recurring Deposit') {
                    return 'invalid_destination';
                }
            }

            if (!vm.transferFormData.fromAccount || !vm.transferFormData.toAccount) return false;
            
            var fromId = vm.transferFormData.fromAccount.accountId || vm.transferFormData.fromAccount.accountNo;
            var toId = vm.transferFormData.toAccount.accountId || vm.transferFormData.toAccount.accountNo;
            if (fromId && toId && fromId === toId) {
                return 'same_account';
            }
            
            var fromCurrency = vm.transferFormData.fromAccount.currencyCode || (vm.transferFormData.fromAccount.currency ? vm.transferFormData.fromAccount.currency.code : null);
            var toCurrency = vm.transferFormData.toAccount.currencyCode || (vm.transferFormData.toAccount.currency ? vm.transferFormData.toAccount.currency.code : null);
            
            if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
                return 'cross_currency';
            }
            
            return false;
        }

        function getTransferFormDataObj() {
            return {
                transferDate: new Date()
            };
        }

        function getTransferTemplate() {
            AccountTransferService.getTransferTemplate().get({type: "tpt"},function (data) {
                vm.fromAccountOptions = data.fromAccountOptions;
                vm.toAccountOptions = data.toAccountOptions;
            });
        }

        function clearForm() {
            vm.transferFormData = getTransferFormDataObj();
            $scope.transferForm.$setPristine();
            $scope.transferForm.$setUntouched();
        }

        function submit(ev) {
            $mdDialog.show({
                controller: 'ReviewTPTDialogCtrl',
                controllerAs: 'vm',
                templateUrl: 'src/tpt/review-tpt-dialog/review-tpt-dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {transferFormData: vm.transferFormData},
                clickOutsideToClose: true
            }).then(function (result) {
                if(result === "success"){
                    clearForm();
                }
            }, function () {
                clearForm();
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Transfer Cancelled')
                        .position('top right')
                );
            });
        }


    }
})();