import Express from "express";
import { OAuth2Client } from "google-auth-library";

//Initializing variables
const CLIENT_ID = "943607083854-u6u1k67lph43ad6u66qq0mdf4d3uingk.apps.googleusercontent.com";
const auth = Express.Router();
const client = new OAuth2Client(CLIENT_ID);

export default auth;

//Route for /auth
auth.route("/").post((req, res) => {
  //Get token
  const token = req.query.token;

  //Call validate token
  validateToken(token)
    .then((ticket) => {
      if (ticket) {
        //If token is valid, send back user google data.
        const payload = ticket.getPayload();
        res.send({
          status: "200",
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          token: token,
          expiry: payload.exp,
        });
      } else {
        //If token is invalid, send back failed status
        res.send({ status: "401" });
      }
    }).catch((error) => {
      //Catch extra errors and send back failed status
      console.log("Token expired");
      res.send({ status: "401" });
    });;
});

//Validate token
export const validateToken = async(token) => {
  return await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
};