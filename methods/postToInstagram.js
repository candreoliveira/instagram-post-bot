const q = require("q"),
  googleAPI = require("./googleSpreadAPI.js"),
  instagramAPI = require("./instagramAPI.js"),
  helpers = require("./helpers.js"),
  config = require("../config.js");

var postToInstagram = async (j, sheetName, count = 0) => {
  const addToCaption = config.ADD_TO_CAPTION,
    retry = process.env.RETRY || config.RETRY || 3,
    newFile = "output.jpg",
    deferred = q.defer();
  let posts, response;

  if (count > retry) {
    return deferred.reject("[ERROR] Retry error posting on instagram.");
  }

  // Get all posts from the spreadsheets
  try {
    posts = await googleAPI.getPostsFromTable(sheetName);
    console.log(`[INFO] #${count} Got posts from table.`);
  } catch (error) {
    console.log(
      `[ERROR] #${count} Error getting posts from table. Error: ${error}`
    );
    return postToInstagram(j, sheetName, ++count);
  }

  // find one random post we can use will be null if none left
  let post = helpers.getPost(posts, 0);
  if (post) {
    try {
      response = await helpers.downloadPicture(post.URL, post.image_name);
      console.log(`[iNFO] #${count} Got pic ${response}.`);
    } catch (error) {
      console.log(`[ERROR] #${count} Error downloading pic. Error: ${error}`);
      return postToInstagram(j, sheetName, ++count);
    }

    let sizeOf = helpers.sizeOf(post.image_name);
    try {
      response = await helpers.sharpPicture(post.image_name, sizeOf, newFile);
      console.log(`[INFO] #${count} Got sharped pic ${response}.`);
    } catch (error) {
      console.log(`[ERROR] #${count} Error sharping pic. Error: ${error}`);
      return postToInstagram(j, sheetName, ++count);
    }

    sizeOf = helpers.sizeOf(newFile);
    try {
      response = await instagramAPI(
        post,
        addToCaption,
        sizeOf.width,
        sizeOf.height
      );
      console.log(`[INFO] #${count} Posted on IG.`);
    } catch (error) {
      console.log(`[ERROR] #${count} Error posting on IG. Error: ${error}.`);
      return postToInstagram(j, sheetName, ++count);
    }

    let updated = false;
    while (!updated) {
      try {
        response = await googleAPI.updatePostStatusOfRow(
          post.rowIndex,
          sheetName
        );
        console.log(`[INFO] #${count} Updated sheet.`);
        updated = true;
        break;
      } catch (error) {
        console.log(`[ERROR] #${count} Error updating sheet. Error: ${error}.`);
        setTimeout(() => {
          console.log(
            `[INFO] #${count} Sleeping to retry update sheet row ${
              post.rowIndex
            }.`
          );
        }, 1000);
      }
    }

    updated = false;
    while (!updated) {
      try {
        helpers.deletePicture(newFile);
        helpers.deletePicture(post.image_name);
        console.log(`[INFO] #${count} Deleted pic ${newFile}.`);
        console.log(`[INFO] #${count} Deleted pic ${post.image_names}.`);
        updated = true;
        break;
      } catch (error) {
        console.log(`[ERROR] #${count} Error deleting pic. Error: ${error}.`);
        setTimeout(() => {
          console.log(
            `[INFO] #${count} Sleeping to retry delete photo ${newFile}.`
          );
        }, 1000);
      }
    }

    console.log(
      "[INFO] Post successfully posted. Next post will be done at: " +
        j.nextInvocation()
    );
    deferred.resolve(j.nextInvocation());
  } else {
    // no more posts
    deferred.reject("No posts on sheet.");
  }
  return deferred.promise;
};

module.exports = postToInstagram;
