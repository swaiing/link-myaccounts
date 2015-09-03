'use strict';

var envvar = require('envvar');
var express = require('express');
var plaid = require('plaid');

var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID');
var PLAID_SECRET = envvar.string('PLAID_SECRET');

var pc = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, plaid.environments.tartan);
var app = express();

app.use(express.static('public'));
app.set('port', (process.env.PORT || 5000));

app.get('/accounts', function (req, res, next) {
    var publicToken = req.query.public_token;
    pc.exchangeToken(publicToken, function (err, tokenResponse) {
        if (err) return res.json({error: 'Unable to exchange public_token'});
        var accessToken = tokenResponse.access_token;
        pc.getAuthUser(accessToken, function(err, authResponse) {
            if (err) return res.json({error: 'Unable to pull accounts from the Plaid API'});
            return res.json({accounts: authResponse.accounts});
        });
    });
});

app.get('/transactions', function (req, res, next) {
    var publicToken = req.query.public_token;
    pc.exchangeToken(publicToken, function (err, tokenResponse) {
        if (err) return res.json({error: 'Unable to exchange public_token'});
        var accessToken = tokenResponse.access_token;
        pc.upgradeUser(accessToken, "connect", function(err, upgradeResponse) {
            if (err) return res.json({error: 'Unable to pull accounts from the Plaid API'});
            pc.getConnectUser(accessToken, { gte: '30 days ago', }, function(err, connectResponse) {
                if (err) return res.json({error: 'Unable to pull accounts from the Plaid API'});
                return res.json({accounts: connectResponse.accounts, transactions: connectResponse.transactions});
            });
        });
    });
});

var server = app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});
