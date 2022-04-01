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

async function uploadToCloud(req, res){
    const storage = new Storage.Storage({keyFileName: "./key.json"});
    const bucket = storage.bucket("pending/");   
    //Upload to cloud storage
    try {
        if (!req.file) {
            return res.status(400).send({ message: "Please upload a file!" });
        }
        // Create a new blob in the bucket and upload the file data.
        const blob = bucket.file(req.file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });
        blobStream.on("error", (err) => {
            console.log(`\nReq original name: ${req.file.originalname}\nBucket?: ${bucket.path}`);
            res.status(500).send({ message: err.message });
        });
        blobStream.on("finish", async (data) => {
            // Create URL for directly file access via HTTP.
            const publicUrl = format(
            `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            );
            try {
            // Make the file public
            await bucket.file(req.file.originalname).makePublic();
            } catch {
            return res.status(500).send({
                message:
                `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
                url: publicUrl,
            });
            }
            res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
            url: publicUrl,
            });
        });
        blobStream.end(req.file.buffer);
        } catch (err) {
        res.status(500).send({
            message: `Could not upload the file: ${req.file.originalname}. ${err}`,
        });
    }
}

upload.route("/").post(imageUpload.single("image"),async function (req, res){
  if (req.file) {
    console.log("File downloaded at: " + req.file.path);

    const uploadResult = await uploadToCloud(req, res);    
    console.log(uploadResult);
    //Convert to base64
    //Send to PDF Conversion API
    /*res.send({
      status: "200",
      message: "File uploaded successfully! Processing..",
    });*/
  }
});

export default upload;