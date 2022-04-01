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

async function uploadToCloud(req, res){
    const storage = new Storage.Storage({projectId: 'pftc001',
    keyFilename: './key.json',});
    const bucket = storage.bucket("pftc001.appspot.com/pending");   
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

        blobStream.on("error", (err) => {
            console.log(`\nReq original name: ${req.file.originalname}\nBucket?: ${bucket.name}\nBlob name: ${blob.name}`);
            res.status(500).send({ message: err.message });
        });
        
        blobStream.end(req.file.buffer);
        } catch (err) {
        res.status(500).send({
            message: `Could not upload the file: ${req.file.originalname}. ${err}`,
        });
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

  const publicUrl = format(
    `https://storage.googleapis.com/${bucketName}/${file.name}`
  );

  res.status(200).send({
    message: "Uploaded the file successfully: " + file.originalname,
    url: publicUrl,
  });
}

upload.route("/").post(imageUpload.single("image"),async function (req, res){
  if (req.file) {
    await listBuckets();

    console.log("\nFile downloaded at: " + req.file.path);

    //const uploadResult = await uploadToCloud(req, res);    
    //const resp = await listBuckets();
    const resp = await uploadFile2(req.file).catch(console.error);

    //console.log(uploadResult);
    //Convert to base64
    //Send to PDF Conversion API
    /*res.send({
      status: "200",
      message: "File uploaded successfully! Processing..",
    });*/
  }
});

export default upload;