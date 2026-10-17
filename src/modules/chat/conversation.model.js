import mongoose from "mongoose";

const ConversationSchema= new mongoose.Schema({
    title:{
        type:String,
        default:"New Chat"
    },
    userId:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

const Conversation=mongoose.model("Conversation",ConversationSchema);
export default Conversation;