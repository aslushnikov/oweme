var Q = require("q")

module.exports = function(db, callback) {
    var Currency = db.define("currency", {
        name: String,
        symbol: String
    });
    var User = db.define("user", {
        firstName: String,
        lastName: String,
        email: String,
        registrationDate: Date,
        loginDate: Date,
    }, {
        autoFetch: true,
        autoFetchLimit: 2,
        methods: {
            fullName: function() {
                return this.firstName + " " + this.lastName;
            },

            loans: function(inactive) {
                var deferred = Q.defer();
                var Loan = db.models.loan;
                var options = {
                    lender_id: this.id,
                    active: !inactive
                };
                Loan.find(options, function(err, loans) {
                    if (err) return deferred.reject(err);
                    deferred.resolve(loans);
                });
                return deferred.promise;
            },

            debts: function(inactive) {
                var deferred = Q.defer();
                var Loan = db.models.loan;
                var options = {
                    debtor_id: this.id,
                    active: !inactive
                };
                Loan.find(options, function(err, debts) {
                    if (err) return deferred.reject(err);
                    deferred.resolve(debts);
                });
                return deferred.promise;
            },

            history: function() {
                var state = [];
                function concatter(e) { state = state.concat(e); }
                var promises = [
                    this.debts(true).then(concatter),
                    this.loans(true).then(concatter)
                ];
                return Q.all(promises).then(function() {
                    state.sort(function(a, b) {
                        return b.creationDate - a.creationDate;
                    });
                    return state;
                });
            },
        }
    });

    var Loan = db.define("loan", {
        value: Number,
        comment: String,
        active: Boolean,
        creationDate: Date,
    }, {
        autoFetch: true,
        methods: {
            resolve: function() {
                this.active = false;
                return Q.denodeify(this.save.bind(this))();
            }
        }
    });
    Loan.hasOne("currency", Currency);
    Loan.hasOne("lender", User);
    Loan.hasOne("debtor", User);
    return callback();
}
