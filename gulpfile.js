var gulp = require("gulp")
  , gutil = require("gulp-util")
  , orm = require("orm")
  , database = require("./lib/database")
  , Q = require("q")
  , config = require(process.env.OWEME_CONFIG || "./config.js")
  , dbTasks = require("./tasks/db-tasks")

gulp.task("db/reset", function() {
    return database.connect(config)
    .then(function(db) {
        return dbTasks.reset(db);
    })
    .then(function(db) {
        return Q.denodeify(db.close.bind(db))();
    })
});

gulp.task("db/drop", function() {
    var dropDatabase = require("./tasks/drop-database.js");
    return dropDatabase(config);
});

gulp.task("db/clear", function() {
    var clearDatabase = require("./tasks/clear-database.js");
    return clearDatabase(config);
});

gulp.task("db/fill", function() {
    var fill = require("./tasks/fill-database.js");
    return fill(config);
});

