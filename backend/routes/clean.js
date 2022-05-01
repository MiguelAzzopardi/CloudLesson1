import Express from "express";
import { Storage } from "@google-cloud/storage";
const clean = Express.Router();

const bucketName = "pftc001.appspot.com";

const storage = new Storage({
    projectId: 'pftc001',
    keyFilename: './key.json'
});

clean.route("/").post((req, res) => {
    listFiles();
});

async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Files:');
    files.forEach(file => {
        if(new Date(file.metadata.timeCreated) < Date.now()-(1800000)){ //86400000 = 1day
            console.log(file.name + " is over 1 day old!");
            //fokin yeet
            file.delete();
        }
    });
}
export default clean;