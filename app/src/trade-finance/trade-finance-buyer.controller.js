(function () {
    'use strict';

    angular.module('selfService')
        .controller('TradeFinanceBuyerCtrl', TradeFinanceBuyerCtrl);

    TradeFinanceBuyerCtrl.$inject = ['$scope', '$http', '$state'];

    function TradeFinanceBuyerCtrl($scope, $http, $state) {
        var vm = this;
        vm.lcData = {
            sellerId: null,
            tradeValue: null,
            collateralMarginPercentage: null,
            portOfLoading: '',
            portOfDischarge: '',
            goodsDescription: '',
            currency: 'USD'
        };
        vm.calculatedMargin = 0;

        vm.calculateMargin = function() {
            if (vm.lcData.tradeValue && vm.lcData.collateralMarginPercentage) {
                vm.calculatedMargin = (vm.lcData.tradeValue * vm.lcData.collateralMarginPercentage) / 100;
            } else {
                vm.calculatedMargin = 0;
            }
        };

        vm.applyLc = function () {
            $http.post('http://localhost:8090/api/v1/trade-finance/lc/apply', vm.lcData)
                .then(function (response) {
                    alert('LC Application submitted successfully!');
                    $state.go('app.tradefinance');
                })
                .catch(function (error) {
                    console.error('Error applying for LC', error);
                    alert('Failed to apply for LC.');
                });
        };
    }
})();
