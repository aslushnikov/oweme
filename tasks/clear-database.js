var orm = require("orm")
  , Q = require("q")
  , database = require("../lib/database.js")

module.exports = function()
{
    return database.connect()
    // ensuring DB has some dummy entries
    .then(dropModels)
    .fail(function(err) {
        throw err;
    });
}

function dropModels(db)
{
    var removePromises = [];
    for (var modelName in db.models) {
        var model = db.models[modelName];
        var drop = Q.denodeify(model.drop.bind(model));
        var promise = drop()
        .then(function(modelName) {
            console.log("Model " + modelName + " successfully removed.");
        }.bind(this, modelName))
        .fail(function(modelName, error) {
            console.error("Failed to remove model " + modelName);
            throw error;
        }.bind(this, modelName));
        removePromises.push(promise);
    }
    Q.all(removePromises)
    .then(function() {
        console.log("Database cleared.");
    })
    .fail(function(error) {
        console.error("Failed to clear database");
        throw error;
    })
    .finally(function() {
        db.close();
    });
}

