(function () {

    angular.module('selfService')
        .controller('MainCtrl', ['navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', 'AuthService', 'AccountService', 'storageService', '$interval', 'TradeFinanceService', MainCtrl]);

    function MainCtrl(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, AuthService, AccountService, storageService, $interval, TradeFinanceService) {
        var vm = this;

        vm.menuItems = [];
        vm.profileImage = null;

        vm.selectItem = selectItem;
        vm.toggleItemsList = toggleItemsList;
        vm.toggleRightSidebar = toggleRightSidebar;
        vm.logout = logout;
        vm.openFineractPortal = openFineractPortal;

        vm.isStaff = false;
        vm.isBuyer = false;
        vm.isSeller = false;
        vm.tradeRoleLabel = '';

        // --- Real-time notifications (role-specific event-driven) ---
        var storedNotifs = localStorage.getItem('recent_notifications');
        vm.recentNotifications = storedNotifs ? JSON.parse(storedNotifs) : [];

        function saveNotifications() {
            localStorage.setItem('recent_notifications', JSON.stringify(vm.recentNotifications));
        }

        vm.profile = null;
        getUserData();

        vm.getUnreadCount = function () {
            return vm.recentNotifications.filter(function (notif) {
                return !notif.read;
            }).length;
        };

        vm.getTimeAgo = function(timestamp) {
            if (!timestamp) return "Just now";
            var seconds = Math.floor((new Date() - timestamp) / 1000);
            var interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months ago";
            interval = seconds / 86400;
            if (interval > 1) {
                if (Math.floor(interval) === 1) return "Yesterday";
                return Math.floor(interval) + " days ago";
            }
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " hours ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " mins ago";
            return "Just now";
        };

        vm.markAsRead = function (notif, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            notif.read = true;
            saveNotifications();
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
            saveNotifications();
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

            if (vm.isStaff) return; // Removed for bank staff
            
            var hasWelcome = vm.recentNotifications.some(function(n) { return n.title === "Welcome Wishes"; });
            if (hasWelcome) return;
            
            var welcomeText = "Welcome to the Trade Portal, " + (vm.profile ? (vm.profile.displayName || vm.profile.firstname || vm.currentUser.username) : "User") + "!";
            if (vm.isSeller) {
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
            saveNotifications();
        }

        // Listen for actual real-time application events
        $scope.$on('trade:notification', function(event, data) {
            // Prevent duplicates in the notification list
            var existingNotif = vm.recentNotifications.find(function(n) {
                return n.title === data.title && n.message === data.message;
            });

            if (!existingNotif) {
                var newNotif = {
                    id: Date.now(),
                    title: data.title,
                    message: data.message,
                    time: "Just now",
                    timestamp: Date.now(),
                    read: false
                };
                vm.recentNotifications.push(newNotif);
                saveNotifications();
            } else if (existingNotif.read) {
                // If the backend/system re-broadcasts it, and it was marked read, 
                // we might want to keep it read or let it be. We'll leave it as is.
            }

            // Always show the toast alert so they don't miss it, even on refresh!
            $mdToast.show(
                $mdToast.simple()
                    .textContent("Alert: " + data.title + " - " + data.message)
                    .position("bottom right")
                    .hideDelay(5000)
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
                        TradeFinanceService.initRealTimeStream('STAFF');
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
                        TradeFinanceService.initRealTimeStream('BUYER');
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
                        TradeFinanceService.initRealTimeStream('SELLER');
                    } else {
                        // Default fallback
                        vm.isBuyer = true;
                        vm.isStaff = false;
                        vm.isSeller = false;
                        vm.tradeRoleLabel = 'Buyer Portal';
                        triggerWelcomeMessage();
                        TradeFinanceService.initRealTimeStream('BUYER');
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

        function openFineractPortal() {
            window.open('http://localhost:4200/#/login', '_blank');
        }

    }

})();
