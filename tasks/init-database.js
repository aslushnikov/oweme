var orm = require("orm")
  , Q = require("q")
  , database = require("../lib/database.js")

module.exports = function(config)
{
    return database.connect(config)
    .then(ensureDummyCurrencies)
    .then(function(db) {
        db.close();
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

function ensureDummyCurrencies(db)
{
    return ensureDummyData(db.models.currency, [
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
    ]).then(function() {
        return db;
    });
}

