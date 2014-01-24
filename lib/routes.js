var Q = require("q")

module.exports = function(app, actions, config) {

    app.get("/login", function(req, res) {
        res.render("login");
    });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/login");
    });

    app.get("/", ensureLogin, function(req, res, next) {
        actions.fetchUserData(req.user)
        .then(function(data) {
            data.user = req.user;
            res.render("index", data);
        })
        .fail(next);
    });

    app.get("/loan/resolve/:id", ensureLogin, function(req, res, next) {
        actions.resolveUserLoanWithId(req.user, req.params.id)
        .then(function(notification) {
            res.redirect("/");
        })
        .fail(next);
    });

    app.post("/loan/new", ensureLogin, function(req, res, next) {
        actions.createNewLoan(req.user, req.body)
        .then(function() {
            res.redirect("/");
        })
        .fail(next)
    });

    app.get("/user/new", function(req, res) {
        res.render("user", {
            method: req.url,
        });
    });

    app.post("/user/new", function(req, res, next) {
        actions.createNewUser(req.body)
        .then(function() {
            res.render("registrationSuccess");
        })
        .fail(next)
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
        actions.editUser(req.user, req.body)
        .then(function() {
            res.redirect("/");
        })
        .fail(next)
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

