var Q = require("q")
  , crypto = require("./crypto")

var Actions = function(db)
{
    this._db = db;
}

Actions.prototype = {
    fetchUserData: function(user)
    {
        var deferred = Q.defer();
        function setOpt(key, value)
        {
            options[key] = value;
        }
        var options = {};
        var promises = [
            user.loans().then(setOpt.bind(null, "loans")),
            user.debts().then(setOpt.bind(null, "debts")),
            user.history().then(setOpt.bind(null, "history")),
            user.notifications().then(setOpt.bind(null, "notifications")),
        ];
        Q.all(promises)
        .then(function() {
            deferred.resolve(options);
        })
        .fail(function(err) {
            deferred.reject(err);
        })
        return deferred.promise;
    },

    _createNotifiation: function(options)
    {
        var Notification = this._db.models.notification;
        return Q.denodeify(Notification.create.bind(Notification))([
            options
        ]).then(function (notifs) {
            if (notifs.length !== 1) throw new Error("Had to create 1 notification; got " + notifs.length + " instead");
            return notifs[0];
        })
    },

    resolveUserLoanWithId: function(user, loanId)
    {
        var deferred = Q.defer();
        var Loan = this._db.models.loan;
        var Notification = this._db.models.notification;
        return Q.denodeify(Loan.get.bind(Loan))(loanId)
        .then(function(loan) {
            if (!loan.lenderOrDebtor(user))
                new Error("Loan is not under users' control");
            return loan.resolve();
        })
        .then(function(loan) {
            return this._createNotifiation({
                from: user.email,
                to: loan.partner(user),
                creationDate: new Date(),
                text: "resolved debt"
            });
        })
    },

    createNewLoan: function(user, options)
    {
        var deferred = Q.defer();
        var lender, debtor;
        if (options.relation === "lend") {
            lender = user.email;
            debtor = options.email;
        } else if (options.relation === "owe") {
            lender = options.email;
            debtor = user.email;
        } else {
            return next(new Error("Wrong relation specified by client: only 'owe' or 'lend' should be used; " + options.relation + " received"));
        }
        var Loan = this._db.models.loan;
        return Q.denodeify(Loan.create.bind(Loan))([{
            value: parseFloat(options.value, 10),
            comment: options.comment,
            active: true,
            creationDate: new Date(),
            lender: lender,
            debtor: debtor,
            currency: this._db.models.currency.ruble,
        }]).then(function(loans) {
            if (loans.length !== 1) throw new Error("1 loan had to be created; got " + loans.length + " instead");
            return loans[0];
        });
    },

    createNewUser: function(options)
    {
        var User = this._db.models.user;
        return Q.denodeify(User.exists.bind(User))({email: options.email})
        .then(function(exists) {
            if (exists) throw new Error("User with this email already exists")
        })
        .then(crypto.encrypt.bind(crypto, options.password))
        .then(function(hash) {
            return Q.denodeify(User.create.bind(User))([{
                firstName: options.firstName,
                lastName: options.lastName,
                email: options.email,
                password: hash,
                registrationDate: new Date(),
                loginDate: new Date(),
            }])
        })
        .then(function(users) {
            if (users.length !== 1) throw new Error("Failed to create a single user - " + users.length + " created instead.")
            return users[0];
        })
    },

    editUser: function(user, options)
    {
        function innerEditUser(hash)
        {
            return Q.denodeify(user.save.bind(user))({
                firstName: options.firstName || user.firstName,
                lastName: options.lastName || user.lastName,
                email: options.email || user.email,
                password: options.password ? hash : user.password
            });
        }
        if (options.password) {
            return crypto.encrypt(options.password)
            .then(innerEditUser);
        } else {
            return innerEditUser("");
        }
    },
};

module.exports = Actions;
