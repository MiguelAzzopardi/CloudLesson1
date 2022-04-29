import Express from "express";

const clean = Express.Router();

clean.route("/").post((req,res) => {
    console.log("Cron job works!");
});

export default clean;