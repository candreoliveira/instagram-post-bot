var http = require("https");
var fs = require("fs");
var q = require("q");
var download = require("download-file");

var path = require("path");
var img_dir = path.join(path.dirname(require.main.filename), "images/");

var helpers = {
  getPost: function(posts, count) {
    var item = posts[Math.floor(Math.random() * posts.length)];

    if (item.Use === "TRUE" && item.Used === "FALSE") {
      return item;
    } else if (count === posts.length) {
      console.log("WARNING: All posts posted!");
      return null;
    } else {
      count++;
      getPost(posts, count);
    }
  },

  downloadPicture: function(url, path) {
    // fetch picture
    var deferred = q.defer();
    // make sure folder exists
    if (!fs.existsSync(img_dir)) fs.mkdirSync(img_dir);

    var options = {
      directory: img_dir,
      filename: path
    };

    download(url, options, function(err) {
      if (err) {
        console.log(err);
        deferred.reject(err);
      }

      deferred.resolve();
    });
    return deferred.promise;
  },

  deletePicture: function(file) {
    fs.unlink(img_dir + file);
  }
};

module.exports = helpers;
