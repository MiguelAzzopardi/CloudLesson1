import Firestore from "@google-cloud/firestore";
import {createHmac} from "crypto"

//Google Cloud key
export const GOOGLE_APPLICATION_CREDENTIALS='./key.json'

//Instantiating Firestore with project details
const db = new Firestore({
    projectId: 'pftc001',
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});



export function HashPassword(password){
    const secret = "hashDecodePass";
    return createHmac("sha256", password)
    .update(secret)
    .digest("hex");
}