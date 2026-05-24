const { getSignedUrl }    = require("@aws-sdk/s3-request-presigner");
const { s3, GetObjectCommand } = require("../config/s3");

const EXPIRES_IN = 60 * 60; // 1 hour


const getSignedFileUrl = async (keyOrUrl) => {
  if (!keyOrUrl) return null;

  // Extract just the key if a full URL was stored
  let key = keyOrUrl;
  if (keyOrUrl.startsWith("http")) {
    // e.g. https://bucket.s3.region.amazonaws.com/some-key.jpg  → some-key.jpg
    const url = new URL(keyOrUrl);
    key = url.pathname.replace(/^\//, ""); // strip leading slash
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key:    key,
  });

  return await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN });
};


const signObjectFiles = async (obj, fields) => {
  if (!obj) return obj;
  const clone = { ...obj };
  await Promise.all(
    fields.map(async (field) => {
      if (clone[field]) {
        clone[field] = await getSignedFileUrl(clone[field]);
      }
    })
  );
  return clone;
};

module.exports = { getSignedFileUrl, signObjectFiles };