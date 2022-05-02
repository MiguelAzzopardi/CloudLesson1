import Firestore from "@google-cloud/firestore";
import {createHmac} from "crypto"
import Redis from "redis";

export let redisClient = new Redis.createClient();

//Redis callbacks
console.log("Hi!");
redisClient.on("connect", async() =>{
    console.log("Redis connected!");
});

redisClient.on("error", function(error) {
    console.error(error);
});

//Redis set and get functions, if not connected, connect to redits client
export async function SetCreditsPrices(payload){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }

    return await redisClient.set("credits", JSON.stringify(payload));
}

export async function GetCreditsPrices(){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }

    return await redisClient.get("credits");
}

//Google Cloud key
export const GOOGLE_APPLICATION_CREDENTIALS = './key.json'

//Instantiating Firestore with project details
const db = new Firestore({
    projectId: 'pftc001',
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

//Creates new user document
export async function CreateUser(email){
    //docRef select the collection and corresponding document
    const docRef = db.collection("userData").doc();
    return await docRef.set({
        admin: false,
        credits: 10,
        email: email
    });
}

//Get user data from email
export async function GetUser(email){
    const docRef = db.collection("userData");
    const snapshot = await docRef.where("email", "==", email).get();
    let data = [];
    snapshot.forEach((doc) => {
        data.push(doc.data());
    });

    return data;
}

//Get user document from email
export async function GetUserDoc(email){
    const docRef = db.collection("userData");
    const snapshot = await docRef.where("email", "==", email).get();
    let data = [];
    snapshot.forEach((doc) => {
        data.push(doc);
    });
    
    return data[0];
}

//Gets credits of user from email
export async function GetCurUserCredits(email){
    const userDoc = await GetUserDoc(email);
    
    //console.log(`Doc: ${userDoc}`);
    //console.log(`Got email of ${email}, credits: ${userDoc.data().credits}`);
    return userDoc.data().credits;
}

//Set credits of user via email & amount
export async function SetCurCredits(email, amount){
    //Would confirm payment here
    
    //Add credits
    //console.log("Getting user doc of email: " + email);
    const userDoc = await GetUserDoc(email);

    var newCredits = Number(userDoc.data().credits) + Number(amount);

    const userRef = db.collection('userData').doc(userDoc.id);
    const res = await userRef.update({
        credits: Number(newCredits),
    });
}

export async function GetCurCredits(email){
    const r = await GetUser(email);
    return r[0].credits;
}