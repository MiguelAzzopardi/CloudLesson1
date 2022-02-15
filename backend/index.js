import Express from "express";
import cors from "cors"

const app = Express();
const PORT = 3001;

app.get("/hello", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    if(username == "joe" && password == "123"){
        res.send("Hello Joe!")
    }else{
        res.send("You are not Joe!")
    }
    console.log(username + " " + password);
    
});

app.use(cors());
app.listen(PORT, () =>
console.log("Server listening on port: " + PORT));

