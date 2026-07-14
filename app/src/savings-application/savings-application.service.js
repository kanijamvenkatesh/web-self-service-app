(function() {
    'use strict';

    angular.module('selfService')
        .service('SavingsApplicationService', ['$resource', 'BASE_URL', SavingsApplicationService]);

    /**
     * @module SavingsApplicationService
     * @description
     * Service required for Savings Application
     */
    function SavingsApplicationService($resource, BASE_URL) {

        this.template = function() {
            return $resource(BASE_URL + '/self/savingsaccounts/template');
        }

        this.savings = function() {
            return $resource(BASE_URL + '/self/savingsaccounts');
        }
    }

})();