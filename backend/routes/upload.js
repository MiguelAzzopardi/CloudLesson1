import Express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import * as Storage from "@google-cloud/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = Express.Router();

async function testBucket(id) {
    const doc = await db.collection(collection).doc(id).get();

    if (!doc.exists) {
        throw new Error('No such document!');
    }
    return doc.data();
}

let imageUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2621441,
  },
});

//Used for debugging to see if Credentials work
async function listBuckets() {
  const storage = new Storage.Storage({projectId: 'pftc001',
  keyFilename: './key.json',});
  try {
    const results = await storage.getBuckets();

    const [buckets] = results;

    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
  } catch (err) {
    console.error('ERROR:', err);
  }
}

async function uploadFile2(file){
  const storage = new Storage.Storage({projectId: 'pftc001',
    keyFilename: './key.json',});  
  const bucketName = "pftc001.appspot.com";

  console.log(`Attempting to upload file: ${file.path}, to bucket name: ${bucketName}. `);
  await storage.bucket(bucketName).upload(file.path, {
    destination: "pending/" + file.originalname,
  });

  console.log(`${file.path} uploaded to ${bucketName}`);
}

upload.route("/").post(imageUpload.single("image"), async function (req, res){
  if (req.file) {
    await listBuckets();

    console.log("\nFile downloaded at: " + req.file.path);

    const resp = await uploadFile2(req.file).catch(console.error);

    //Convert to base64

    //Send to PDF Conversion API
    res.send({
      status: "200",
      message: "File uploaded successfully! Processing..",
    });
  }
});

export default upload;