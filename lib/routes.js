var Q = require("q")

module.exports = function(app, db) {

    app.get("/login", function(req, res) {
        res.render("login");
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
            if (loan.lender !== req.user.email && loan.debtor !== req.user.email)
                throw new Error("Loan is not under users' control");
            return loan.resolve();
        })
        .then(function() {
            res.redirect("/");
        })
        .fail(next)
    });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/login");
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
}

function ensureLogin(req, res, next)
{
    if (!req.user)
        res.redirect("/login");
    else next();
}

function setOption(options, key, value)
{
    options[key] = value;
}

