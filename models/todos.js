import  mongoose from "mongoose"


const todosSchema=mongoose.Schema({
    title:{
       type:String,
       required:[true,"title must be provided"],
       unique:[true,"title must be unique"],
       trim:true,
       minLength:[5,"title must be at least 5 characters"],
       maxLength:[20,"title must be less than 20 characters"]
    },
    status:{
        type:String,
        enum:["todo","inprogress","done"],
        default:"todo"        
    },
    userId:{
      type:mongoose.SchemaTypes.ObjectId,
      ref:'User'
    }
})

const todoModel=mongoose.model('Todo',todosSchema)
export default todoModel