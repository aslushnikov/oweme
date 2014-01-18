var gulp = require("gulp")
  , gutil = require("gulp-util")
  , orm = require("orm")
  , Q = require("q")
  , config = require(process.env.OWEME_CONFIG || "./config.js")

gulp.task("db/init", function() {
    var init = require("./tasks/init-database.js");
    return init(config);
});

gulp.task("db/fill", function() {
    var fill = require("./tasks/fill-database.js");
    return fill(config);
});

gulp.task("db/drop", function() {
    var dropDatabase = require("./tasks/drop-database.js");
    return dropDatabase(config);
});

gulp.task("db/clear", function() {
    var clearDatabase = require("./tasks/clear-database.js");
    return clearDatabase(config);
});

gulp.task("db/refill", ["db-drop"], function() {
    gulp.run("db-fill");
});
