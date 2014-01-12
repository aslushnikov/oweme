var orm = require("orm");
var Q = require("q");
var config = require("./appConfig.js");

var connect = Q.denodeify(orm.connect.bind(orm));

var Server = {};

connect(config.database)
.then(function(db) {
    Server.db = db;
})
.then(loadModels)
// ensuring DB has some dummy entries
.then(ensureDummyCurrencies)
.then(function(currencies) {
    Server.currencies = currencies;
})
.then(ensureDummyUsers)
.then(function(users) {
    Server.users = users;
})
.then(ensureDummyCards)
.then(function(cards) {
    Server.cards = cards;
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

function loadModels()
{
    var deferred = Q.defer();
    Server.db.load("./lib/models", function(err) {
        if (err) return deferred.reject(err);

        Server.db.sync(function(err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });
    });
    return deferred.promise;
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
        },
        {
            firstName: "Sedrak",
            lastName: "Kalashyan",
            email: "sedrak@kalashyan.com",
            registrationDate: new Date(),
            loginDate: new Date(),
        }
    ]);
}

function ensureDummyCards()
{
    console.log("ensuring dummy cards...");
    var rubleCurrency = null;
    for (var i = 0; i < Server.currencies.length; ++i) {
        if (Server.currencies[i].name === "ruble")
            rubleCurrency = Server.currencies[i];
    }
    if (!rubleCurrency) throw new Error("Did not find ruble currency");
    return ensureDummyData(Server.db.models.card, [
        {
            value: 300,
            comment: "Hookah",
            creationDate: new Date(),
            currency: rubleCurrency,
        },
    ]);
}

function ensureDummyLoans()
{
    return ensureDummyData(Server.db.models.loan, [
        {
            creationDate: new Date(),
            details: Server.cards[0],
            lender: Server.users[0],
            debtor: Server.users[1],
        },
    ]);
}
