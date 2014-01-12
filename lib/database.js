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
    })
    .then(function(db) {
        var deferred = Q.defer();
        db.models.currency.find({}, function(err, currencies) {
            if (err) return deferred.reject(err);
            for (var i = 0; i < currencies.length; ++i) {
                db.models.currency[currencies[i].name] = currencies[i];
            }
            deferred.resolve(db);
        });
        return deferred.promise;
    });
};
