module.exports = function(app, config, db) {

    function ensureLogin(req, res, next)
    {
        if (!req.user)
            res.redirect("/login");
        else next();
    }

    app.get("/login", function(req, res) {
        res.render("login");
    });

    app.get("/", ensureLogin, function(req, res) {
        res.render("index", {
            user: req.user
        });
    });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/login");
    });
}
