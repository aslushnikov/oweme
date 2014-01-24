/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , Q = require("q")
  , database = require("./lib/database")
  , config = require(process.env.OWEME_CONFIG || "./config.js")
  , Actions = require("./lib/actions")
  , EventEmitter = require("events").EventEmitter

database.connect(config)
.then(setUpServer)
.fail(function(err) {
    console.log(err);
});

function setUpServer(database)
{
    var eventBus = new EventEmitter();
    var app = express();
    var actions = new Actions(database, eventBus, config);
    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.compress());
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.cookieSession({
        secret: config.auth.cookieSessionSecret,
        cookie: {
            // 6 months period
            maxAge: 1000 * 60 * 60 * 24 * 30 * 6,
        },
    }));
    // setting up authentication middleware
    require("./lib/auth")(app, actions, config);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

    // setting up all routes
    require("./lib/routes")(app, actions, config);

    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
}
