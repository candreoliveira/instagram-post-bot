const q = require("q"),
  Client = require("instagram-private-api").V1,
  device = new Client.Device("ledersattel"),
  storage = new Client.CookieFileStorage("./credentials/instauser.json"),
  config = require("../config"),
  path = require("path"),
  img_dir = path.join(process.cwd(), "images/");

module.exports = async (post, addToCaption, width, height) => {
  let session, upload, media;
  const deferred = q.defer(),
    user = process.env.INSTA_USER || config.INSTA_USER,
    password = process.env.INSTA_PW || config.INSTA_PW;

  // post to instagram
  try {
    session = await Client.Session.create(device, storage, user, password);
  } catch (error) {
    console.log(`[ERROR] Creating session on instagram. Error: ${error}`);
    deferred.reject(error);
  }

  try {
    upload = await Client.Upload.photo(session, img_dir + post.image_name);
  } catch (error) {
    console.log(`[ERROR] Uploading media on instagram. Error: ${error}`);
    deferred.reject(error);
  }

  try {
    media = await Client.Media.configurePhoto(
      session,
      upload.params.uploadId,
      post.Caption + addToCaption,
      width,
      height,
      post.tags
    );

    console.log(`[INFO] Configured media on instagram.`);

    deferred.resolve(media.params);
  } catch (error) {
    console.log(`[ERROR] Configuring media on instagram. Error: ${error}`);
    // deferred.reject(error);
    try {
      await Client.Media.delete(session, upload.params.uploadId);
      deferred.reject(error);
    } catch (e) {
      console.log(`[ERROR] Deleting media on instagram. Error: ${e}`);
      deferred.reject(error);
    }
  }

  return deferred.promise;
};
