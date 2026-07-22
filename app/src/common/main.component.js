(function () {

    angular.module('selfService')
        .controller('MainCtrl', ['navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', 'AuthService', 'AccountService', 'storageService', '$interval', MainCtrl]);

    function MainCtrl(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, AuthService, AccountService, storageService, $interval, $http, BASE_URL) {
        var vm = this;

        vm.menuItems = [];
        vm.profileImage = null;

        vm.selectItem = selectItem;
        vm.toggleItemsList = toggleItemsList;
        vm.toggleRightSidebar = toggleRightSidebar;
        vm.logout = logout;

        vm.isStaff = false;
        vm.isBuyer = false;
        vm.isSeller = false;
        vm.tradeRoleLabel = '';

        // --- Real-time notifications (role-specific event-driven) ---
        vm.recentNotifications = [];
        vm.profile = null;
        getUserData();

        vm.getUnreadCount = function () {
            return vm.recentNotifications.filter(function (notif) {
                return !notif.read;
            }).length;
        };

        vm.markAsRead = function (notif, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            notif.read = true;
            $mdToast.show(
                $mdToast.simple()
                    .textContent("Notification marked as read")
                    .position("bottom right")
                    .hideDelay(2000)
            );
        };

        vm.markAllAsRead = function ($event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            vm.recentNotifications.forEach(function (notif) {
                notif.read = true;
            });
            $mdToast.show(
                $mdToast.simple()
                    .textContent("All notifications marked as read")
                    .position("bottom right")
                    .hideDelay(2000)
            );
        };

        var welcomeSent = false;
        function triggerWelcomeMessage() {
            if (welcomeSent) return;
            welcomeSent = true;
            
            var welcomeText = "Welcome to the Trade Portal, " + (vm.profile ? (vm.profile.displayName || vm.profile.firstname || vm.currentUser.username) : "User") + "!";
            if (vm.isStaff) {
                welcomeText = "Welcome back, " + (vm.profile ? (vm.profile.displayName || vm.currentUser.username) : "Staff") + "! Ready to review trade contracts.";
            } else if (vm.isSeller) {
                welcomeText = "Welcome to the Trade Portal, " + (vm.profile ? (vm.profile.displayName || vm.currentUser.username) : "Seller") + "! Track your Electronic Bills of Lading here.";
            }
            
            vm.recentNotifications.push({
                id: Date.now(),
                title: "Welcome Wishes",
                message: welcomeText,
                time: "Just now",
                timestamp: Date.now(),
                read: false
            });
        }

        // Listen for actual real-time application events
        $scope.$on('trade:notification', function(event, data) {
            var newNotif = {
                id: Date.now(),
                title: data.title,
                message: data.message,
                time: "Just now",
                timestamp: Date.now(),
                read: false
            };
            vm.recentNotifications.push(newNotif);
            
            $mdToast.show(
                $mdToast.simple()
                    .textContent("Alert: " + data.title + " - " + data.message)
                    .position("bottom right")
                    .hideDelay(4000)
            );
        });

        navService.loadAllItems().then(function (menuItems) {
            vm.menuItems = [].concat(menuItems);
        });

        function toggleRightSidebar() {
            $mdSidenav('right').toggle();
        }

        function toggleItemsList() {
            var pending = $mdBottomSheet.hide() || $q.when(true);

            pending.then(function () {
                $mdSidenav('left').toggle();
            });
        }

        function selectItem(itemName) {
            vm.title = itemName;
            vm.toggleItemsList();
        }

        function getUserData() {
            $q.all([
                storageService.getObject('user_profile'),
                AccountService.getClientId()
            ]).then(function (results) {
                var profile = results[0];
                var clientId = results[1];

                vm.clientId = clientId;
                if (vm.clientId && typeof vm.clientId === 'object') {
                    vm.clientId = null;
                }

                if (profile) {
                    vm.currentUser = profile;
                    var role = profile._portalRole || 'BUYER';
                    if (role === 'STAFF') {
                        vm.isStaff = true;
                        vm.isBuyer = false;
                        vm.isSeller = false;
                        vm.tradeRoleLabel = 'Bank Staff Portal';
                        vm.profile = { displayName: profile.username || 'Bank Staff' };
                        triggerWelcomeMessage();
                    } else {
                        vm.isBuyer = true;
                        vm.isStaff = false;
                        vm.isSeller = false;
                        vm.tradeRoleLabel = 'Buyer Portal';
                        if (vm.clientId) {
                            getClient(vm.clientId);
                            getClientImage(vm.clientId);
                        } else {
                            vm.profile = { displayName: profile.username || 'Buyer' };
                            triggerWelcomeMessage();
                        }
                    }
                } else {
                    var sellerSession = localStorage.getItem('seller_session');
                    if (sellerSession) {
                        var sellerData = JSON.parse(sellerSession);
                        vm.currentUser = sellerData;
                        vm.isSeller = true;
                        vm.isBuyer = false;
                        vm.isStaff = false;
                        vm.tradeRoleLabel = 'Seller Portal';
                        vm.profile = { displayName: sellerData.companyName || 'Seller' };
                        triggerWelcomeMessage();
                    } else {
                        // Default fallback
                        vm.isBuyer = true;
                        vm.isStaff = false;
                        vm.isSeller = false;
                        vm.tradeRoleLabel = 'Buyer Portal';
                        triggerWelcomeMessage();
                    }
                }
            });
        }

        function getClient(clientId) {
            AccountService.getClient(clientId).get().$promise.then(function (data) {
                vm.profile = data;
                triggerWelcomeMessage();
            });
        }

        function getClientImage(clientId) {
            AccountService.getClientImage(clientId).then(function (resp) {
                vm.profileImage = resp.data;
            }).catch(function() {
                vm.profileImage = null;
            });
        }

        function logout() {
            AuthService.logout();
        }

    }

})();
