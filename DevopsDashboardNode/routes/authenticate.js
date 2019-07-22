var express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const envConstants = require('../utils/envConstants');
const constants = require('../utils/constants');
const dbURI = envConstants.MONGODB_URL;

module.exports = router;

// Authenticate API
router.post('/', function (req, res, next) {

    // Connect to Mongo Database
    MongoClient.connect(dbURI, function (err, client) {

        if (err) {
            console.error("Authenticate - Error Conneting to Database Users: ", err);
            res.status(500).send({status: 500, message: "Database Unavailable!", response: {}})
        } else {

            // Fetch User Record
            const db = client.db(constants.USERS_DB);
            db.collection(constants.USERS_COLLECTION)
            .find({"username": req.body.username, "password": req.body.password})
            .toArray(function (err, results) {
                if(err) {
                    console.error("Authenticate - Error fetching user record: ", err);
                    client.close();
                    res.status(200).send({status: 401, message: "Unauthorized!", response: {}})
                } else {
                    client.close();
                    if(results && results.length > 0) {

                        // Create a JWT token using private key file
                        const privateKey = fs.readFileSync('./certificates/private.pem');
                        var token = jwt.sign({
                            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
                            username: req.body.username,
                            iat: Math.floor(Date.now() / 1000) + (24 * 60 * 60)},
                            privateKey, { algorithm: 'RS256'});
                        res.status(200).send({status: 200, message: "Success", response: {token}})
                    } else {
                        res.status(200).send({status: 401, message: "Unauthorized!", response: {}})
                    }
                }
            })
        }
    });
});