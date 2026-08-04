(function () {
    'use strict';

    angular.module('selfService')
        .controller('TradeFinanceStaffCtrl', TradeFinanceStaffCtrl);

    TradeFinanceStaffCtrl.$inject = ['$scope', '$http'];

    function TradeFinanceStaffCtrl($scope, $http) {
        var vm = this;
        vm.lcId = null;
        vm.documentId = null;
        vm.ocrResult = null;
        
        vm.pendingLcs = [];
        vm.selectedLcDocuments = [];

        vm.init = function() {
            $http.get('http://localhost:8090/api/v1/trade-finance/lc')
                .then(function(response) {
                    // Filter for LCs that are ISSUED (awaiting docs) or PRESENTED (awaiting scrutiny/settlement)
                    vm.pendingLcs = response.data.filter(function(lc) {
                        return lc.status === 'ISSUED' || lc.status === 'PRESENTED'; 
                    });
                })
                .catch(function(error) {
                    console.error('Error fetching LCs', error);
                });
        };

        vm.selectLc = function(lc) {
            vm.lcId = lc.id;
            vm.ocrResult = null;
            // Fetch documents for this LC
            $http.get('http://localhost:8090/api/v1/trade-finance/lc/' + lc.id + '/documents')
                .then(function(response) {
                    vm.selectedLcDocuments = response.data;
                })
                .catch(function(error) {
                    console.error('Error fetching documents', error);
                });
        };

        vm.selectDocument = function(doc) {
            vm.documentId = doc.id;
        };

        vm.runScrutiny = function () {
            if (!vm.documentId) {
                alert('Please provide a Document ID to scrutinize.');
                return;
            }

            $http.post('http://localhost:8090/api/v1/trade-finance/lc/documents/' + vm.documentId + '/scrutiny')
                .then(function (response) {
                    vm.ocrResult = response.data;
                    alert('OCR Scrutiny completed. Status: ' + vm.ocrResult.scrutinyStatus);
                })
                .catch(function (error) {
                    console.error('Error running OCR Scrutiny', error);
                    alert('Failed to run OCR scrutiny.');
                });
        };

        vm.verifyAndSettle = function () {
            if (!vm.lcId) {
                alert('Please provide an LC ID to settle.');
                return;
            }

            $http.post('http://localhost:8090/api/v1/trade-finance/lc/' + vm.lcId + '/settle?staffName=BankAdmin')
                .then(function (response) {
                    alert('LC Settled Successfully! Margin Released and Trade Loan Disbursed.');
                    vm.init(); // Refresh list
                    vm.lcId = null;
                    vm.documentId = null;
                    vm.selectedLcDocuments = [];
                })
                .catch(function (error) {
                    console.error('Error settling LC', error);
                    alert('Failed to settle LC. Check if OCR Scrutiny passed.');
                });
        };

        // Run init on load
        vm.init();
    }
})();
