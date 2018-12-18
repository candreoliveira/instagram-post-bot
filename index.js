var express = require("express");
var app = express();
var http = require("http");
var schedule = require("node-schedule");

var postToInstagram = require("./methods/postToInstagram.js");
var config = require("./config.js");
var j; // ????

app.set("port", process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));

app.get("/", function(request, response) {
  response.sendFile("index.html");
});

app.get("/api/post-now", function(request, response) {
  postToInstagram(j, config.SHEET_NAME).then(function(res) {
    response.send(res);
  });
});

app.get("/api/next-post", function(request, response) {
  response.send(j.nextInvocation());
});

app.listen(app.get("port"), function() {
  console.log("Node app is running on port", app.get("port"));

  var postInterval = process.env.POST_INTERVAL || config.POST_INTERVAL;

  j = schedule.scheduleJob(postInterval, function() {
    postToInstagram(j, config.SHEET_NAME);
  });

  console.log("First post will be done at: " + j.nextInvocation());

  setInterval(function() {
    console.log("Keep Alive!");
    http.get(config.HEROKU_URL);
  }, 3600000); // every hour
});
