(function () {
    'use strict';

    angular.module('selfService')
        .controller('AccountTransferCtrl', ['$scope', '$stateParams', '$filter', '$mdDialog', '$mdDateLocale', '$mdToast', 'AccountTransferService', AccountTransferCtrl]);

    /**
     * @module AccountTransferCtrl
     * @description
     * Account Transfer Controller
     */
    function AccountTransferCtrl($scope, $stateParams, $filter, $mdDialog, $mdDateLocale, $mdToast, AccountTransferService) {

        var vm = this;
        vm.fromAccountOptions = [];
        vm.toAccountOptions = [];
        vm.transferFormData = getTransferFormDataObj()

        vm.disabledToAccount = false;
        vm.disabledfromAccount = false;

        vm.transferFormData = getTransferFormDataObj();
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
            
            if (vm.transferFormData.fromAccount.accountId === vm.transferFormData.toAccount.accountId) {
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
            AccountTransferService.getTransferTemplate().get(function (data) {
                vm.fromAccountOptions = data.fromAccountOptions || [];
                vm.toAccountOptions = data.toAccountOptions || [];

                if($stateParams.toAccount) {
                    var foundTo = false;
                    for(var i=0; i < vm.toAccountOptions.length; i++) {
                        if(vm.toAccountOptions[i].accountNo == $stateParams.toAccount.accountNo || vm.toAccountOptions[i].accountId == $stateParams.toAccount.id) {
                            vm.transferFormData.toAccount = vm.toAccountOptions[i];
                            vm.disabledToAccount = true;
                            foundTo = true;
                            break;
                        }
                    }
                    if (!foundTo) {
                        $mdToast.show($mdToast.simple().textContent('Transfers to this specific account type are not supported by the backend.').position('top right').hideDelay(4000));
                    }
                }

                if($stateParams.fromAccount) {
                    var foundFrom = false;
                    for(var j=0; j < vm.fromAccountOptions.length; j++) {
                        if(vm.fromAccountOptions[j].accountNo == $stateParams.fromAccount.accountNo || vm.fromAccountOptions[j].accountId == $stateParams.fromAccount.id) {
                            vm.transferFormData.fromAccount = vm.fromAccountOptions[j];
                            vm.disabledfromAccount = true;
                            foundFrom = true;
                            break;
                        }
                    }
                    if (!foundFrom) {
                        $mdToast.show($mdToast.simple().textContent('Transfers from this specific account type are not supported by the backend.').position('top right').hideDelay(4000));
                    }
                }

            });
        }

        function clearForm() {
            vm.transferFormData = getTransferFormDataObj();
            if ($scope.transferForm) {
                $scope.transferForm.$setPristine();
                $scope.transferForm.$setUntouched();
            }
            vm.disabledToAccount = false;
            vm.disabledfromAccount = false;
        }

        function submit(ev) {
            $mdDialog.show({
                controller: 'ReviewTransferDialogCtrl',
                controllerAs: 'vm',
                templateUrl: 'src/transfers/review-transfer-dialog/review-transfer-dialog.html',
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