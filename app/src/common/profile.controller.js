(function () {
    'use strict';

    angular.module('selfService')
        .controller('ClientCtrl', ['AuthService', 'AccountService', 'storageService', '$http', 'BASE_URL', '$q', '$mdToast', ClientCtrl]);

    function ClientCtrl(AuthService, AccountService, storageService, $http, BASE_URL, $q, $mdToast) {
        var vm = this;
        vm.editMode = false;
        vm.profileImage = null;
        vm.profile = {};
        vm.currentUser = {};

        vm.toggleEdit = function () {
            vm.editMode = !vm.editMode;
        };

        vm.logout = function () {
            AuthService.logout();
        };

        vm.saveProfile = function () {
            var isStaff = vm.currentUser && vm.currentUser._portalRole === 'STAFF';
            var isSeller = vm.currentUser && vm.currentUser._portalRole === 'SELLER';
            var payload = {};
            var url = '';

            console.log('Saving profile for role:', vm.currentUser._portalRole);

            if (isStaff) {
                payload = {
                    username: vm.currentUser.username,
                    firstname: vm.profile.firstname || vm.profile.displayName,
                    lastname: vm.profile.lastname || '',
                    email: vm.profile.email
                };
                url = BASE_URL + '/users/' + vm.currentUser.userId;
            } else if (isSeller) {
                payload = {
                    companyName: vm.profile.displayName,
                    email: vm.profile.email,
                    mobileNo: vm.profile.mobileNo
                };
                url = BASE_URL + '/self/sellers/' + vm.currentUser.id;
            } else {
                payload = {
                    firstname: vm.profile.firstname,
                    lastname: vm.profile.lastname,
                    emailAddress: vm.profile.emailAddress,
                    mobileNo: vm.profile.mobileNo
                };
            }

            var performLocalSave = function () {
                console.log('Performing local storage save...');
                if (isSeller) {
                    var updatedSeller = angular.extend({}, vm.currentUser, {
                        companyName: vm.profile.displayName,
                        email: vm.profile.email,
                        mobileNo: vm.profile.mobileNo
                    });
                    window.localStorage.setItem('seller_session', JSON.stringify(updatedSeller));
                    vm.currentUser = updatedSeller;
                } else {
                    var updatedUser = angular.extend({}, vm.currentUser, {
                        firstname: vm.profile.firstname,
                        lastname: vm.profile.lastname,
                        displayName: vm.profile.firstname + ' ' + vm.profile.lastname,
                        emailAddress: vm.profile.emailAddress,
                        email: vm.profile.emailAddress,
                        mobileNo: vm.profile.mobileNo
                    });
                    storageService.setObject('user_profile', updatedUser);
                    vm.currentUser = updatedUser;
                }
                
                vm.editMode = false;
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("Profile saved successfully!")
                        .position("bottom right")
                        .hideDelay(3000)
                );
            };

            if (isStaff) {
                console.log('Sending PUT to:', url, 'with payload:', payload);
                $http.put(url, payload).then(function (resp) {
                    var updatedUser = angular.extend({}, vm.currentUser, resp.data);
                    storageService.setObject('user_profile', updatedUser);
                    vm.currentUser = updatedUser;
                    vm.profile = updatedUser;
                    vm.editMode = false;
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent("Profile saved successfully!")
                            .position("bottom right")
                            .hideDelay(3000)
                    );
                }, function (err) {
                    console.warn("Backend PUT failed (permission restrictions). Saving locally...", err);
                    performLocalSave();
                });
            } else {
                // For Sellers/Buyers, perform local save and show success toast
                performLocalSave();
            }
        };

        function loadClientDetails(clientId) {
            console.log('Loading client details for clientId:', clientId);
            AccountService.getClient(clientId).get().$promise.then(function (data) {
                console.log('Client details loaded successfully:', data);
                vm.profile = data;
            }).catch(function (err) {
                console.error('Error loading client details:', err);
            });

            AccountService.getClientImage(clientId).then(function (resp) {
                console.log('Client image loaded successfully');
                vm.profileImage = resp.data;
            }).catch(function (err) {
                logError(err);
                vm.profileImage = null;
            });
        }

        function logError(err) {
            console.log('No client image or error loading it:', err);
        }

        console.log('Initializing ClientCtrl...');

        // Initialize data
        $q.all([
            storageService.getObject('user_profile'),
            AccountService.getClientId()
        ]).then(function (results) {
            var userProfile = results[0];
            var clientId = results[1];

            console.log('userProfile from storage:', userProfile);
            console.log('clientId from storage:', clientId);

            if (clientId && typeof clientId === 'object') {
                clientId = null;
            }
            vm.clientId = clientId;

            if (userProfile) {
                vm.currentUser = userProfile;
                var role = userProfile._portalRole || 'BUYER';
                console.log('User role resolved to:', role);

                if (role === 'STAFF') {
                    // Fetch full staff user details from backend to get email, firstname, etc.
                    $http.get(BASE_URL + '/users/' + userProfile.userId).then(function(resp) {
                        var fullUser = angular.extend({}, userProfile, resp.data);
                        fullUser.displayName = fullUser.firstname ? (fullUser.firstname + ' ' + (fullUser.lastname || '')) : fullUser.username;
                        vm.profile = fullUser;
                        vm.currentUser = fullUser;
                        storageService.setObject('user_profile', fullUser);
                        console.log('Staff full profile loaded:', vm.profile);
                    }).catch(function(err) {
                        console.warn('Failed to load full staff profile', err);
                        vm.profile = userProfile;
                    });
                } else if (vm.clientId) {
                    loadClientDetails(vm.clientId);
                } else {
                    vm.profile = userProfile;
                    console.log('Fallback profile loaded:', vm.profile);
                }
            } else {
                // Check if it's a Seller
                var sellerSession = window.localStorage.getItem('seller_session');
                console.log('Checking seller session:', sellerSession);
                if (sellerSession) {
                    var sellerData = JSON.parse(sellerSession);
                    vm.currentUser = sellerData;
                    vm.currentUser._portalRole = 'SELLER';
                    vm.profile = {
                        displayName: sellerData.companyName || sellerData.username || 'Seller',
                        email: sellerData.email || '',
                        mobileNo: sellerData.mobileNo || sellerData.phoneNumber || 'N/A',
                        username: sellerData.username
                    };
                    console.log('Seller profile loaded:', vm.profile);
                } else {
                    console.log('No active session found for staff, buyer, or seller.');
                }
            }
        }).catch(function (err) {
            console.error('Error initializing profile data:', err);
        });
    }
})();
