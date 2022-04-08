import Express from "express";
import { OAuth2Client } from "google-auth-library";

const CLIENT_ID =
  "943607083854-u6u1k67lph43ad6u66qq0mdf4d3uingk.apps.googleusercontent.com";
const auth = Express.Router();
const client = new OAuth2Client(CLIENT_ID);

export default auth;

auth.route("/").post((req, res) => {
  const token = req.query.token;
  client
    .verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    })
    .catch((error) => {
      console.log(error);
      res.send({ status: "401" });
    })
    .then((ticket) => {
      if (ticket) {
        const payload = ticket.getPayload();
        res.send({
          status: "200",
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          token: token,
          expiry: payload.exp,
        });
        console.log(`${payload.name} has logged in.`);
      } else {
        
        res.send({ status: "401" });
      }
    });
});