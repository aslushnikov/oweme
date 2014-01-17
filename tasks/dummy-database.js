var orm = require("orm");
var Q = require("q");
var database = require("../lib/database.js")

var Server = {};

module.exports = function()
{
    return database.connect()
    .then(function(db) {
        Server.db = db;
    })
    // ensuring DB has some dummy entries
    .then(ensureDummyCurrencies)
    .then(function(currencies) {
        Server.currencies = currencies;
    })
    .then(ensureDummyUsers)
    .then(function(users) {
        Server.users = users;
    })
    .then(ensureDummyLoans)
    .then(function() {
        Server.db.close(function(err) {
            if (err) throw err;
            console.log("Dummies created!");
        });
    })
    .fail(function(err) {
        throw err;
    });
}

function ensureDummyData(model, defaultValue)
{
    var deferred = Q.defer();
    model.find(function(err, models) {
        if (err) return deferred.reject(err);
        if (models.length > 0) return deferred.resolve(models);
        model.create(defaultValue,function (err, models) {
            if (err) return deferred.reject(err);
            deferred.resolve(models);
        });
    });
    return deferred.promise;
}

function ensureDummyCurrencies()
{
    console.log("ensuring dummy currencies...");
    return ensureDummyData(Server.db.models.currency, [
        {
            name: "none",
            symbol: "-",
        },
        {
            name: "dollar",
            symbol: "$",
        },
        {
            name: "ruble",
            symbol: "RUB",
        },
        {
            name: "euro",
            symbol: "€",
        }
    ]);
}

function ensureDummyUsers()
{
    console.log("ensuring dummy users...");
    return ensureDummyData(Server.db.models.user, [
        {
            firstName: "Andrey",
            lastName: "Lushnikov",
            email: "aslushnikov@gmail.com",
            registrationDate: new Date(),
            loginDate: new Date(),
            password: "T3sttest!",
        },
        {
            firstName: "Sedrak",
            lastName: "Kalashyan",
            email: "sedrak@kalashyan.com",
            registrationDate: new Date(),
            loginDate: new Date(),
            password: "T3sttest!",
        }
    ]);
}

function ensureDummyLoans()
{
    var rubleCurrency = null;
    for (var i = 0; i < Server.currencies.length; ++i) {
        if (Server.currencies[i].name === "ruble")
            rubleCurrency = Server.currencies[i];
    }
    if (!rubleCurrency) throw new Error("Did not find ruble currency");
    return ensureDummyData(Server.db.models.loan, [
        {
            value: 300,
            comment: "Hookah",
            currency: rubleCurrency,
            creationDate: new Date(),
            active: true,
            lender: Server.users[0].email,
            debtor: Server.users[1].email,
        },
    ]);
}
