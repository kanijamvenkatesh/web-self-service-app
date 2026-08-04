(function () {
    'use strict';

    angular
        .module('selfService')
        .controller('OcrScrutinyCtrl', OcrScrutinyCtrl);

    OcrScrutinyCtrl.$inject = ['$http', '$timeout', 'ocrResult'];

    // ocrResult is injected via the ui-router resolve block to prevent UI flickering
    function OcrScrutinyCtrl($http, $timeout, ocrResult) {
        var vm = this;

        // Ensure variables map to exactly what the resolve provides
        vm.lcNumber = ocrResult.data ? ocrResult.data.lcNumber : 'Unknown';
        vm.ocrResult = ocrResult.data ? ocrResult.data : null;
        
        vm.errorMessage = null;
        vm.isSubmitting = false;

        vm.approveAndSettle = function() {
            vm.isSubmitting = true;
            vm.errorMessage = null;

            // Mocking the API response
            $timeout(function() {
                alert("Successfully settled " + vm.lcNumber);
                vm.isSubmitting = false;
            }, 600);
        };

        vm.rejectDiscrepancy = function() {
            vm.isSubmitting = true;
            vm.errorMessage = null;

            // Mocking the API response
            $timeout(function() {
                alert("Rejected " + vm.lcNumber + " due to discrepancies.");
                vm.isSubmitting = false;
            }, 600);
        };
    }
})();
