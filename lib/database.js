var Q = require("q")
  , orm = require("orm")
  , config = require("./config.js")

var connect = Q.denodeify(orm.connect.bind(orm));

module.exports.connect = function() {
    return connect(config.database)
    .then(function(db) {
        var deferred = Q.defer();
        db.load("./models", function(err) {
            if (err) return deferred.reject(err);
            db.sync(function(err) {
                if (err) return deferred.reject(err);
                deferred.resolve(db);
            });
        });
        return deferred.promise;
    });
};
