var Q = require("q")

module.exports.clear = function(db)
{
    var clearPromises = [];
    for (var modelName in db.models) {
        var model = db.models[modelName];
        var clear = Q.denodeify(model.clear.bind(model));
        var promise = clear()
        .fail(function(modelName, error) {
            console.error("Failed to clear model " + modelName);
            throw error;
        }.bind(this, modelName));
        clearPromises.push(promise);
    }
    return Q.all(clearPromises)
    .then(function() {
        return db;
    })
    .fail(function(error) {
        console.error("Failed to clear database");
        throw error;
    })
}

module.exports.drop = function(db)
{
    return Q.denodeify(db.drop.bind(db))()
    .then(function() {
        return db;
    })
}

module.exports.init = function(db)
{
    return ensureData(db.models.currency, Currencies);
}

module.exports.reset = function(db)
{
    return module.exports.clear(db)
    .then(module.exports.init)
    .then(function() {
        return db;
    });
}

function ensureData(model, defaultValue)
{
    var find = Q.denodeify(model.find.bind(model));
    var create = Q.denodeify(model.create.bind(model, defaultValue));
    var clear = Q.denodeify(model.clear.bind(model));
    return find().then(function(models) {
        if (models.length !== defaultValue.length)
            return clear().then(create);
    })
}

var Currencies = [
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
];
