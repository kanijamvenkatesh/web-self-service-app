(function () {
    'use strict';

    angular.module('selfService')
        .service('AuthService', ['$q', '$http', '$rootScope', '$state', '$resource',
            'storageService', 'BASE_URL', 'USER_ROLES', AuthService]);

    function AuthService($q, $http, $rootScope, $state, $resource,
        storageService, BASE_URL, USER_ROLES) {

        var role              = '';
        var userData          = '';
        var isAuthenticated   = false;
        var twoFactorToken    = null;   // full TFA token after OTP validation
        var twoFactorPending  = false;  // true = login done but OTP not yet verified

        // Restore session from storage on app load
        storageService.getObject('user_profile').then(function (data) {
            if (data) {
                isAuthenticated  = true;
                role             = USER_ROLES.user;
                userData         = data;
                twoFactorPending = data._twoFactorPending || false;
                twoFactorToken   = data._twoFactorToken   || null;
            }
        });

        // ── Store logged-in user (called right after /self/authentication) ──
        this.setUser = function (res) {
            userData         = res;
            isAuthenticated  = true;
            role             = USER_ROLES.user;
            twoFactorPending = res.isTwoFactorAuthenticationRequired === true;
            storageService.setObject('user_profile', angular.extend({}, res, {
                _twoFactorPending: twoFactorPending,
                _twoFactorToken:   null
            }));
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

        this.isAuthorized = function (authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (this.isAuthenticated() && authorizedRoles.indexOf(role) !== -1);
        };

        // ── 2FA helpers ───────────────────────────────────────────────────────

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

        /**
         * POST /twofactor
         * Triggers OTP delivery to the user's registered channel (email/SMS).
         * Requires Basic auth with the restricted token — the interceptor adds it.
         */
        this.requestOTP = function () {
            return $http({
                method : 'POST',
                url    : BASE_URL + '/twofactor'
            });
        };

        /**
         * POST /twofactor/validate?token=<otp>
         * Validates the OTP. Returns the full TFA access token on success.
         */
        this.validateOTP = function (otp) {
            var deferred = $q.defer();
            $http({
                method : 'POST',
                url    : BASE_URL + '/twofactor/validate',
                params : { token: otp }
            }).then(function (response) {
                // Token may be in the response header OR the response body
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

        // ── Standard REST resource for login ──────────────────────────────────
        this.doLogin = function () {
            return $resource(BASE_URL + '/self/authentication');
        };

        // ── Logout: clear everything ──────────────────────────────────────────
        this.logout = function () {
            role             = '';
            userData         = '';
            isAuthenticated  = false;
            twoFactorToken   = null;
            twoFactorPending = false;
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