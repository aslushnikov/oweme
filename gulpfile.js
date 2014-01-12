var gulp = require("gulp")
  , gutil = require("gulp-util")
  , orm = require("orm")
  , Q = require("q")
  , config = require("./lib/config.js")

gulp.task("dummy-database", function() {
    var dummyEntries = require("./tasks/dummy-database.js");
    return dummyEntries();
});

gulp.task("clear-database", function() {
    var clearDatabase = require("./tasks/clear-database.js");
    return clearDatabase();
});

gulp.task("reset-database", ["clear-database"], function() {
    gulp.run("dummy-database");
});
