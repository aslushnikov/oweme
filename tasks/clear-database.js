var orm = require("orm")
  , Q = require("q")
  , database = require("../lib/database.js")

module.exports = function()
{
    return database.connect()
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
        .then(function(modelName) {
            console.log("Model " + modelName + " successfully cleared.");
        }.bind(this, modelName))
        .fail(function(modelName, error) {
            console.error("Failed to clear model " + modelName);
            throw error;
        }.bind(this, modelName));
        clearPromises.push(promise);
    }
    Q.all(clearPromises)
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

