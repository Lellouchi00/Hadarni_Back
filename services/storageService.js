const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ROOT_FOLDER = "audio";

function parsePath(filename) {
  const normalized = filename.replace(/\\/g, "/").replace(/\.mp3$/i, "");
  const parts = normalized.split("/");
  const publicId = parts.pop();
  const subfolder = parts.join("/");
  const folder = subfolder ? `${ROOT_FOLDER}/${subfolder}` : ROOT_FOLDER;
  return { folder, publicId };
}

async function uploadAudio(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const err = new Error("buffer must be a non-empty Buffer");
    err.statusCode = 400;
    throw err;
  }

  if (!filename || typeof filename !== "string" || !filename.trim()) {
    const err = new Error("filename is required and must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }

  const { folder, publicId } = parsePath(filename);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "video",
        format: "mp3",
      },
      (error, result) => {
        if (error) {
          const wrapped = new Error(`Cloudinary upload failed: ${error.message}`);
          wrapped.statusCode = 502;
          reject(wrapped);
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          publicUrl: result.secure_url,
          key: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function deleteAudio(publicId) {
  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    const err = new Error("publicId is required and must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "video" },
      (error, result) => {
        if (error) {
          const wrapped = new Error(`Cloudinary delete failed: ${error.message}`);
          wrapped.statusCode = 502;
          reject(wrapped);
          return;
        }

        resolve(result);
      }
    );
  });
}

async function getPublicUrl(publicId) {
  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    const err = new Error("publicId is required and must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }

  const url = cloudinary.url(publicId, {
    resource_type: "video",
    format: "mp3",
    secure: true,
  });

  return url;
}

module.exports = { uploadAudio, deleteAudio, getPublicUrl };
