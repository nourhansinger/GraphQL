import  mongoose from "mongoose"
import bcrypt from "bcryptjs";

const usersSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z]{3,8}(@)(gmail|yahoo)(.com)$/.test(v);
      },
      message: () => "email is not valid",
    },
  },
  password: {
    type: String,
    required: true,
  },
  role:{
    type:String,
    enum:["admin","user"],
    default:"user"
  }
});

usersSchema.pre("save", async function (next) {
  // console.log(this);

 const salt=await bcrypt.genSalt(10)
 let hashedPassword= await bcrypt.hash(this.password,salt)
 this.password=hashedPassword
});
const userModel = mongoose.model("User", usersSchema);
export default  userModel;
