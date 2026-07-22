(function () {
    'use strict';

    angular.module('selfService')
        .service('AuthService', ['$q', '$http', '$rootScope', '$state', '$resource',
            'storageService', 'BASE_URL', 'USER_ROLES', AuthService]);

    function AuthService($q, $http, $rootScope, $state, $resource,
        storageService, BASE_URL, USER_ROLES) {

        var role              = '';
        var portalRole        = '';
        var userData          = '';
        var isAuthenticated   = false;
        var twoFactorToken    = null;
        var twoFactorPending  = false;

        storageService.getObject('user_profile').then(function (data) {
            if (data) {
                isAuthenticated  = true;
                role             = USER_ROLES.user;
                portalRole       = data._portalRole || USER_ROLES.buyer;
                userData         = data;
                twoFactorPending = data._twoFactorPending || false;
                twoFactorToken   = data._twoFactorToken   || null;
            } else {
                restoreSellerSession();
            }
        });

        function persistUser(res, selectedPortalRole) {
            userData         = res;
            isAuthenticated  = true;
            role             = USER_ROLES.user;
            portalRole       = selectedPortalRole;
            twoFactorPending = res.isTwoFactorAuthenticationRequired === true;
            storageService.setObject('user_profile', angular.extend({}, res, {
                _portalRole: portalRole,
                _twoFactorPending: twoFactorPending,
                _twoFactorToken: null
            }));
        }

        function restoreSellerSession() {
            var sellerSession = localStorage.getItem('seller_session');
            if (sellerSession) {
                try {
                    userData = JSON.parse(sellerSession);
                    isAuthenticated = true;
                    role = USER_ROLES.user;
                    portalRole = USER_ROLES.seller;
                } catch (e) {
                    localStorage.removeItem('seller_session');
                }
            }
        }

        this.setUser = function (res, selectedPortalRole) {
            persistUser(res, selectedPortalRole || USER_ROLES.buyer);
        };

        this.setSellerUser = function (sellerSession) {
            userData = sellerSession;
            isAuthenticated = true;
            role = USER_ROLES.user;
            portalRole = USER_ROLES.seller;
            twoFactorPending = false;
            twoFactorToken = null;
            localStorage.setItem('seller_session', JSON.stringify(sellerSession));
        };

        this.getUser = function () {
            return userData;
        };

        this.isAuthenticated = function () {
            return isAuthenticated;
        };

        this.role = function () {
            return role;
        };

        this.portalRole = function () {
            return portalRole;
        };

        this.isBuyer = function () {
            return portalRole === USER_ROLES.buyer;
        };

        this.isSeller = function () {
            return portalRole === USER_ROLES.seller;
        };

        this.isStaff = function () {
            return portalRole === USER_ROLES.staff;
        };

        this.isAuthorized = function (authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (this.isAuthenticated() && authorizedRoles.indexOf(role) !== -1);
        };

        this.isTwoFactorPending = function () {
            return twoFactorPending;
        };

        this.setPendingTwoFactor = function (val) {
            twoFactorPending = val;
            if (userData) {
                userData._twoFactorPending = val;
                storageService.setObject('user_profile', userData);
            }
        };

        this.setTwoFactorToken = function (token) {
            twoFactorToken = token;
            if (userData) {
                userData._twoFactorToken = token;
                storageService.setObject('user_profile', userData);
            }
        };

        this.getTwoFactorToken = function () {
            return twoFactorToken;
        };

        this.requestOTP = function () {
            return $http({
                method : 'POST',
                url    : BASE_URL + '/twofactor'
            });
        };

        this.validateOTP = function (otp) {
            var deferred = $q.defer();
            $http({
                method : 'POST',
                url    : BASE_URL + '/twofactor/validate',
                params : { token: otp }
            }).then(function (response) {
                var tfaToken = response.headers('Fineract-Platform-TFA-Token')
                             || (response.data && (response.data.token || response.data));
                if (tfaToken) {
                    deferred.resolve(tfaToken);
                } else {
                    deferred.reject('No TFA token received');
                }
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };

        this.doLogin = function () {
            return $resource(BASE_URL + '/self/authentication');
        };

        this.doStaffLogin = function () {
            return $resource(BASE_URL + '/authentication');
        };

        this.logout = function () {
            role             = '';
            portalRole       = '';
            userData         = '';
            isAuthenticated  = false;
            twoFactorToken   = null;
            twoFactorPending = false;
            localStorage.removeItem('seller_session');
            storageService.clear();
            $state.go('login');
        };

        this.register = function (data) {
            return $http.post(BASE_URL + '/self/registration', data);
        };

        this.verifyUser = function (data) {
            return $http.post(BASE_URL + '/self/registration/user', data);
        };
    }

})();
