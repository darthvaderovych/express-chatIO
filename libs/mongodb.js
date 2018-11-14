const MongoClient = require('mongodb').MongoClient;
const config = require('config');
const mongoUrl = config.mongodb.url;

let connection = null;

exports.get = () => {
    if (!connection) {
        throw new Error ('Connect db first');
    };
    return connection;
};

exports.connect = () => {
    
    return MongoClient.connect(mongoUrl, {useNewUrlParser: true})
        .then(db => {
            connection = db;
        }).catch(err => {throw new Error(err)});
};
