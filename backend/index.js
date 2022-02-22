import Express from "express";
import cors from "cors"

const app = Express();
const PORT = 3001;

app.post("/login", (req, res) => {
    const email = req.query.email;
    const password = req.query.password;
    if(email == "test@test.com" && password == "123"){
        res.send("Hello Joe!")
    }else{
        res.send("You are not Joe!")
    }
    console.log(email + " " + password);
    
});

app.use(cors());
app.listen(PORT, () =>
console.log("Server listening on port: " + PORT));

