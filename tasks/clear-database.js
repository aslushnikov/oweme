var orm = require("orm")
  , Q = require("q")
  , database = require("../lib/database.js")

module.exports = function(config)
{
    return database.connect(config)
    // ensuring DB has some dummy entries
    .then(clearModels)
    .fail(function(err) {
        throw err;
    });
}

function clearModels(db)
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
    Q.all(clearPromises)
    .fail(function(error) {
        console.error("Failed to clear database");
        throw error;
    })
    .finally(function() {
        db.close();
    });
}

