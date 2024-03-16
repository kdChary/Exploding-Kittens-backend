const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require("cors");

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
        app.listen(3000, ()=>console.log(`server running at : https://localhost:3000/` ));
    } catch (err){
        console.log(`DB error: ${err.message}`);
        process.exit(1);
    }
};

initializeDbAndServer();

