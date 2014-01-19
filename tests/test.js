var Q = require("q") 
  , should = require("should")
  , database = require("../lib/database")
  , Actions = require("../lib/actions")
  , config = require("./testConfig")
  , dbTasks = require("../tasks/db-tasks")

var db = null;
var actions = null;
var testUser1 = {
    firstName: "Amigo",
    lastName: "Paradise",
    email: "amigo@paradise.com",
    password: "callmemaybe",
};
var testUser2 = {
    firstName: "Hablar",
    lastName: "Menceran",
    email: "hablar@menceran.com",
    password: "tasteslikepepsicola",
};

var testLoan = {
    relation: "owe",
    email: testUser2.email,
    value: 200,
    comment: "nightclub"
};

before(function (done) {
    // connect to db and initialize
    database.connect(config)
    .then(function(database) {
        db = database;
        actions = new Actions(db);
    })
    .then(function() {
        dbTasks.init(db);
    })
    .then(done)
    .fail(done)
});

after(function (done) {
    // drop database tables
    dbTasks.drop(db)
    .then(function(db) {
        return Q.denodeify(db.close.bind(db))();
    })
    .then(done)
    .fail(done)
});

describe("Actions", function() {
    afterEach(function(done) {
        dbTasks.reset(db)
        .then(function() {
            done();
        })
        .fail(done)
    })
    it("should create new user", function(done) {
        actions.createNewUser(testUser1)
        .then(function(user) {
            user.firstName.should.be.equal(testUser1.firstName);
            user.lastName.should.be.equal(testUser1.lastName);
            // do not store raw password
            user.password.should.not.be.equal(testUser1.password);
            return user.verifyPassword(testUser1.password, user.password);
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
        actions.createNewUser(testUser1)
        .then(function() {
            return actions.createNewUser({
                firstName: "Matvey",
                lastName: "Lushnikov",
                email: testUser1.email,
                password: "somepass"
            });
        }).then(function() {
            done(new Error("Two users successfully created"));
        }).fail(function(err) {
            done();
        })
    });

    it("should allow user edit without password change", function(done) {
        actions.createNewUser(testUser1)
        .then(function(user) {
            return actions.editUser(user, {
                firstName: "Matvey",
            });
        })
        .then(function(editedUser) {
            editedUser.firstName.should.be.equal("Matvey");
            done();
        })
        .fail(done);
    });

    it("should create new debt", function(done) {
        actions.createNewUser(testUser1)
        .then(function(user) {
            return actions.createNewLoan(user, testLoan);
        })
        .then(function(loan) {
            loan.value.should.be.equal(testLoan.value);
            loan.lender.should.be.equal(testLoan.email);
            loan.debtor.should.be.equal(testUser1.email);
            loan.active.should.be.true;
            done();
        })
        .fail(done);
    });

    it("should resolve user debt", function(done) {
        var user;
        actions.createNewUser(testUser1)
        .then(function(u) {
            user = u;
            return actions.createNewLoan(user, testLoan);
        })
        .then(function(loan) {
            return actions.resolveUserLoanWithId(user, loan.id)
        })
        .then(function(loan) {
            loan.active.should.be.false;
            done();
        })
        .fail(done);
    });

    it("should create notification for debts", function(done) {
        var loan;
        var user, user2;
        // create first user
        actions.createNewUser(testUser1)
        .then(function(u) {
            user = u;
            return actions.createNewLoan(user, testLoan);
        })
        // create debt
        .then(function(l) {
            loan = l;
            return actions.createNewUser(testUser2);
        })
        // create second user
        .then(function(u2) {
            user2 = u2;
            var Notification = db.models.notification;
            return Q.denodeify(Notification.find.bind(Notification))({})
        })
        // count notifications
        .then(function(notifs) {
            notifs.length.should.be.equal(1);
            var notif = notifs[0];
            notif.from.should.be.equal(testUser1.email);
            notif.to.should.be.equal(testUser2.email);
        })
        // resolve notifications as the second user
        .then(function() {
            return actions.resolveUserLoanWithId(user2, loan.id);
        })
        .then(function(loan) {
            var Notification = db.models.notification;
            return Q.denodeify(Notification.find.bind(Notification))({})
        })
        // count notifications
        .then(function(notifs) {
            notifs.length.should.be.equal(2);
            notifs.sort(function(a, b) {
                return a.creationDate - b.creationDate;
            });
            notifs[0].from.should.be.equal(testUser1.email);
            notifs[0].to.should.be.equal(testUser2.email);
            notifs[1].from.should.be.equal(testUser2.email);
            notifs[1].to.should.be.equal(testUser1.email);
            done();
        })
        .fail(done);
    });
});

