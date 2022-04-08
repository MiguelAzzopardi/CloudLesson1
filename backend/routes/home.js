import Express from "express";

import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const home = Express.Router();

home.route("/").get((req, res) => {
    
});

export default home;