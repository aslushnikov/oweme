/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , config = require('./appConfig.js')
  , Q = require("q")
  , orm = require("orm")

var app = express();

var connect = Q.denodeify(orm.connect.bind(orm));

connect(config.database)
.then(loadModels)
.then(setUpServer)

function loadModels(db)
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

function setUpServer(database)
{
    console.log("setting up server");
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
            maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
        },
    }));
    require("./lib/auth.js")(app, database, config);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
      app.use(express.errorHandler());
    }

    require("./lib/routes")(app, config, database);

    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
}
