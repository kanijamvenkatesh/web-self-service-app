(function () {
    'use strict';

    angular.module('selfService')
        .controller('TradeFinanceSellerCtrl', TradeFinanceSellerCtrl);

    TradeFinanceSellerCtrl.$inject = ['$scope', '$http', '$mdToast', '$stateParams'];

    function TradeFinanceSellerCtrl($scope, $http, $mdToast, $stateParams) {
        var vm = this;
        vm.lcId = $stateParams.lcId ? parseInt($stateParams.lcId, 10) : null;
        vm.selectedFile = null;
        vm.documentType = 'BILL_OF_LADING'; // Default

        vm.onFileSelect = function (element) {
            $scope.$apply(function() {
                vm.selectedFile = element.files[0];
            });
        };

        vm.uploadDocument = function () {
            if (!vm.selectedFile || !vm.lcId) {
                alert('Please select a file and provide an LC ID.');
                return;
            }

            var formData = new FormData();
            formData.append('file', vm.selectedFile);
            formData.append('type', vm.documentType);
            formData.append('uploadedBy', 'SELLER_SYSTEM');

            $http.post('http://localhost:8090/api/v1/trade-finance/lc/' + vm.lcId + '/documents', formData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .then(function (response) {
                alert('Document uploaded successfully!');
                vm.selectedFile = null;
            })
            .catch(function (error) {
                console.error('Error uploading document', error);
                alert('Failed to upload document.');
            });
        };
    }
})();
