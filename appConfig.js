module.exports = {
    database: {
        database : "test",
        protocol : "mysql",
        host     : "127.0.0.1",
        port     : 3306,         // optional, defaults to database default
        user     : "root",
        password : "testpass",
        query    : {
            pool     : false,   // optional, false by default
            debug    : false,   // optional, false by default
            strdates : false    // optional, false by default
        }
    },
    auth: {
        realm: "http://localhost:3000",
    },
};
