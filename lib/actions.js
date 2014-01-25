var Q = require("q")
  , crypto = require("./crypto")

/**
 * It is safe to use multiple instances of this class
 * with single db and eventBus
 */
var Actions = function(db, eventBus, config)
{
    this._db = db;
    this._eventBus = eventBus;
    this._config = config;
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
            this._eventBus.emit("notification", notifs[0]);
            return notifs[0];
        }.bind(this))
    },

    resolveUserDebtWithId: function(user, debtId)
    {
        var deferred = Q.defer();
        var Debt = this._db.models.debt;
        var Notification = this._db.models.notification;
        return Q.denodeify(Debt.get.bind(Debt))(debtId)
        .then(function(debt) {
            if (!debt.lenderOrDebtor(user))
                new Error("Debt is not under users' control");
            return debt.resolve();
        })
        .then(function(debt) {
            return this._createNotifiation({
                from: user.email,
                to: debt.partner(user),
                creationDate: new Date(),
                text: "resolved debt"
            }).then(function(notif) {
                return debt;
            })
        }.bind(this))
    },

    createNewDebt: function(user, options)
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
        var Debt = this._db.models.debt;
        return Q.denodeify(Debt.create.bind(Debt))([{
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
        }).then(function(loan) {
            return this._createNotifiation({
                from: user.email,
                to: loan.partner(user),
                creationDate: new Date(),
                text: "New debt"
            }).then(function(notif){
                return loan;
            });
        }.bind(this));
    },

    _filterOutAndDeleteInactiveUsers: function(users)
    {
        var promises = [];
        var activeUsers = [];
        var timeNow = new Date();
        for (var i = 0; i < users.length; ++i) {
            var user = users[i];
            if (user.password) {
                activeUsers.push(user);
                continue;
            }
            // not enough time passed to remove this user
            if (timeNow - user.registrationDate < this._config.registration.inactiveUserDropTimeout) {
                activeUsers.push(user);
                continue;
            }

            var removalPromise = Q.denodeify(user.remove.bind(user))();
            promises.push(removalPromise);
        }
        return Q.all(promises)
        .then(function() {
            return activeUsers;
        });
    },

    // this method will also clean up outdated users with
    // this email
    findUsersWithEmail: function(email)
    {
        var User = this._db.models.user;
        return Q.denodeify(User.find.bind(User))({email: email})
        .then(this._filterOutAndDeleteInactiveUsers.bind(this))
    },

    getUserById: function(id)
    {
        var User = this._db.models.user;
        return Q.denodeify(User.get.bind(User))(id);
    },

    createNewUser: function(options)
    {
        var User = this._db.models.user;
        return Q.denodeify(User.find.bind(User))({email: options.email})
        .then(this._filterOutAndDeleteInactiveUsers.bind(this))
        .then(function(activeUsers) {
            if (!activeUsers.length) return;
            throw new Error("Found " + activeUsers.length + " user(s) with this email");
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
