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
      console.log("[WARNING] All posts posted!");
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
        console.log(`[ERROR] Download error ${err}.`);
        deferred.reject(err);
      }

      deferred.resolve(url);
    });

    return deferred.promise;
  },

  deletePicture: function(file) {
    return fs.unlinkSync(img_dir + file);
  },

  sharpPicture: function(file, output) {
    var maxSize = 800;
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

      if (dimensions.height >= maxSize) {
        h = maxSize;
      }

      w = h * allowedRatio.portrait;
    } else if (
      ratio >=
      allowedRatio.square + (allowedRatio.landscape - allowedRatio.square) / 2
    ) {
      // Transform to landscape

      if (dimensions.width >= maxSize) {
        w = maxSize;
      }

      h = w / allowedRatio.landscape;
    } else {
      // Transform to square
      if (dimensions.width >= maxSize) {
        w = maxSize;
      }

      h = w;
    }

    console.log("[INFO] Sharping default ratio: ", ratio);
    console.log("[INFO] Sharping to: ", w, "x", h);

    sharp(img_dir + file)
      .resize(parseInt(w), parseInt(h))
      .toFile(img_dir + output, function(error, info) {
        if (error) {
          return deferred.reject(error);
          console.log(`[ERROR] Sharping error ${error}.`);
        }

        console.log("[INFO] Sharp output generated.");
        return deferred.resolve(img_dir + output);
      });

    return deferred.promise;
  }
};

module.exports = helpers;
