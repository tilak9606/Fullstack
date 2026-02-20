import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import db from "./utils/db.js";
import cookieParser from "cookie-parser";

//import all routes
import userRoutes from "./routes/User.routes.js"

dotenv.config();
const app = express();

app.use(
    cors({
        origin: "http:localhost:3000",
        credentials:true,
        method: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
 
//console.log(process.env.port);
//connected to db
db();
//user routes
app.use("/api/v1/users", userRoutes);