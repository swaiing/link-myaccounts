(function() {

    // static formatting helper
    var AcctFormat = {
        balanceStyle: function(acctType) {
            if (acctType == "credit")
                return "balance-cc";
            else
                return "balance-checking";
        },
        icon: function (acctType) {
            if (acctType == "credit")
                return "icon-credit-card";
            else
                return "icon-bank";
        },
        number: function (acctType, num) {
            if (acctType == "credit")
                return "xxxx-xxxx-xxxx-" + num;
            else if (acctType == "depository")
                return "xxxxxxxx" + num;
        },
        name: function (institutionType, acctType, acctSubtype) {
            var name = "";
            if (institutionType == "schwab")
                name = "Charles Schwab";
            else if (institutionType == "chase")
                name = "Chase";
            else if (institutionType == "amex")
                name = "American Express";
            else
                name = "Unknown Institution";

            if (acctType == "credit") {
                name += " Credit Card";
            }
            else if (acctType == "depository") {
                if (acctSubtype == "checking")
                    name += " Checking"
                else if (acctSubtype == "savings")
                    name += " Savings"
            }
            return name;
        },
    };

    // angular
    var app = angular.module('accounts', []);
    app.controller('AddAccountsController', ['$scope', '$http', function ($scope, $http) {

    // static account data
    var staticAccts = [
    {
        name: "Static Savings",
        number: AcctFormat.number("depository", "9999"),
        balance: "5000.00",
        icon: "icon-bank",
        balanceStyle: AcctFormat.balanceStyle("depository"),
        id: 0,
        token: "public_key",
    },
        {
        name: "Static Credit Card",
        number: AcctFormat.number("credit", "4000"),
        balance: "-800.00",
        icon: "icon-credit-card",
        balanceStyle: AcctFormat.balanceStyle("credit"),
        id: 1,
        token: "public_key",
        }];
    $scope.accts = staticAccts;

    // 'Link Account' handler
    $scope.addAcct = function () {
        Plaid.create({
            clientName: 'My Accounts',
            env: 'tartan',
            product: 'auth',
            key: '3de900bd65d2e9abfb55a3ac38db33', // Plaid public key
            onSuccess: function (token) { callAuth(token) }
        }).open();
    };

    // callback
    var callAuth = function (token) {
        $http({
            url: "/accounts",
            method: "GET",
            params: { public_token:token }

        }).success(function (data, status, headers, config) {
            var newAccts = processAccounts(data.accounts);
            angular.forEach(newAccts, function (acct, key) {
                $scope.accts.push({ 
                    name: acct.name,
                    number: acct.number,
                    balance: acct.balance,
                    icon: acct.icon,
                    balanceStyle: acct.balanceStyle,
                    id: $scope.accts.length,
                    token: token,
                });
                $scope.balance = acct.balance;
                $scope.name = acct.name;
            });

        }).error(function (data, status, headers, config) {
            alert("There was a problem retrieving your account, status: " + status + ". Response: " + data);
        });
    };

    // process response
    function processAccounts (data) {
        var accts = [];
        angular.forEach(data, function (acct, key) {
            if (acct.type == "credit" || acct.type == "depository") {
                var name = AcctFormat.name(acct.institution_type, acct.type, acct.subtype);
                var number = AcctFormat.number(acct.type, acct.meta.number);
                var balance = acct.balance.current;
                if (acct.type == "credit") balance *= -1;  // set negative balance for credit
                var icon = AcctFormat.icon(acct.type);
                var balanceStyle = AcctFormat.balanceStyle(acct.type);
                this.push({ name: name,
                    number: number,
                    balance: balance,
                    icon: icon,
                    balanceStyle: balanceStyle,
                });
            }
        }, accts);
        return accts;
    };

    // row click handler
    $scope.showTransactions = function (id) {
        $scope.selectedIndex = id;
        // do nothing for static account placeholders
        if (id == 0 || id == 1) {
            $scope.transactions = null;
            return;
        }
        var token = $scope.accts[id].token;
        callConnect(token);
    }

    var callConnect = function (token) {
        $http({
            url: "/transactions",
            method: "GET",
            params: { public_token:token }
        }).success(function (data, status, headers, config) {
            //console.log("Transactions: " + JSON.stringify(data.transactions));
            $scope.transactions = data.transactions;
        }).error(function (data, status, headers, config) {
            alert("There was a problem retrieving your account, status: " + status + ". Response: " + data);
        });
    };


    }]); // app.controller

})();
