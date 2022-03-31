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

//custom methods to upload to firestore
export async function CreateUser(name, surname, email, password){
    //Collection (Table)
    //Document (Row)
    //docRef select the collection and corresponding document
    const docRef = db.collection("users").doc();
    return await docRef.set({
        name: name,
        surname: surname,
        email: email,
        password: HashPassword(password),
    });
}

export async function GetUser(email){
    const docRef = db.collection("userData");
    const snapshot = await docRef.where("email", "==", email).get();
    let data = [];
    snapshot.forEach((doc) => {
        data.push(doc.data());
    });
    if(data.length > 0){
        console.log("Found email: " + email);
    }
    else{
        console.log("Could not find email: " + email);
    }
    return data;
}