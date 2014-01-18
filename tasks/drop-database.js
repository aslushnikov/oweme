var orm = require("orm")
  , Q = require("q")
  , database = require("../lib/database.js")

module.exports = function(config)
{
    return database.connect(config)
    .then(function(db) {
        return Q.denodeify(db.drop.bind(db))()
        .finally(db.close.bind(db));
    })
    .fail(function(err) {
        throw err;
    });
}

