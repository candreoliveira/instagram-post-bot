var googleAPI = require("./googleSpreadAPI.js");
var instagramAPI = require("./instagramAPI.js");
var helpers = require("./helpers.js");
var q = require("q");

var config = require("../config.js");

module.exports = function(j, sheetName) {
  var deferred = q.defer();

  var addToCaption = config.ADD_TO_CAPTION;

  // Get all posts from the spreadsheets
  googleAPI.getPostsFromTable(sheetName).then(function(posts) {
    // find one random post we can use will be null if none left
    var post = helpers.getPost(posts, 0);

    if (post) {
      console.log("POST: ", post);

      // download picture file from url
      helpers
        .downloadPicture(post.URL, post.image_name)
        .then(
          function() {
            console.log("Got picture.");
            // post image to instagram
            instagramAPI(post, addToCaption)
              .then(
                function(res) {
                  console.log("Instagram success.");
                  // update posted status in spreadsheet to true
                  googleAPI
                    .updatePostStatusOfRow(post.rowIndex, sheetName)
                    .then(function() {
                      helpers.deletePicture(post.image_name);

                      console.log(
                        "Post successfully posted. Next post will be done at: " +
                          j.nextInvocation()
                      );
                      deferred.resolve(j.nextInvocation());
                    });
                },
                function(e) {
                  console.log("ERROR1: Posting on instagram: " + e.message);
                  deferred.reject(e);
                }
              )
              .catch(function(e) {
                console.log("ERROR2: Posting on instagram: " + e.message);
                deferred.reject(e);
              });
          },
          function(e) {
            console.log("ERROR1 downloading", e);
            deferred.reject(e);
          }
        )
        .catch(function(e) {
          console.log("ERROR2 downloading", e);
          deferred.reject(e);
        });
    } else {
      console.log("WARNING: no more posts in spreadsheet");
      deferred.reject("WARNING: no more posts in spreadsheet");
    }
  });

  return deferred.promise;
};
