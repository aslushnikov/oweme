var Q = require("q") 
  , should = require("should")
  , database = require("../lib/database")
  , Actions = require("../lib/actions")
  , config = require("./testConfig")
  , initDatabase = require("../tasks/init-database")
  , dropDatabase = require("../tasks/drop-database")
  , clearDatabase = require("../tasks/clear-database")

var db = null;
var actions = null;
var testUser = {
    firstName: "Amigo",
    lastName: "Paradise",
    email: "amigo@paradise.com",
    password: "callmemaybe",
};

before(function (done) {
    // connect to db and initialize
    database.connect(config)
    .then(function(database) {
        db = database;
        actions = new Actions(db);
    })
    .then(initDatabase.bind(null, config))
    .then(done)
    .fail(done)
});

after(function (done) {
    // drop database tables
    Q.denodeify(db.close.bind(db))()
    .then(dropDatabase.bind(null, config))
    .then(done)
    .fail(done)
});

describe("Action", function() {
    beforeEach(function(done) {
        clearDatabase(config)
        .then(function() {
            return initDatabase(config);
        })
        .then(function() {
            done();
        })
        .fail(done)
    })
    it("should create new user", function(done) {
        actions.createNewUser(testUser)
        .then(function(user) {
            user.firstName.should.be.equal(testUser.firstName);
            user.lastName.should.be.equal(testUser.lastName);
            // do not store raw password
            user.password.should.not.be.equal(testUser.password);
            return user.verifyPassword(testUser.password, user.password);
        })
        .then(function(isEqual) {
            isEqual.should.be.true;
        })
        .then(done)
        .fail(done)
    });

    it("should support UTF8 encoding", function(done) {
        actions.createNewUser({
            firstName: "Котенок",
            lastName: "Гав",
            email: "kotgav@gmail.com",
            password: "paradise"
        })
        .then(function() {
            var deferred = Q.defer();
            db.models.user.find({
                email: "kotgav@gmail.com"
            }, function(err, users) {
                if (err) return deferred.reject(err);
                if (users.length !== 1) return deferred.reject(new Error("Single user should be returned; got " + users.length + " instead"));
                var user = users[0];
                user.firstName.should.be.equal("Котенок");
                user.lastName.should.be.equal("Гав");
                deferred.resolve();
            })
        })
        .then(done)
        .fail(done)
    });

    it("should not create two users with identical email", function(done) {
        actions.createNewUser(testUser)
        .then(function() {
            return actions.createNewUser({
                firstName: "Matvey",
                lastName: "Lushnikov",
                email: testUser.email,
                password: "somepass"
            });
        }).then(function() {
            done(new Error("Two users successfully created"));
        }).fail(function(err) {
            done();
        })
    });

    it("should allow user edit with password change", function(done) {
        actions.createNewUser(testUser)
        .then(function(user) {
            return actions.editUser(user, {
                firstName: "Matvey",
                password: "bitch"
            });
        })
        .then(function(editedUser) {
            editedUser.firstName.should.be.equal("Matvey");
            done();
        })
        .fail(done);
    });
});

