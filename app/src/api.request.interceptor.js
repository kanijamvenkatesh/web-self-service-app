(function () {
    'use strict';

    angular.module('selfService')
        .factory('APIRequestInterceptor', ['$injector', APIRequestInterceptor]);

    /**
     * HTTP interceptor that attaches authentication headers to every outgoing request.
     *
     * Headers added (when available):
     *   Authorization              : Basic <base64EncodedAuthenticationKey>
     *   Fineract-Platform-TFA-Token: <tfaToken>  (only after OTP is validated)
     *
     * Uses $injector instead of direct AuthService injection to avoid
     * a circular dependency ($http ↔ AuthService).
     */
    function APIRequestInterceptor($injector) {
        return {
            request: function (config) {
                var AuthService = $injector.get('AuthService');
                var user        = AuthService.getUser();

                // Basic auth from the base64 key returned by /self/authentication
                if (user && user.base64EncodedAuthenticationKey) {
                    config.headers['Authorization'] =
                        'Basic ' + user.base64EncodedAuthenticationKey;
                }

                // Full TFA token — only present after /twofactor/validate succeeds
                var tfaToken = AuthService.getTwoFactorToken();
                if (tfaToken) {
                    config.headers['Fineract-Platform-TFA-Token'] = tfaToken;
                }

                return config;
            }
        };
    }

})();