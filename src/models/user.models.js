import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true, // if we wanna enable the searching field then index: true is the good option to do
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type: String, //Cloudinary url
            required:true,
        },
        coverImage:{
            type:String, //Cloudinary url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String, //have to discuss it later bcz it will create the problem in comparison if encrypted so we have to write different logic for it 
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String,
        }

    },
    {
        timestamps:true
    }
)
//Below is for encryption (storing it in hash)
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password= await bcrypt.hash(this.password,10) 
    next()
})
//Below is for decryption (so that it will compare the password)
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken=function(){
    jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)