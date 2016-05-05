"use strict";

var express = require("express");
var mongoClient = require("mongodb").MongoClient;
var assert = require("assert");
var https = require('https');
var querystring = require("querystring");
require("dotenv").load();

var mongoUrl = process.env.MONGO_URI;
var port = process.env.PORT || 8080;
var db = null;
var collection = null;
var context = process.env.APP_CX;
var key = process.env.APP_KEY;
var app = express();

mongoClient.connect(mongoUrl, function (err, database) {
  assert.equal(null, err);
  db = database;
  collection = db.collection("queries");
  app.listen(port,  function () {
    console.log("Node.js listening on port " + port + "...");
  });
});

app.get("/api/imagesearch/:query", function (req, res) {
  // console.log(req.params);
  // console.log(req.query);

  var date = new Date();
  console.log("date: " + date.toISOString());

  var query = req.params.query;
  var offset = 0;
  if (req.query["offset"]) {
    offset = req.query["offset"];
    if (offset.match(/^\d+$/g) == null) {
      offset = 0;
    }
  }
  var start = parseInt(offset) + 1;

  collection.insertOne({ "_id": date.toISOString(), "query": query }, function (err, insertResult) {
    if (err) {
      console.log("Error: " + err);
    } else {
      console.log("Insert result: " + insertResult);
    }

    var options = {
      host: "www.googleapis.com",
      path: "/customsearch/v1?key=" + key + "&cx=" + context + "&q=" + querystring.escape(query) + "&searchType=image&fileType=jpg&imgSize=large&alt=json&num=10&start=" + start
    };

    https.request(options, function (response) {
      var data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function() {
        res.set("Content-Type", "application/json");
        var parsedData = JSON.parse(data);
        if (parsedData["items"]) {
          var result = [];
          for (var i = 0; i < parsedData["items"].length; i++) {
            var item = {
              "url": parsedData["items"][i].link,
              "snippet": parsedData["items"][i].snippet,
              "thumbnail": parsedData["items"][i].image.thumbnailLink,
              "context": parsedData["items"][i].image.contextLink
            };
            result.push(item);
          }
          res.send(JSON.stringify(result));
        } else {
          res.send(JSON.stringify(parsedData));
        }
      });
    }).end();
  });
});

app.get("/api/latest/imagesearch", function (req, res) {
  console.log("Request latest");
  collection.find({}).sort({ $natural : -1 }).limit(10).toArray(function (err, result) {
    res.set("Content-Type", "application/json");
    if (err) {
      console.log("Error: " + err);
      res.send(JSON.stringify({ "error": err.errmsg}));
    } else {
      console.log(result);
      var returnResult = [];
      for (var i = 0; i < result.length; i++) {
        var item = {
          "term": result[i].query,
          "when": result[i]._id
        };
        returnResult.push(item);
      }
      res.send(JSON.stringify(returnResult));
    }
  });
});