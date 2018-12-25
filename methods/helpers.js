var http = require("https");
var fs = require("fs");
var q = require("q");
var download = require("download-file");
var sharp = require("sharp");
var sizeOf = require("image-size");

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
    fs.unlink(img_dir + file, err => {
      if (err) console.log(err);
      console.log(file + " was deleted");
    });
  },

  sharpPicture: function(file, output) {
    var deferred = q.defer();
    var img = img_dir + file;
    var dimensions = sizeOf(img);
    var ratio = dimensions.width / dimensions.height;
    var allowedRatio = {
      landscape: 1.91,
      square: 1,
      portrait: 0.8
    };

    var w = dimensions.width;
    var h = dimensions.height;

    if (
      ratio <=
      allowedRatio.portrait + (allowedRatio.square - allowedRatio.portrait) / 2
    ) {
      // Transform to portrait

      if (dimensions.height >= 1080) {
        h = 1080;
      }

      w = h * allowedRatio.portrait;
    } else if (
      ratio >=
      allowedRatio.square + (allowedRatio.landscape - allowedRatio.square) / 2
    ) {
      // Transform to landscape

      if (dimensions.width >= 1080) {
        w = 1080;
      }

      h = w / allowedRatio.landscape;
    } else {
      // Transform to square
      if (dimensions.width >= 1080) {
        w = 1080;
      }

      h = w;
    }

    console.log("Sharping default ratio: ", ratio);
    console.log("Sharping to: ", w, "x", h);

    sharp(img_dir + file)
      .resize(parseInt(w), parseInt(h))
      .toFile(img_dir + output, function(error, info) {
        if (error) {
          return deferred.reject(error);
          console.log("ERROR Sharping", error);
        }

        console.log("Sharp output generated.");
        return deferred.resolve(img_dir + output);
      });

    return deferred.promise;
  }
};

module.exports = helpers;
