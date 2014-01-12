/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , config = require('./lib/config.js')
  , Q = require("q")
  , database = require("./lib/database.js")

database.connect()
.then(setUpServer.bind(this, config))

function loadDatabaseModels(db)
{
    var deferred = Q.defer();
    db.load("./lib/models", function(err) {
        if (err) return deferred.reject(err);
        db.sync(function(err) {
            if (err) return deferred.reject(err);
            deferred.resolve(db);
        });
    });
    return deferred.promise;
}

function setUpServer(config, database)
{
    var app = express();
    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.cookieSession({
        secret: "whatisyoursecret?!",
        cookie: {
            // 6 months period
            maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
        },
    }));
    // setting up authentication middleware
    require("./lib/auth")(app, database, config);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

    // setting up all routes
    require("./lib/routes")(app, config, database);

    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
}
