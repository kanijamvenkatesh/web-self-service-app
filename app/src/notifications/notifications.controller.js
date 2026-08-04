(function () {
    'use strict';

    angular.module('selfService')
        .controller('NotificationsCtrl', ['$scope', NotificationsCtrl]);

    function NotificationsCtrl($scope) {
        var vm = this;
        
        // Since the actual stream and data live in MainCtrl, we'll access them via the parent scope.
        // This keeps the unread count in the top-right header perfectly in sync with this view!
        var mainVm = $scope.$parent.vm;

        vm.getNotifications = function() {
            return mainVm.recentNotifications || [];
        };

        vm.getUnreadCount = function() {
            return mainVm.getUnreadCount ? mainVm.getUnreadCount() : 0;
        };

        vm.getTimeAgo = function(timestamp) {
            if (mainVm.getTimeAgo) {
                return mainVm.getTimeAgo(timestamp);
            }
            return "Just now";
        };

        vm.markAsRead = function(notif, $event) {
            if (mainVm.markAsRead) {
                mainVm.markAsRead(notif, $event);
            }
        };

        vm.markAllAsRead = function($event) {
            if (mainVm.markAllAsRead) {
                mainVm.markAllAsRead($event);
            }
        };
    }
})();
