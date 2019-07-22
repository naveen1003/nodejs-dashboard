var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const envConstants = require('../utils/envConstants');
const constants = require('../utils/constants');

const dbURI = envConstants.MONGODB_URL;

// Users API
router.get('/', function (req, res, next) {
  getUsers(function (data) {
    res.send(data);
  });
});

function getUsers(callback) {
  var mydetails = {};
  MongoClient.connect(dbURI, function (err, db) {
    if (err)
      throw err;
    else {
      var dbo = db.db(constants.USERS_DB);
      dbo.collection(constants.USERS_COLLECTION).find({}).toArray(function (err, results) {
        mydetails.rows = [];
        results.forEach(row => {
          delete row._id
          mydetails.rows.push(row);
        });
        callback(mydetails.rows);
      })
    }
  });
}

module.exports = router;