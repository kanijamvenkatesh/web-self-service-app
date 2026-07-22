(function () {
    'use strict';

    angular.module('selfService')
        .service('TradeFinanceService', ['$http', '$q', TradeFinanceService]);

    function TradeFinanceService($http, $q) {
        var middlewareUrl = '/api';

        // Ã¢â€â‚¬Ã¢â€â‚¬ LC Contracts Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        this.getLcs = function (params) {
            return $http.get(middlewareUrl + '/lc', { params: params });
        };

        this.getLcById = function (id) {
            return $http.get(middlewareUrl + '/lc/' + id);
        };

        this.createLc = function (lcData) {
            return $http.post(middlewareUrl + '/lc', lcData);
        };

        this.submitLc = function (id) {
            return $http.post(middlewareUrl + '/lc/' + id + '/submit');
        };

        this.approveLc = function (id, staffName) {
            return $http.post(middlewareUrl + '/lc/' + id + '/approve', null, {
                params: { staffName: staffName }
            });
        };

        this.rejectLc = function (id, reason) {
            return $http.post(middlewareUrl + '/lc/' + id + '/reject', null, {
                params: { reason: reason }
            });
        };

        this.settleLc = function (id, staffName) {
            return $http.post(middlewareUrl + '/lc/' + id + '/settle', null, {
                params: { staffName: staffName }
            });
        };

        // Ã¢â€â‚¬Ã¢â€â‚¬ Shipping Documents & Scrutiny Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        this.getDocuments = function (lcId) {
            return $http.get(middlewareUrl + '/lc/' + lcId + '/documents');
        };

        this.uploadDocument = function (lcId, file, type, uploadedBy) {
            var fd = new FormData();
            fd.append('file', file);
            fd.append('type', type);
            fd.append('uploadedBy', uploadedBy);

            return $http.post(middlewareUrl + '/lc/' + lcId + '/documents', fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            });
        };

        this.runScrutiny = function (docId) {
            return $http.post(middlewareUrl + '/lc/documents/' + docId + '/scrutiny');
        };

        // Ã¢â€â‚¬Ã¢â€â‚¬ Seller Auth Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        this.sellerLogin = function (username, password) {
            return $http({
                method: 'POST',
                url: middlewareUrl + '/seller/login',
                data: angular.toJson({
                    username: username,
                    password: password
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
    }
})();
