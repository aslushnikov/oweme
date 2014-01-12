module.exports = function(db, callback) {
    var Currency = db.define("currency", {
        name: String,
        symbol: String
    });
    var User = db.define("user", {
        firstName: String,
        lastName: String,
        email: String,
        registrationDate: Date,
        loginDate: Date,
    });
    var Card = db.define("card", {
        value: Number,
        comment: String,
        creationDate: Date,
    });
    Card.hasOne("currency", Currency);

    var Loan = db.define("loan", {
        creationDate: Date,
    });
    Loan.hasOne("details", Card);
    Loan.hasOne("lender", User, {reverse: "loans"});
    Loan.hasOne("debtor", User, {reverse: "debts"});
    console.log("models defined");
    return callback();
}
