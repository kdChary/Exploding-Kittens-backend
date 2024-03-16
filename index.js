const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const dataBasePath = path.join(__dirname,"UserData.db");
let db = null;

const initializeDbAndServer = async () => {
    try{
        db = await open({
            filename : dataBasePath,
            driver: sqlite3.Database,
        });
        app.listen(3000, ()=>console.log(`server running at : http://localhost:3000/` ));
    } catch (err){
        console.log(`DB error: ${err.message}`);
        process.exit(1);
    }
};

initializeDbAndServer();

const validatePassword = (password) => {
    return password.length>5;
}

// User Registration Api
app.post("/register/", async (request,response)=>{
    const {username, name, password, gender} = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(getUserQuery);

    if(dbUser === undefined){
        if(validatePassword(password)){
            const addUserQuery = `INSERT INTO 
                user (username, name, age, gender, password)
                VALUES ('${username}', '${name}', ${age}, '${gender}', '${password}');`;
            response.status(200);
            response.send("User created successfully");
        } else{
            response.status(400);
            response.send("Password is too short");
        }
    }else{
        response.status(400);
        response.send("User already exists!");
    }
})

// User Login Api
app.post("/login/", async(request,response)=>{
    const {username,password} = request.body;
    const validateUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const validUser = await db.get(validateUserQuery);

    console.log(validUser !== undefined);

    if(validUser !== undefined){
        const checkPassword = await bcrypt.compare(password, validUser.password);
        if(checkPassword){
            const payload = { username: username };
            const jwtToken = jwt.sign(payload, "secret_key");
            response.status(200);
            response.send({ jwtToken });
        }else{
            response.status(400);
            response.send("Invalid password");
        }
    }else{
        response.status(400);
        response.send("Invalid User!");
    }
});

// generate authToken..
const authToken = (request, response, next) =>{
    let jwtToken;
    const authHeader = request.headers["Authorization"];
    if(authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1];
    }else{
        response.status(401);
        response.send(" Invalid Jwt Token!");
    }
    if(jwtToken !== undefined){
        jwt.verify(jwtToken,"secret_key", async(error,payload)=>{
            if(error){
                response.status(401);
                response.send("User UnAuthorized");
            }else{
                request.username = payload.username;
                next();
            }
        });
    }
}

module.exports = app;