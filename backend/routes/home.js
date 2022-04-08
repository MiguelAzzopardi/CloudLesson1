import Express from "express";

import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { validateToken } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const home = Express.Router();

home.route("/").get((req, res) => {
    const token = res.query.token;

    //Before we send the page to the use, we verify that the token is valid
    validateToken(token).then((ticket) =>{
        if(ticket.getPayload().name != null){
            res.sendFile(path.join(__dirname, "../../frontend/home.html"));
        }else{
            res.redirect("/");
        }
    }).catch((error) =>{
        console.log("Token expired");
        res.redirect("/");
    });
});

export default home;