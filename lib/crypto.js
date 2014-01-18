var Q = require("q")
  , bcrypt = require("bcrypt")

module.exports.encrypt = function(password) {
    var deferred = Q.defer();
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return deferred.reject(err);
        bcrypt.hash(password, salt, function(err, hash) {
            if (err) return deferred.reject(err);
            deferred.resolve(hash);
        });
    });
    return deferred.promise;
}

module.exports.compare = function(rawPassword, hash) {
    var deferred = Q.defer();
    bcrypt.compare(rawPassword, hash, function(err, result) {
        if (err) return deferred.reject(err);
        deferred.resolve(result);
    });
    return deferred.promise;
};
