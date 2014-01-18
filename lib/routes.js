var Q = require("q")

module.exports = function(app, db) {

    app.get("/login", function(req, res) {
        res.render("login");
    });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/login");
    });

    app.get("/", ensureLogin, function(req, res, next) {
        var options = {
            user: req.user
        };
        var setOpt = setOption.bind(null, options);
        var promises = [
            req.user.loans().then(setOpt.bind(null, "userLoans")),
            req.user.debts().then(setOpt.bind(null, "userDebts")),
            req.user.history().then(setOpt.bind(null, "userHistory")),
            req.user.notifications().then(setOpt.bind(null, "userNotifications")),
        ];
        Q.all(promises).then(function() {
            res.render("index", options);
        })
        .fail(next);
    });

    app.get("/loan/resolve/:id", ensureLogin, function(req, res, next) {
        var Loan = db.models.loan;
        Q.denodeify(Loan.get.bind(Loan))(req.params.id)
        .then(function(loan) {
            if (!loan.lenderOrDebtor(req.user))
                throw new Error("Loan is not under users' control");
            return loan.resolve();
        })
        .then(function(loan) {
            db.models.notification.create([{
                from: req.user.email,
                to: loan.partner(req.user),
                creationDate: new Date(),
                text: "Resolved debt",
            }], function(err, notif) {
                if (err) return next(err);
                res.redirect("/");
            });
        })
        .fail(next)
    });

    app.post("/loan/new", ensureLogin, function(req, res, next) {
        var relation = req.body.relation;
        var lender, debtor;
        if (relation === "lend") {
            lender = req.user.email;
            debtor = req.body.email;
        } else if (relation === "owe") {
            lender = req.body.email;
            debtor = req.user.email;
        } else {
            return next(new Error("Wrong relation specified by client: only 'owe' or 'lend' should be used; " + relation + " received"));
        }
        db.models.loan.create([{
            value: parseFloat(req.body.value, 10),
            comment: req.body.comment,
            active: true,
            creationDate: new Date(),
            lender: lender,
            debtor: debtor,
            currency: db.models.currency.ruble,
        }], function(err, loan) {
            if (err) return next(err);
            res.redirect("/");
        });
    });

    app.get("/user/new", function(req, res) {
        res.render("user", {
            method: req.url,
            email: "",
            firstName: "",
            lastName: "",
        });
    });
    app.post("/user/new", function(req, res, next) {
        db.models.user.exists({email: req.body.email}, function(err, exists) {
            if (err) return next(err);
            if (exists) return next(new Error("User with this email already exists"));
            createUser();
        });
        function createUser() {
            db.models.user.create([{
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                registrationDate: new Date(),
                loginDate: new Date(),
            }], function(err, users) {
                if (err) return next(err);
                if (users.length !== 1) return next(new Error("Failed to create a single user - " + users.length + " created instead."));
                res.render("registrationSuccess");
            });
        }
    });

    app.get("/user/edit", ensureLogin, function(req, res) {
        res.render("user", {
            method: req.url,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            password: req.user.password,
        });
    });
    app.post("/user/edit", ensureLogin, function(req, res, next) {
        req.user.save({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
        }, function(err) {
            if (err) return next(err);
            res.redirect("/");
        });
    });
}

function ensureLogin(req, res, next)
{
    if (!req.user) {
        req.session.authRedirect = req.url;
        res.redirect("/login");
    } else if (req.user && !req.user.password && req.url !== "/user/edit") {
        req.session.authRedirect = req.url;
        res.redirect("/user/edit");
    } else {
        delete req.session.authRedirect;
        next();
    }
}

function setOption(options, key, value)
{
    options[key] = value;
}

