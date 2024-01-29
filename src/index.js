import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/index.DB.js";
import app from "./app.js";
dotenv.config({ path: "./.env" });
//import { DB_NAME } from "./constants";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MONGODB connection failed..`, err);
  });

/*

import { Express } from "express";
const app = Express();

(async () =>{
    try{
        await mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`)
        app.on("error", (error) =>{
            console.log("Err", error);
            throw error

        })

        app.listen(process.env.PORT , ()=>{
            console.log(`App lisyening on port ${process.env.PORT}`);
        })
    } catch(error){
        console.log("ERROR ", error);
        throw error
    }
})()

*/
