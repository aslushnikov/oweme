module.exports = {
    database: {
        database : "oweme_test",
        protocol : "mysql",
        host     : "127.0.0.1",
        port     : 3306,         // optional, defaults to database default
        user     : "root",
        password : "testpass",
        query    : {
            pool     : false,   // optional, false by default
            debug    : false,   // optional, false by default
            strdates : false    // optional, false by default
        },
        instanceCache : false,
    },
    auth: {
        realm: "http://localhost:3000",
        cookieSessionSecret: "whatismysecret?!",
    },
    registration: {
        // if the user didn't fill in his password in an hour after
        // auto-registration, then it will be removed
        inactiveUserDropTimeout: 1000 * 60 * 60, // 1 hour
    }
};
