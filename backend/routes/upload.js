import Express from "express";

const upload = Express.Router();

upload.route("/").post((req, res) => {
    //receive the image
    //convert it to base64
    //save it in the cloud storage
    //send it to API
});

export default upload;