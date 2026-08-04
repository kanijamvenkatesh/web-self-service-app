(function(){
    'use strict';

    angular.module('selfService')
        .controller('DashboardCtrl', ['$filter', 'AccountService', 'LoanAccountService', 'SavingsAccountService', '$http', 'BASE_URL', DashboardCtrl]);

    function DashboardCtrl($filter, AccountService, LoanAccountService, SavingsAccountService, $http, BASE_URL) {
        var vm = this;
        vm.accountTypeOptions = ['Loan', 'Savings', 'Shares', 'Recurring Deposit'];
        vm.accountno;
        vm.accountType='';
        vm.paymentTypes;
        vm.showTransactionGraph = false;
        vm.transactionDatas = [];
        vm.selectPayment = selectPayment;
        vm.submit = submit;
        vm.dashboardData = {};
        vm.options = {
            chart: {
                type: 'pieChart',
                height: 300,
                showLabels: false,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                duration: 500,
                labelSunbeamLayout: true,
            }
        };

        vm.options2 = {
            chart: {
                type: 'discreteBarChart',
                height: 400,
                x: function(a){return a.label;},
                y: function(a){return a.value;},
                showValues: false,
                showXAxis: false,
                staggerLabels: true,
                duration: 200,
                xAxis: {
                    axisLabel: 'Date of Transaction'
                },
                yAxis: {
                    axisLabel: 'Money in your currency',
                    axisLabelDistance: -5
                }
            }
        };

        vm.getDashboardData = getDashboardData();

        function getDashboardData() {
            AccountService.getClientId().then(function (clientId) {
                if (clientId) {
                    AccountService.getAllAccounts(clientId).get().$promise.then(function(data) {
                        var allSavings = data.savingsAccounts || [];
                        vm.dashboardData.loanAccounts = data.loanAccounts || [];
                        vm.dashboardData.shareAccounts = data.shareAccounts || [];
                        
                        // Filter savings vs recurring deposits dynamically using Fineract depositType field
                        vm.dashboardData.savingsAccounts = allSavings.filter(function (acct) {
                            return !acct.depositType || acct.depositType.value === 'Savings';
                        });
                        vm.dashboardData.recurringDepositAccounts = allSavings.filter(function (acct) {
                            return acct.depositType && (acct.depositType.value === 'Recurring Deposit' || acct.depositType.code === 'depositAccountType.recurringDeposit');
                        });
                        
                        vm.dashboardData.totalAccounts = vm.dashboardData.loanAccounts.length + vm.dashboardData.savingsAccounts.length + vm.dashboardData.shareAccounts.length + vm.dashboardData.recurringDepositAccounts.length;
                        vm.dashboardData.totalSavings = vm.dashboardData.savingsAccounts.reduce(getTotalSavings, 0).toFixed(2);
                        vm.dashboardData.totalLoan = vm.dashboardData.loanAccounts.reduce(getTotalLoan, 0).toFixed(2);
                        vm.dashboardData.totalRecurring = vm.dashboardData.recurringDepositAccounts.reduce(getTotalSavings, 0).toFixed(2);
                        
                        vm.dashboardData.loanAccountsOverview = getChartData(data.loanAccounts);
                        vm.dashboardData.savingsAccountsOverview = getChartData(vm.dashboardData.savingsAccounts);
                        vm.dashboardData.shareAccountsOverview = getChartData(data.shareAccounts);
                        vm.dashboardData.recurringDepositOverview = getChartData(vm.dashboardData.recurringDepositAccounts);
     
                        // Map accounts to a selectable dropdown list
                        vm.allSelectableAccounts = [];
                        vm.dashboardData.savingsAccounts.forEach(function (acct) {
                            vm.allSelectableAccounts.push({
                                id: acct.id,
                                accountNo: acct.accountNo,
                                displayName: 'Savings - ' + acct.accountNo + ' (' + acct.productName + ')',
                                type: 'Savings'
                            });
                        });
                        vm.dashboardData.loanAccounts.forEach(function (acct) {
                            vm.allSelectableAccounts.push({
                                id: acct.id,
                                accountNo: acct.accountNo,
                                displayName: 'Loan - ' + acct.accountNo + ' (' + acct.productName + ')',
                                type: 'Loan'
                            });
                        });
                        vm.dashboardData.recurringDepositAccounts.forEach(function (acct) {
                            vm.allSelectableAccounts.push({
                                id: acct.id,
                                accountNo: acct.accountNo,
                                displayName: 'Recurring - ' + acct.accountNo + ' (' + acct.productName + ')',
                                type: 'Recurring Deposit'
                            });
                        });
                    });
                } else {
                    console.warn('Dashboard data fetch skipped: clientId is null. User may not be logged in or session expired.');
                    // Optional: $location.path('/login');
                }
            })
        }

        vm.filteredAccounts = [];

        vm.onAccountTypeChange = function () {
            vm.selectedAccountNoObject = null;
            vm.accountno = null;
            vm.paymentType = null;
            vm.paymentTypes = [];
            vm.filteredAccounts = [];
            vm.showTransactionGraph = false;

            if (vm.accountType === 'Savings') {
                vm.filteredAccounts = vm.dashboardData.savingsAccounts || [];
            } else if (vm.accountType === 'Loan') {
                vm.filteredAccounts = vm.dashboardData.loanAccounts || [];
            } else if (vm.accountType === 'Shares') {
                vm.filteredAccounts = vm.dashboardData.shareAccounts || [];
            } else if (vm.accountType === 'Recurring Deposit') {
                vm.filteredAccounts = vm.dashboardData.recurringDepositAccounts || [];
            }
        };

        vm.onAccountNoChange = function () {
            console.log('onAccountNoChange triggered!');
            console.log('Selected Account Object:', vm.selectedAccountNoObject);
            console.log('Selected Account Type:', vm.accountType);
            
            if (vm.selectedAccountNoObject) {
                vm.accountno = vm.selectedAccountNoObject.id;
                console.log('Bound Account ID (vm.accountno):', vm.accountno);
                vm.paymentType = null;
                vm.showTransactionGraph = false;
                vm.paymentTypes = [];

                if (vm.accountType === 'Savings') {
                    console.log('Fetching Savings details for ID:', vm.accountno);
                    SavingsAccountService.savingsAccount().get({id: vm.accountno, associations: 'transactions'}).$promise.then(function(res) {
                        console.log('Savings API response received:', res);
                        vm.savingsAccountDetails = res;
                        var trans = res.transactions || [];
                        console.log('Savings Transactions array:', trans);
                        for(var j in trans){
                            vm.paymentTypes.push(trans[j].transactionType.value);
                        }
                        vm.paymentTypes = remove_duplicates(vm.paymentTypes);
                        console.log('Populated Savings paymentTypes:', vm.paymentTypes);
                    }).catch(function(err) {
                        console.error('Savings API request failed:', err);
                    });
                } else if (vm.accountType === 'Loan') {
                    console.log('Fetching Loan details for ID:', vm.accountno);
                    LoanAccountService.loanAccount().get({id: vm.accountno, associations: 'transactions'}).$promise.then(function(res) {
                        console.log('Loan API response received:', res);
                        vm.loanAccountDetails = res;
                        var trans = res.transactions || [];
                        console.log('Loan Transactions array:', trans);
                        for(var j in trans){
                            vm.paymentTypes.push(trans[j].type.value);
                        }
                        vm.paymentTypes = remove_duplicates(vm.paymentTypes);
                        console.log('Populated Loan paymentTypes:', vm.paymentTypes);
                    }).catch(function(err) {
                        console.error('Loan API request failed:', err);
                    });
                } else if (vm.accountType === 'Shares') {
                    console.log('Fetching Shares details for ID:', vm.accountno);
                    $http.get(BASE_URL + '/self/shareaccounts/' + vm.accountno)
                        .then(function (res) {
                            console.log('Shares API response received:', res.data);
                            var trans = res.data.purchasedShares || res.data.transactions || [];
                            console.log('Shares Transactions array:', trans);
                            for(var j in trans){
                                var t = (trans[j].type && trans[j].type.value) || 'Purchase';
                                vm.paymentTypes.push(t);
                            }
                            vm.paymentTypes = remove_duplicates(vm.paymentTypes);
                            console.log('Populated Shares paymentTypes:', vm.paymentTypes);
                        })
                        .catch(function (err) {
                            console.error('Shares API request failed:', err);
                            vm.paymentTypes = [];
                        });
                } else if (vm.accountType === 'Recurring Deposit') {
                    console.log('Fetching Recurring Deposit details for ID:', vm.accountno);
                    $http.get(BASE_URL + '/self/savingsaccounts/' + vm.accountno + '?associations=transactions')
                        .then(function (res) {
                            console.log('Recurring Deposit API response received:', res.data);
                            var trans = res.data.transactions || [];
                            console.log('Recurring Deposit Transactions array:', trans);
                            for(var j in trans){
                                vm.paymentTypes.push(trans[j].transactionType.value);
                            }
                            vm.paymentTypes = remove_duplicates(vm.paymentTypes);
                            console.log('Populated Recurring Deposit paymentTypes:', vm.paymentTypes);
                        })
                        .catch(function (err) {
                            console.error('Recurring Deposit API request failed:', err);
                            vm.paymentTypes = [];
                        });
                }
            }
        };

        function getTotalSavings(total, acc) {
            if(acc.accountBalance) {
                return total + acc.accountBalance;
            } else {
                return total;
            }
        }

        function getTotalLoan(total, acc) {
            if(acc.loanBalance) {
                return total + acc.loanBalance;
            } else {
                return total;
            }
        }

        function getChartData(accounts) {
            var chartObj = {};
            accounts.map(function(acc) {
               chartObj[acc.status.value] = (chartObj[acc.status.value]) ? chartObj[acc.status.value] + 1: 1;
            });
            var chartData  = [];
            var keys = Object.keys(chartObj);
            for (var i in keys) {
                chartData.push({
                    key: keys[i],
                    y: chartObj[keys[i]]
                });
            }
            return chartData;
        }

        function getLoanDetails(id,payType) {
            LoanAccountService.loanAccount().get({
                id: id,
                associations: 'transactions'
            }).$promise.then(function (res) {
                vm.loanAccountDetails = res;

                var chartData = [];
                var values2=[];
                vm.paymentTypes =[];
                for(var j in vm.loanAccountDetails.transactions){
                   vm.paymentTypes.push(vm.loanAccountDetails.transactions[j].type.value);
                }
                vm.paymentTypes = remove_duplicates(vm.paymentTypes);

                    for (var i in vm.loanAccountDetails.transactions){

                        if(vm.loanAccountDetails.transactions[i].type.value == payType){
                            var transactionDate = $filter('date')( new Date(vm.loanAccountDetails.transactions[i].date), 'dd MMMM yyyy');
                            values2.push({
                                label: transactionDate,
                                value: vm.loanAccountDetails.transactions[i].amount
                            });
                        }
                    }
                    chartData.push({
                        key: 'transactions',
                        values: values2
                    });
                    vm.transactionDatas=chartData;

            });
        }

        function getSavingsDetail(id,payType) {
            SavingsAccountService.savingsAccount().get({id: id, associations: 'transactions'}).$promise.then(function(res) {
                vm.savingsAccountDetails = res;
                vm.transactions = res.transactions;

                var chartData = [];
                var values2=[];
                vm.paymentTypes =[];
                for(var j in vm.savingsAccountDetails.transactions){
                    vm.paymentTypes.push(vm.savingsAccountDetails.transactions[j].transactionType.value);
                }
                vm.paymentTypes = remove_duplicates(vm.paymentTypes);

                for (var i in vm.savingsAccountDetails.transactions){

                    if(vm.savingsAccountDetails.transactions[i].transactionType.value == payType){
                        var transactionDate = $filter('date')( new Date(vm.savingsAccountDetails.transactions[i].date), 'dd MMMM yyyy');
                        values2.push({
                            label: transactionDate,
                            value: vm.savingsAccountDetails.transactions[i].amount
                        });
                    }
                }
                chartData.push({
                    key: 'transactions',
                    values: values2
                });
                vm.transactionDatas=chartData;

            });
        }



        function remove_duplicates(arr) {
            var seen = {};
            var ret_arr = [];
            for (var i = 0; i < arr.length; i++) {
                if (!(arr[i] in seen)) {
                    ret_arr.push(arr[i]);
                    seen[arr[i]] = true;
                }
            }
            return ret_arr;

        }

        function selectPayment(payType) {
            if(vm.accountType=='Loan'){
                getLoanDetails(vm.accountno, payType);
            }
            if(vm.accountType=='Savings'){
                getSavingsDetail(vm.accountno,payType);
            }
            if(vm.accountType=='Shares'){
                getShareDetails(vm.accountno, payType);
            }
            if(vm.accountType=='Recurring Deposit'){
                getRecurringDetails(vm.accountno, payType);
            }
        }

        function submit(payType) {
            if(vm.accountType=='Loan'){
                getLoanDetails(vm.accountno, payType);
                vm.showTransactionGraph=true;
            }
            if(vm.accountType=='Savings'){
                getSavingsDetail(vm.accountno,payType);
                vm.showTransactionGraph=true;
            }
            if(vm.accountType=='Shares'){
                getShareDetails(vm.accountno, payType);
                vm.showTransactionGraph=true;
            }
            if(vm.accountType=='Recurring Deposit'){
                getRecurringDetails(vm.accountno, payType);
                vm.showTransactionGraph=true;
            }
        }

        function getShareDetails(id, payType) {
            $http.get(BASE_URL + '/self/shareaccounts/' + id)
                .then(function (res) {
                    var chartData = [];
                    var values2 = [];
                    var trans = res.data.purchasedShares || res.data.transactions || [];
                    
                    for (var i in trans) {
                        var t = (trans[i].type && trans[i].type.value) || 'Purchase';
                        if (t == payType) {
                            var transDate = trans[i].purchasedDate || trans[i].date;
                            var transactionDate = $filter('date')(new Date(transDate), 'dd MMMM yyyy');
                            values2.push({
                                label: transactionDate,
                                value: trans[i].amount || (trans[i].numberOfShares * (trans[i].shareValue || 1))
                            });
                        }
                    }
                    chartData.push({
                        key: 'transactions',
                        values: values2
                    });
                    vm.transactionDatas = chartData;
                })
                .catch(function () {
                    vm.transactionDatas = [];
                });
        }

        function getRecurringDetails(id, payType) {
            $http.get(BASE_URL + '/self/savingsaccounts/' + id + '?associations=transactions')
                .then(function (res) {
                    var chartData = [];
                    var values2 = [];
                    var trans = res.data.transactions || [];
                    
                    for (var i in trans) {
                        if (trans[i].transactionType.value == payType) {
                            var transactionDate = $filter('date')(new Date(trans[i].date), 'dd MMMM yyyy');
                            values2.push({
                                label: transactionDate,
                                value: trans[i].amount
                            });
                        }
                    }
                    chartData.push({
                        key: 'transactions',
                        values: values2
                    });
                    vm.transactionDatas = chartData;
                })
                .catch(function () {
                    vm.transactionDatas = [];
                });
        }



    }
})();
