var passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy
  , LocalStrategy = require('passport-local').Strategy
  , Q = require("q")
  , Actions = require("./actions")

module.exports = function(app, db, eventBus, config) {

    function onLogin(identifier, profile, done)
    {
        actions.findUsersWithEmail(profile.emails[0].value)
        .then(function(users) {
            if (users.length > 1) return done(new Error("multiple users with such email found"), null);
            if (users.length === 1) return done(null, users[0]);
            return actions.createNewUser({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
            }).then(function(user) {
                done(null, user);
            })
        })
        .fail(done);
    }

    app.use(passport.initialize());
    app.use(passport.session());

    var User = db.models.user;
    var actions = new Actions(db, eventBus, config);

    passport.serializeUser(function(user, done) {
        done(null, user.id + "");
    });

    passport.deserializeUser(function(id, done) {
        var get = Q.denodeify(User.get.bind(User));
        get(id)
        .then(function(user) {
            done(null, user);
        })
        .fail(function(err) {
            done(null, false);
        });
    });

    passport.use(new GoogleStrategy({
        returnURL: config.auth.realm + "/auth/google/return",
        realm: config.auth.realm
    }, onLogin));

    passport.use(new LocalStrategy({
        usernameField: 'email',
    }, function (email, password, done) {
        User.find({ email: email }, function (err, users) {
            if (err) return done(err);
            if (!users) return done(null, false);
            if (users.length > 1) return done(new Error("multiple users with such email found"), null);
            users[0].verifyPassword(password)
            .then(function(result) {
                if (result) return done(null, users[0]);
                done(null, false);
            })
            .fail(done.bind(null, null, false));
        });
    }));
    app.post('/login', passport.authenticate('local', {
        failureRedirect: '/login' }), function(req, res) {
        res.redirect('/');
    });

    // Redirect the user to Google for authentication.  When complete, Google
    // will redirect the user back to the application at
    //     /auth/google/return
    app.get('/auth/google', passport.authenticate('google'));

    // Google will redirect the user to this URL after authentication.  Finish
    // the process by verifying the assertion.  If valid, the user will be
    // logged in.  Otherwise, authentication has failed.
    app.get('/auth/google/return', passport.authenticate('google', {
        failureRedirect: '/login'
    }), function (req, res) {
        res.redirect(req.session.authRedirect || "/");
    });

}
