var passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy,
    Q = require("q")

function onLogin(User, identifier, profile, done)
{
    User.find({email: profile.emails[0].value}, function(err, users) {
        if (err) return done(err, null);
        if (users.length > 1) return done(new Error("multiple users with such email found"), null);
        if (users.length === 1) return done(null, users[0]);
        createNewUser(User, profile, done);
    });
}

function createNewUser(User, profile, done)
{
    User.create([{
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        registrationDate: new Date(),
        loginDate: new Date(),
    }], function(err, users) {
        if (err) return done(err, null);
        done(null, users[0]);
    });
}

module.exports = function(app, db, config) {

    app.use(passport.initialize());
    app.use(passport.session());

    var User = db.models.user;

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
    }, onLogin.bind(this, User)));

    // Redirect the user to Google for authentication.  When complete, Google
    // will redirect the user back to the application at
    //     /auth/google/return
    app.get('/auth/google', passport.authenticate('google'));

    // Google will redirect the user to this URL after authentication.  Finish
    // the process by verifying the assertion.  If valid, the user will be
    // logged in.  Otherwise, authentication has failed.
    app.get('/auth/google/return',
      passport.authenticate('google', { successRedirect: '/',
                                        failureRedirect: '/login' }));

}