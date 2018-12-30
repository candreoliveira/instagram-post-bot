const q = require("q"),
      googleAPI = require("./googleSpreadAPI.js"),
      instagramAPI = require("./instagramAPI.js"),
      helpers = require("./helpers.js"),
      config = require("../config.js");

var postToInstagram = function(j, sheetName, count = 0) {
  const addToCaption = process.env.ADD_TO_CAPTION || config.ADD_TO_CAPTION,
        retry = process.env.RETRY || config.RETRY || 3,
        deferred = q.defer(),
        posts;
  let response;

  if (count > retry) {
    return deferred.reject("[ERROR] Retry error posting on instagram.");
  }

  // Get all posts from the spreadsheets
  try {
    posts = await googleAPI.getPostsFromTable(sheetName);
    console.log(`[INFO] Got ${count} posts from table.`);
  } catch (error) {
    console.log(`[ERROR] Error ${count} getting posts from table. Error: ${error}`);
    return postToInsta(j, sheetName, ++count);
  }

  // find one random post we can use will be null if none left
  var post = helpers.getPost(posts, 0);
  if (post) {
    try {
      response = await helpers.downloadPicture(post.URL, post.image_name);
      console.log(`[iNFO] Got ${count} pic ${response}.`);
    } catch (error) {
      console.log(`[ERROR] Error ${count} downloading pic. Error: ${error}`);
      return postToInsta(j, sheetName, ++count);
    }

    try {
      response = await helpers.sharpPicture(post.image_name);
      console.log(`[INFO] Got ${count} sharped pic ${response}.`);
    } catch (error) {
      console.log(`[ERROR] Error ${count} sharping pic. Error: ${error}`);
      return postToInsta(j, sheetName, ++count);
    }

    try {
      response = await instagramAPI(post, addToCaption);
      console.log(`[INFO] Posted ${count} on IG ${response}.`);
    } catch (error) {
      console.log(`[ERROR] Error ${count} posting on IG. Error: ${error}.`);
      return postToInsta(j, sheetName, ++count);
    }

    let updated = false;
    while(!updated) {
      try {
        response = await googleAPI.updatePostStatusOfRow(post.rowIndex, sheetName);
        console.log(`[INFO] Updated ${count} sheet ${response}.`);
        updated = true;
        break;
      } catch (error) {
        console.log(`[ERROR] Error ${count} updating sheet. Error: ${error}.`);
        setTimeout(() => {
          console.log(`[INFO] Sleeping to retry update sheet row ${post.rowIndex}.`);
        }, 1000);
      }
    }

    updated = false;
    while(!updated) {
      try {
        response = helpers.deletePicture(post.image_name);
        console.log(`[INFO] Deleted ${count} pic ${response}.`);
        updated = true;
        break;
      } catch (error) {
        console.log(`[ERROR] Error ${count} deleting pic. Error: ${error}.`);
        setTimeout(() => {
          console.log(`[INFO] Sleeping to retry delete photo ${post.image_name}.`);
        }, 1000);
      }
    }

    console.log("Post successfully posted. Next post will be done at: " + j.nextInvocation());
    deferred.resolve(j.nextInvocation());
  } else {
    // no more posts
  }
  return deferred.promise;
};

module.exports = postToInstagram;
