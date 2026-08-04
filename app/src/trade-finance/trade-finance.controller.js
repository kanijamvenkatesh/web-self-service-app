(function () {
    'use strict';

    angular.module('selfService')
        .controller('TradeFinanceCtrl', [
            '$scope', '$rootScope', '$mdDialog', '$mdToast',
            'AuthService', 'AccountService', 'TradeFinanceService', 'storageService', '$q', '$stateParams',
            TradeFinanceCtrl
        ]);

    function TradeFinanceCtrl(
        $scope, $rootScope, $mdDialog, $mdToast,
        AuthService, AccountService, TradeFinanceService, storageService, $q, $stateParams
    ) {
        var vm = this;
        vm.loading = false;
        vm.lcs = [];
        vm.currentLc = null;
        vm.documents = [];
        vm.showApplyForm = ($stateParams.showApply === 'true' || $stateParams.showApply === true);
        vm.showLcs = ($stateParams.showLcs === 'true' || $stateParams.showLcs === true);

        $scope.$watch(function () {
            return $stateParams.showApply;
        }, function (newVal) {
            if (newVal !== undefined && newVal !== null) {
                vm.showApplyForm = (newVal === 'true' || newVal === true);
            }
        });

        $scope.$watch(function () {
            return $stateParams.showLcs;
        }, function (newVal) {
            if (newVal !== undefined && newVal !== null) {
                vm.showLcs = (newVal === 'true' || newVal === true);
            }
        });

        vm.isStaff = false;
        vm.isBuyer = false;
        vm.isSeller = false;

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
                } else {
                    vm.isBuyer = true;
                }
            } else {
                var sellerSession = localStorage.getItem('seller_session');
                if (sellerSession) {
                    vm.sellerData = JSON.parse(sellerSession);
                    vm.currentUser = vm.sellerData;
                    vm.isSeller = true;
                } else {
                    vm.isBuyer = true;
                }
            }

            vm.roleName = vm.isStaff ? 'Bank Staff (Trade Desk)' : (vm.isSeller ? 'Seller (Exporter)' : 'Buyer (Importer)');

            if (vm.isBuyer) {
                vm.newLc.buyerClientId = vm.clientId || 2;
                vm.newLc.buyerName = vm.currentUser ? vm.currentUser.username : 'Import Corp';
            }

            vm.loadLcs();
            vm.loadTradeCapacity();
            if (vm.isStaff) {
                vm.loadFineractClients();
            }
            vm.loadCurrencies();
        });

        // New LC form data initialization
        vm.newLc = {
            amount: 50000.00,
            currency: 'USD',
            marginPercent: 10.00,
            buyerClientId: vm.clientId || 1,
            buyerName: vm.currentUser ? vm.currentUser.username : 'Import Corp',
            sellerName: 'Global Exporters Ltd',
            goodsDescription: 'Industrial Machinery Type-X',
            portOfLoading: 'Port of Shanghai',
            portOfDischarge: 'Port of Mumbai',
            expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
            latestShipmentDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
        };

        // Proof-of-concept trade capacity. Savings values come from Fineract;
        // the trade limit is deliberately labelled as a demo policy until a
        // bank-approved credit-line product is configured.
        vm.tradeCapacity = {
            currency: 'USD',
            demoTradeLimit: 250000,
            availableSavings: 0,
            outstandingLoanBalance: 0,
            openLcExposure: 0,
            availableTradeLimit: 250000,
            requiredMargin: 0,
            maxLcByMargin: 0,
            availableLcCapacity: 0,
            marginSufficient: false,
            loading: false
        };

        vm.loadTradeCapacity = function () {
            if (!vm.isBuyer || !vm.clientId) {
                return;
            }

            vm.tradeCapacity.loading = true;
            AccountService.getAllAccounts(vm.clientId).get().$promise
                .then(function (data) {
                    var savingsAccounts = data.savingsAccounts || [];
                    var loanAccounts = data.loanAccounts || [];

                    vm.savingsAccountsList = savingsAccounts;
                    vm.loanAccountsList = loanAccounts;

                    vm.tradeCapacity.availableSavings = savingsAccounts.reduce(function (total, account) {
                        return total + Number(account.accountBalance || 0);
                    }, 0);
                    vm.tradeCapacity.outstandingLoanBalance = loanAccounts.reduce(function (total, account) {
                        return total + Number(account.loanBalance || 0);
                    }, 0);
                    vm.tradeCapacity.loading = false;
                    vm.updateTradeCapacity();
                })
                .catch(function () {
                    vm.tradeCapacity.loading = false;
                    vm.tradeCapacity.availableSavings = 0;
                    vm.savingsAccountsList = [];
                    vm.loanAccountsList = [];
                    vm.updateTradeCapacity();
                    $mdToast.show($mdToast.simple().textContent('Unable to load Fineract account balances.').position('top right'));
                });
        };

        vm.fineractClients = [];
        vm.loadFineractClients = function () {
            if (!vm.isStaff) {
                return;
            }
            AccountService.getFineractClients().get().$promise
                .then(function (data) {
                    vm.fineractClients = data.pageItems || [];
                })
                .catch(function () {
                    // Fallback to demo client if Fineract Core is offline or inaccessible
                    vm.fineractClients = [
                        {
                            displayName: 'Kanijam Venkatesh',
                            accountNo: '000000059',
                            status: { value: 'Active' }
                        }
                    ];
                });
        };

        vm.updateTradeCapacity = function () {
            var amount = Number(vm.newLc.amount || 0);
            var marginPercent = Number(vm.newLc.marginPercent || 0);
            var openExposure = vm.lcs.reduce(function (total, lc) {
                return (lc.status === 'SETTLED' || lc.status === 'REJECTED') ? total : total + Number(lc.amount || 0);
            }, 0);

            vm.tradeCapacity.openLcExposure = openExposure;
            vm.tradeCapacity.availableTradeLimit = Math.max(0, vm.tradeCapacity.demoTradeLimit - openExposure);
            vm.tradeCapacity.requiredMargin = amount * marginPercent / 100;
            vm.tradeCapacity.maxLcByMargin = marginPercent > 0
                ? vm.tradeCapacity.availableSavings * 100 / marginPercent
                : 0;
            vm.tradeCapacity.availableLcCapacity = Math.max(0, Math.min(
                vm.tradeCapacity.availableTradeLimit,
                vm.tradeCapacity.maxLcByMargin
            ));
            vm.tradeCapacity.marginSufficient = vm.tradeCapacity.availableSavings >= vm.tradeCapacity.requiredMargin;

            // Calculate dynamic May bar stats for SVG Graph
            var mayVolume = vm.lcs.reduce(function (total, lc) {
                return total + Number(lc.amount || 0);
            }, 0);
            vm.mayVolumeLabel = '$' + (mayVolume / 1000).toFixed(0) + 'k';
            vm.mayBarHeight = Math.min(120, Math.max(15, (mayVolume / 1500))); 
            vm.mayBarY = 150 - vm.mayBarHeight;
            vm.mayTextY = vm.mayBarY - 8;
        };

        vm.hasTradeCapacity = function () {
            vm.updateTradeCapacity();
            return vm.tradeCapacity.marginSufficient
                && Number(vm.newLc.amount || 0) <= vm.tradeCapacity.availableLcCapacity;
        };
        // Load LC contracts list
        vm.loadLcs = function () {
            vm.loading = true;
            var params = {};
            if (vm.isBuyer) {
                var bId = vm.clientId;
                if (bId && typeof bId !== 'object' && !isNaN(bId)) {
                    params.buyerId = bId;
                } else {
                    params.buyerId = 2; // Fallback to Kanijam Venkatesh (Client ID 2)
                }
            }
            if (vm.isSeller) {
                // For demo purposes, we do not filter by seller ID
                // so the user can see all LCs (including Samsung) while logged into eglobal
            }

            TradeFinanceService.getLcs(params)
                .then(function (res) {
                    vm.lcs = res.data;
                    vm.calculateSummaries();
                    vm.loading = false;
                })
                .catch(function () {
                    vm.lcs = [];
                    vm.calculateSummaries();
                    vm.loading = false;
                    $mdToast.show($mdToast.simple().textContent('Unable to load LC data from the trade middleware.').position('top right'));
                });
        };

        vm.calculateSummaries = function () {
            if (vm.isSeller) {
                vm.totalCount = vm.lcs.filter(function(lc) { return lc.status !== 'DRAFT' && lc.status !== 'APPLIED' && lc.status !== 'REJECTED'; }).length;
            } else {
                vm.totalCount = vm.lcs.length;
            }
            vm.activeCount = vm.lcs.filter(function(lc) { return lc.status === 'ISSUED'; }).length;
            vm.pendingApprovalCount = vm.lcs.filter(function(lc) { return lc.status === 'APPLIED'; }).length;
            vm.pendingAuditCount = vm.lcs.filter(function(lc) { return lc.status === 'PRESENTED'; }).length;
            vm.settledCount = vm.lcs.filter(function(lc) { return lc.status === 'SETTLED'; }).length;
            vm.rejectedCount = vm.lcs.filter(function(lc) { return lc.status === 'REJECTED'; }).length;
            if (vm.isBuyer && vm.tradeCapacity) { vm.updateTradeCapacity(); }

            // Notify Staff of pending items
            if (vm.isStaff && !vm.notifiedPendingStaff) {
                if (vm.pendingApprovalCount > 0) {
                    $rootScope.$broadcast('trade:notification', {
                        title: 'Action Required: Pending Applications',
                        message: 'You have ' + vm.pendingApprovalCount + ' new LC application(s) awaiting your review.'
                    });
                }
                if (vm.pendingAuditCount > 0) {
                    $rootScope.$broadcast('trade:notification', {
                        title: 'Action Required: Pending Audits',
                        message: 'You have ' + vm.pendingAuditCount + ' LC(s) awaiting settlement audit.'
                    });
                }
                vm.notifiedPendingStaff = true;
            }
        };

        vm.getFilteredLcs = function(searchText, tab) {
            if (!vm.lcs) return 0;
            var filtered = vm.lcs;
            if (searchText) {
                var lower = searchText.toLowerCase();
                filtered = filtered.filter(function(lc) {
                    return (lc.lcNumber && lc.lcNumber.toLowerCase().indexOf(lower) !== -1) ||
                           (lc.sellerName && lc.sellerName.toLowerCase().indexOf(lower) !== -1) ||
                           (lc.buyerName && lc.buyerName.toLowerCase().indexOf(lower) !== -1) ||
                           (lc.status && lc.status.toLowerCase().indexOf(lower) !== -1);
                });
            }
            if (tab && tab !== 'ALL') {
                filtered = filtered.filter(function(lc) { return lc.status === tab; });
            }
            return filtered.length;
        };

        vm.currencies = [
            { code: 'USD' },
            { code: 'EUR' },
            { code: 'GBP' }
        ]; // Default fallback

        vm.loadCurrencies = function() {
            AccountService.getCurrencies().then(function(res) {
                var data = res.data || res;
                var currList = data.selectedCurrencyOptions || data.currencyOptions || data;
                if (Array.isArray(currList) && currList.length > 0) {
                    vm.currencies = currList.map(function(c) { return { code: c.code || c }; });
                    var found = vm.currencies.filter(function(c) { return c.code === vm.newLc.currency; });
                    if (found.length === 0) {
                        vm.newLc.currency = vm.currencies[0].code;
                    }
                }
            }).catch(function(err) {
                console.warn('Failed to fetch currencies, using fallback', err);
                vm.currencies = [
                    { code: 'USD' },
                    { code: 'EUR' },
                    { code: 'GBP' },
                    { code: 'INR' }
                ];
            });
        };

        vm.hasCurrency = function(code) {
            if (!vm.currencies) return false;
            return vm.currencies.some(function(c) {
                return (c.code === code) || (c === code);
            });
        };

        // Open LC detail modal / view
        vm.viewLcDetails = function (lc) {
            vm.currentLc = lc;
            vm.loadDocuments(lc.id);
        };

        vm.loadDocuments = function (lcId) {
            TradeFinanceService.getDocuments(lcId)
                .then(function (res) {
                    vm.documents = res.data;
                })
                .catch(function () {
                    vm.documents = [];
                    $mdToast.show($mdToast.simple().textContent('Unable to load shipping documents.').position('top right'));
                });
        };

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Actions ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
        
        // Buyer action: Submit new LC draft
        vm.applyLc = function () {
            if (!vm.hasTradeCapacity()) {
                $mdToast.show($mdToast.simple().textContent('LC amount exceeds available trade capacity or savings margin.').position('top right'));
                return;
            }
            vm.loading = true;
            
            // Map frontend UI fields to backend LetterOfCreditApplicationDTO
            var payload = {
                sellerId: 1, // Default demo seller ID must match loadLcs sellerId
                buyerClientId: vm.newLc.buyerClientId || 2,
                buyerName: vm.newLc.buyerName || 'Import Corp',
                sellerName: vm.newLc.sellerName,
                tradeValue: vm.newLc.amount,
                collateralMarginPercentage: vm.newLc.marginPercent,
                portOfLoading: vm.newLc.portOfLoading,
                portOfDischarge: vm.newLc.portOfDischarge,
                goodsDescription: vm.newLc.goodsDescription,
                currency: vm.newLc.currency
            };
            
            TradeFinanceService.createLc(payload)
                .then(function (res) {
                    return TradeFinanceService.submitLc(res.data.id);
                })
                .then(function () {
                    $mdToast.show($mdToast.simple().textContent('LC Application Submitted Successfully!').position('top right'));
                    $rootScope.$broadcast('trade:notification', {
                        title: 'LC Application Submitted',
                        message: 'LC application for ' + vm.newLc.sellerName + ' (' + vm.newLc.amount + ' ' + vm.newLc.currency + ') submitted successfully.'
                    });
                    vm.loadLcs();
                    vm.showApplyForm = false;
                })
                .catch(function () {
                    vm.loading = false;
                    $mdToast.show($mdToast.simple().textContent('LC submission failed. Please retry after checking the trade middleware.').position('top right'));
                });
        };

        // Staff action: Approve & Lock Collateral
        vm.approveLc = function (lc) {
            $mdDialog.show($mdDialog.confirm()
                .title('Approve Letter of Credit?')
                .textContent('This will freeze ' + lc.currency + ' ' + lc.collateralHoldAmount + ' in the Buyer\'s savings account.')
                .ok('Approve & Lock Funds')
                .cancel('Cancel')
            ).then(function () {
                vm.loading = true;
                TradeFinanceService.approveLc(lc.id, vm.currentUser ? vm.currentUser.username : 'BankOfficer')
                    .then(function () {
                        $mdToast.show($mdToast.simple().textContent('LC Approved & Collateral Locked!').position('top right'));
                        $rootScope.$broadcast('trade:notification', {
                            title: 'LC Approved & Locked',
                            message: 'LC ' + lc.lcNumber + ' approved. Collateral hold of ' + lc.collateralHoldAmount + ' ' + lc.currency + ' placed in Fineract.'
                        });
                        vm.loadLcs();
                        vm.currentLc = null;
                    })
                    .catch(function () {
                        vm.loading = false;
                        $mdToast.show($mdToast.simple().textContent('LC approval failed. No collateral or SWIFT action was completed.').position('top right'));
                    });
            });
        };

        // Seller action: Present/Upload Shipping Documents
        
        vm.uploadMockDocument = function (lc) {
            if (!lc) return;
            
            // Create simulated text file representing Bill of Lading
            var blob = new Blob(["Simulated Electronic Bill of Lading (eBL) content for " + lc.lcNumber + ". Verified shipping details: Vessel Ever Given, Cargo coffee beans."], { type: "text/plain" });
            var file = new File([blob], "ebl_coffee_beans.txt");
            
            vm.loading = true;
            TradeFinanceService.uploadDocument(lc.id, file, 'BILL_OF_LADING', vm.currentUser ? vm.currentUser.username : 'Seller')
                .then(function () {
                    $mdToast.show($mdToast.simple().textContent('Shipping Document Presented Successfully!').position('top right'));
                    $rootScope.$broadcast('trade:notification', {
                        title: 'Documents Presented',
                        message: 'Bill of Lading and shipping invoice for LC ' + lc.lcNumber + ' presented to bank for audit.'
                    });
                    vm.loadLcs();
                    vm.loadDocuments(lc.id);
                })
                .catch(function () {
                    vm.loading = false;
                    $mdToast.show($mdToast.simple().textContent('Document upload failed. Please try again.').position('top right'));
                });
        };

        // Staff/Seller action: Upload and run OCR document check
        vm.runOcrCheck = function (doc) {
            doc.scrutinyStatus = 'PENDING';
            TradeFinanceService.runScrutiny(doc.id)
                .then(function (res) {
                    doc.scrutinyStatus = res.data.scrutinyStatus;
                    doc.scrutinyNotes = res.data.scrutinyNotes;
                    $mdToast.show($mdToast.simple().textContent('OCR Scrutiny Complete!').position('top right'));
                    $rootScope.$broadcast('trade:notification', {
                        title: 'OCR Scrutiny Complete',
                        message: 'Document ' + doc.fileName + ' checked. Status: ' + doc.scrutinyStatus + '.'
                    });
                })
                .catch(function () {
                    doc.scrutinyStatus = 'FAILED';
                    doc.scrutinyNotes = 'OCR scrutiny could not be completed.';
                    $mdToast.show($mdToast.simple().textContent('OCR scrutiny failed. Please retry.').position('top right'));
                });
        };

        // Staff action: Settle & Disburse
        vm.rejectLc = function (lc) {
            var confirm = $mdDialog.prompt()
                .title('Reject Letter of Credit')
                .textContent('Please provide a reason for rejecting this application.')
                .placeholder('Reason for Rejection')
                .ariaLabel('Reason')
                .initialValue('')
                .ok('Confirm Reject')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function(reason) {
                if (!reason || reason.trim() === '') {
                    $mdToast.show($mdToast.simple().textContent('Rejection requires a valid reason.').position('top right'));
                    return;
                }
                vm.loading = true;
                TradeFinanceService.rejectLc(lc.id, reason)
                    .then(function () {
                        $mdToast.show($mdToast.simple().textContent('LC Application Rejected.').position('top right'));
                        vm.loadLcs();
                        vm.currentLc = null;
                    })
                    .catch(function () {
                        $mdToast.show($mdToast.simple().textContent('Failed to reject LC.').position('top right'));
                    })
                    .finally(function () {
                        vm.loading = false;
                    });
            });
        };

        vm.settleLc = function (lc) {
            $mdDialog.show($mdDialog.confirm()
                .title('Settle Letter of Credit?')
                .textContent('This will release the collateral hold and disburse post-shipment loan financing.')
                .ok('Settle & Pay Seller')
                .cancel('Cancel')
            ).then(function () {
                vm.loading = true;
                TradeFinanceService.settleLc(lc.id, vm.currentUser ? vm.currentUser.username : 'BankOfficer')
                    .then(function () {
                        $mdToast.show($mdToast.simple().textContent('LC Settled and Paid!').position('top right'));
                        $rootScope.$broadcast('trade:notification', {
                            title: 'LC Settled & Paid',
                            message: 'Lien released and seller payment posted for LC ' + lc.lcNumber + '.'
                        });
                        vm.loadLcs();
                        vm.currentLc = null;
                    })
                    .catch(function () {
                        vm.loading = false;
                        $mdToast.show($mdToast.simple().textContent('Settlement failed. No payment or collateral release was completed.').position('top right'));
                    });
            });
        };

        vm.sellerLogout = function () {
            AuthService.logout();
        };
    }
})();



