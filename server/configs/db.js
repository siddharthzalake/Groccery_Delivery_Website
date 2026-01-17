import mongoose from "mongoose";
import env from 'dotenv'
const connectDB = async ()=>{
    try{
        mongoose.connection.on('connected',()=>
            console.log("database connected"))
        await mongoose.connect(`${process.env.MONGODB_URI}/greencart`)
    }catch(error){
      console.error(error.message);
    }
}

export default connectDB;