var express = require("express");
var app = express();
var http = require("http");
var schedule = require("node-schedule");
require("dotenv").config();

var postToInstagram = require("./methods/postToInstagram.js");
var config = require("./config.js");
var sheetName = process.env.SHEET_NAME || config.SHEET_NAME;
var j; // ????

app.set("port", process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));

app.get("/", function(request, response) {
  response.sendFile("index.html");
});

app.get("/api/post-now", function(request, response) {
  postToInstagram(j, sheetName).then(function(res) {
    response.send(res);
  });
});

app.get("/api/next-post", function(request, response) {
  response.send(j.nextInvocation());
});

app.listen(app.get("port"), function() {
  console.log("Node app is running on port", app.get("port"));

  var url = process.env.HEROKU_URL || config.HEROKU_URL;
  var postInterval = process.env.POST_INTERVAL || config.POST_INTERVAL;
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  today =
    mm +
    "/" +
    dd +
    "/" +
    yyyy +
    " @ " +
    today.getHours() +
    ":" +
    today.getMinutes() +
    ":" +
    today.getSeconds();

  j = schedule.scheduleJob(postInterval, function() {
    postToInstagram(j, sheetName);
  });

  console.log("Current datetime is: " + today);
  console.log("First post will be done at: " + j.nextInvocation());

  setInterval(function() {
    console.log("Keep Alive!");

    http.get(url);
  }, 300000); // every 5 min
});
