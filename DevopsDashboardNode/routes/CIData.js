var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;

const envConstants = require('../utils/envConstants');
const dbURI = envConstants.MONGODB_URL;

router.get('/', function (req, res, next) {
  getCidata(function (data) {
    res.status(200).send({status: 200, message: "Success", response: data})
  });
});

function getCidata(callback) {
  var mydetails = {};
  MongoClient.connect(dbURI, function (err, db) {
    if (err)
      throw err;
    else {
      var dbo = db.db("cidata");
      var results = dbo.collection("cidatacollection").find({});
      mydetails.rows = [];
      results.forEach(row => {
        mydetails.rows.push({
          data: row.data

        });
        callback(mydetails.rows[0].data[0].appDetails[0].appDescription);;
      });
    }
  });
}

module.exports = router;