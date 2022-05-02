import Express from "express";
import { Storage } from "@google-cloud/storage";

//Initializing constants
const clean = Express.Router();
const bucketName = "pftc001.appspot.com";

//Storage instance
const storage = new Storage({
    projectId: 'pftc001',
    keyFilename: './key.json'
});

//Route for /clean
clean.route("/").post((req, res) => {
    listFiles();
});

//Search and delete for files in bucket that are more than 1 day old
async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Storage Files:');
    files.forEach(file => {
        if(new Date(file.metadata.timeCreated) < Date.now()-(86400000)){ //86400000 = 1day
            console.log(file.name + " is over 1 day old!");
            
            file.delete();
        }
    });
}

export default clean;