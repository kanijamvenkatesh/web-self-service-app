(function () {
    'use strict';

    angular.module('selfService')
        .config(function ($mdThemingProvider, $mdIconProvider, $httpProvider,
            $translateProvider, TENANT_IDENTIFIER) {

            $mdThemingProvider
                .theme('default')
                .primaryPalette('blue', { 'default': '600' })
                .accentPalette('pink',  { 'default': '500' })
                .warnPalette('defaultPrimary');

            $mdThemingProvider
                .theme('dark', 'default')
                .primaryPalette('defaultPrimary')
                .dark();

            $mdThemingProvider
                .theme('grey', 'default')
                .primaryPalette('grey');

            $mdThemingProvider
                .theme('custom', 'default')
                .primaryPalette('defaultPrimary', { 'hue-1': '50' });

            $mdThemingProvider
                .definePalette('defaultPrimary', {
                    '50':  '#FFFFFF',
                    '100': 'rgb(255, 198, 197)',
                    '200': '#E75753',
                    '300': '#E75753',
                    '400': '#E75753',
                    '500': '#E75753',
                    '600': '#E75753',
                    '700': '#E75753',
                    '800': '#E75753',
                    '900': '#E75753',
                    'A100': '#E75753',
                    'A200': '#E75753',
                    'A400': '#E75753',
                    'A700': '#E75753'
                });

            $mdIconProvider.icon('user', 'assets/images/user.svg', 64);

            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.headers.common['Content-Type'] =
                'application/json; charset=utf-8';
            $httpProvider.defaults.headers.common['Fineract-Platform-TenantId'] =
                TENANT_IDENTIFIER;
            $httpProvider.interceptors.push('APIRequestInterceptor');

            var defaultLocale = 'en';
            $translateProvider
                .useStaticFilesLoader({
                    prefix: 'global-translations/locale-',
                    suffix: '.json'
                })
                .useLocalStorage()
                .useSanitizeValueStrategy('escape')
                .preferredLanguage(defaultLocale)
                .fallbackLanguage(defaultLocale);
        })

        .run(['$rootScope', '$location', 'AuthService',
            function ($rootScope, $location, AuthService) {

            $rootScope.$on('$locationChangeStart', function (event) {

                var path = $location.path();

                // Pages that don't need a fully authenticated session
                var publicPages = ['/login', '/forgot', '/register', '/verify', '/twofactor'];

                var isPublicPage  = $.inArray(path, publicPages) !== -1;
                var loggedIn      = AuthService.isAuthenticated();
                var twoFAPending  = AuthService.isTwoFactorPending();

                if (!isPublicPage) {
                    // Protected page — must be logged in
                    if (!loggedIn) {
                        $location.path('/login');
                        return;
                    }
                    // Logged in but OTP not yet verified — force 2FA page
                    if (twoFAPending) {
                        event.preventDefault();
                        $location.path('/twofactor');
                        return;
                    }
                } else {
                    // Public page — redirect away if already fully authenticated
                    if (loggedIn && !twoFAPending && path !== '/twofactor') {
                        event.preventDefault();
                    }
                }
            });
        }]);

})();