(function () {
    'use strict';

    angular.module('selfService')

        .config(function ($stateProvider, $urlRouterProvider, USER_ROLES) {

            $urlRouterProvider
                .when('', '/')
                .otherwise('/404');

            $stateProvider
                .state('app', {
                    abstract: true,
                    templateUrl: 'src/common/main.html',
                    controller: 'MainCtrl',
                    controllerAs: 'vm',
                    data: {
                        authorizedRoles: [USER_ROLES.user]
                    }
                })
                .state('404', {
                    url: '/404',
                    templateUrl: 'src/common/404.html'
                })
                .state('app.dashboard', {
                    url: '/',
                    templateUrl: 'src/dashboard/dashboard.html',
                    controller: 'DashboardCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Dashboard', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.notifications', {
                    url: '/notifications',
                    templateUrl: 'src/notifications/notifications.html',
                    controller: 'NotificationsCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Notification Center', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.accounts', {
                    url: '/accounts',
                    templateUrl: 'src/accounts/account-list/account-list.html',
                    controller: 'AccountCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Accounts', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.viewloanaccount', {
                    url: '/viewloanaccount/:id',
                    templateUrl: 'src/accounts/loan-account-detail/loan-account-detail.html',
                    controller: 'LoanAccountViewCtrl',
                    controllerAs: 'vm',
                    data: { title: 'View Loan Account', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.viewsavingsaccount', {
                    url: '/viewsavingsaccount/:id',
                    templateUrl: 'src/accounts/savings-account-detail/savings-account-detail.html',
                    controller: 'SavingsAccountViewCtrl',
                    controllerAs: 'vm',
                    data: { title: 'View Savings Account', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.recenttransactions', {
                    url: '/recenttransactions',
                    templateUrl: 'src/recent-transactions/recent-transactions.html',
                    controller: 'RecentTransactionCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Recent Transactions', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.charges', {
                    url: '/charges',
                    templateUrl: 'src/charges/charges.html',
                    controller: 'ChargesCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Charges', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.aboutus', {
                    url: '/about',
                    templateUrl: 'src/aboutUs/aboutUs.html',
                    controller: 'AboutUsCtrl',
                    controllerAs: 'vm',
                    data: { title: 'About Us', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.help', {
                    url: '/help',
                    templateUrl: 'src/help/help.html',
                    controller: 'HelpCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Help', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.profile', {
                    url: '/profile',
                    templateUrl: 'src/common/profile.html',
                    controller: 'ClientCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Profile', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.transfers', {
                    url: '/transfers',
                    templateUrl: 'src/transfers/transfers.html',
                    controller: 'AccountTransferCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Transfers', authorizedRoles: [USER_ROLES.user] },
                    params: { toAccount: null, fromAccount: null }
                })
                .state('app.tpt', {
                    url: '/tpt',
                    templateUrl: 'src/tpt/tpt.html',
                    controller: 'TPTCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Third Party Transfers', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.beneficiarieslist', {
                    url: '/beneficiaries/list',
                    templateUrl: 'src/beneficiaries/beneficiaries-list/beneficiaries-list.html',
                    controller: 'BeneficiariesListCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Beneficiaries List', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.addbeneficiary', {
                    url: '/beneficiaries/add',
                    templateUrl: 'src/beneficiaries/beneficiaries-add/beneficiaries-add.html',
                    controller: 'BeneficiariesAddCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Add Beneficiary', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.editbeneficiary', {
                    url: '/beneficiaries/edit/:id',
                    templateUrl: 'src/beneficiaries/beneficiaries-edit/beneficiaries-edit.html',
                    controller: 'BeneficiariesEditCtrl',
                    controllerAs: 'vm',
                    params: { id: '', data: null },
                    data: { title: 'Edit Beneficiary', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.applyloan', {
                    url: '/loans/apply',
                    templateUrl: 'src/loan-application/loan-application.html',
                    controller: 'LoanApplicationCtrl',
                    controllerAs: 'vm'
                })
                .state('app.reports', {
                    url: '/reports',
                    templateUrl: 'src/reports/view_reports/view_reports.html',
                    controller: 'ViewReportsCtrl',
                    controllerAs: 'vm'
                })
                .state('app.run_report', {
                    url: '/run_report/:name/:id/:type',
                    params: { name: '', id: '', type: '' },
                    templateUrl: 'src/reports/run_reports/run_reports.html',
                    controller: 'RunReportCtrl',
                    controllerAs: 'vm'
                })
                .state('app.applysavings', {
                    url: '/savings/apply',
                    templateUrl: 'src/savings-application/savings-application.html',
                    controller: 'SavingsApplicationCtrl',
                    controllerAs: 'vm'
                })
                .state('app.tradefinance', {
                    url: '/trade-finance',
                    templateUrl: 'src/trade-finance/trade-finance.html',
                    controller: 'TradeFinanceCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Trade Finance', authorizedRoles: [USER_ROLES.user] },
                    params: { showApply: null, showLcs: null }
                })
                .state('app.trade_buyer_applyLc', {
                    url: '/trade-finance/buyer/apply',
                    templateUrl: 'src/trade-finance/buyer/apply-lc.html',
                    controller: 'TradeFinanceBuyerCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Apply for Letter of Credit', authorizedRoles: ['BUYER'] }
                })
                .state('app.trade_seller_uploadDocs', {
                    url: '/trade-finance/seller/upload?lcId',
                    templateUrl: 'src/trade-finance/seller/upload-docs.html',
                    controller: 'TradeFinanceSellerCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Upload eBL and Documents', authorizedRoles: ['SELLER'] }
                })
                .state('app.trade_staff_settlement', {
                    url: '/trade-finance/staff/settlement',
                    templateUrl: 'src/trade-finance/staff/settlement.html',
                    controller: 'TradeFinanceStaffCtrl',
                    controllerAs: 'vm',
                    data: { title: 'OCR Scrutiny & Settlement', authorizedRoles: ['BANK_STAFF'] }
                })
                .state('app.tradepending', {
                    url: '/trade-finance/pending',
                    templateUrl: 'src/trade-finance/pending.html',
                    controller: 'TradeFinanceCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Pending LC Applications', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.tradesettle', {
                    url: '/trade-finance/settle',
                    templateUrl: 'src/trade-finance/settlement.html',
                    controller: 'TradeFinanceCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Settlement Audit Desk', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.tradehistory', {
                    url: '/trade-finance/history',
                    templateUrl: 'src/trade-finance/history.html',
                    controller: 'TradeFinanceCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Trade History Log', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.tradecustomers', {
                    url: '/trade-finance/customers',
                    templateUrl: 'src/trade-finance/customers.html',
                    controller: 'TradeFinanceCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Onboarded Customers Directory', authorizedRoles: [USER_ROLES.user] }
                })
                .state('app.applyshares', {
                    url: '/shares/apply',
                    templateUrl: 'src/shares-application/shares-application.html',
                    controller: 'SharesApplicationCtrl',
                    controllerAs: 'vm'
                })
                .state('app.ocrscrutiny', {
                    url: '/ocr-scrutiny/:lcNumber',
                    templateUrl: 'src/ocr-scrutiny/ocr-scrutiny.html',
                    controller: 'OcrScrutinyCtrl',
                    controllerAs: 'vm',
                    data: { title: 'OCR Scrutiny', authorizedRoles: [USER_ROLES.user] },
                    resolve: {
                        ocrResult: function($q, $timeout, $stateParams) {
                            var deferred = $q.defer();
                            $timeout(function() {
                                deferred.resolve({
                                    data: {
                                        lcNumber: $stateParams.lcNumber,
                                        is_compliant: false,
                                        discrepancies: [
                                            {
                                                field: 'Port_of_Loading',
                                                expected: 'Port of Shanghai',
                                                found: 'Shanghai (Missing "Port of")',
                                                reason: 'Mismatch in exact port naming conventions.'
                                            }
                                        ]
                                    }
                                });
                            }, 500); // 500ms artificial delay
                            return deferred.promise;
                        }
                    }
                })

                // ── Public / auth states ────────────────────────────────────
                .state('login', {
                    url: '/login',
                    templateUrl: 'src/authentication/login/login.html',
                    controller: 'LoginCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Login' }
                })

                // ── NEW: Two-Factor Authentication state ────────────────────
                .state('twofactor', {
                    url: '/twofactor',
                    templateUrl: 'src/twofactor/twofactor.html',
                    controller: 'TwoFactorCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Two-Factor Authentication' }
                })

                .state('forgot', {
                    url: '/forgot',
                    templateUrl: 'src/authentication/forgot/forgot.html',
                    controller: 'ForgotPwdCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Forgot Password' }
                })
                .state('register', {
                    url: '/register',
                    templateUrl: 'src/authentication/register/register.html',
                    controller: 'RegisterCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Register User' }
                })
                .state('verify', {
                    url: '/verify',
                    templateUrl: 'src/authentication/register/verification/verification.html',
                    controller: 'VerificationCtrl',
                    controllerAs: 'vm',
                    data: { title: 'Verify User' }
                });
        });
})();