'use strict';

var envvar = require('envvar');
var express = require('express');
var plaid = require('plaid');

var APP_PORT = envvar.number('APP_PORT');
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID');
var PLAID_SECRET = envvar.string('PLAID_SECRET');

var pc = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, plaid.environments.tartan);

var app = express();
app.use(express.static('public'));

app.get('/accounts', function(req, res, next) {
    var public_token = req.query.public_token;

    pc.exchangeToken(public_token, function(err, tokenResponse) {
        if (err) {
            res.json({error: 'Unable to exchange public_token'});
        }
        else {
            var access_token = tokenResponse.access_token;
            pc.getAuthUser(access_token, function(err, authResponse) {
                if (err) {
                    res.json({error: 'Unable to pull accounts from the Plaid API'});
                }
                else {
                    res.json({accounts: authResponse.accounts});
                }
            });
        }
    });
});

var server = app.listen(APP_PORT, function () {
    console.log('Server listening on port ' + String(APP_PORT));
});
