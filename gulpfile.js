var gulp = require("gulp")
  , gutil = require("gulp-util")
  , orm = require("orm")
  , Q = require("q")
  , config = require("./lib/config.js")

gulp.task("db/fill", function() {
    var fill = require("./tasks/fill-database.js");
    return fill();
});

gulp.task("db/drop", function() {
    var dropDatabase = require("./tasks/drop-database.js");
    return dropDatabase();
});

gulp.task("db/clear", function() {
    var clearDatabase = require("./tasks/clear-database.js");
    return clearDatabase();
});

gulp.task("db/refill", ["db-drop"], function() {
    gulp.run("db-fill");
});
