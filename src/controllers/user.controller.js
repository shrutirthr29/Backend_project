import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrror.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser=asyncHandler(async (req,res) => {
    // 1. get user details from the frontend
    // 2. validation - not empty
    // 3. check if user already exists: username, email
    // 4. check for images, check for avatar
    // 5. upload them to cloudinary, avatar
    // 6. create user object - create entry in db 
    // 7. remove password and refresh token field from response
    // 8. check for user creation
    // 9. return res


    // 1. get user details from the frontend
    const {fullname, email, username, password} = req.body
    console.log("email:",email)

    // 2. validation - not empty
    if([fullname,email,username,password].some((field)=> field?.trim === "")){
        throw new ApiError(400, "All fields are required")
    }

    // 3. check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User will email or username already exists")
    }

    // 4. check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    // 5. upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // 6. create user object - create entry in db 
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check for user creation
    if(!createdUser){
        throw new ApiError(400, "Something went wrong while registering the user")
    }

    // 9. return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

}) 

const loginUser=asyncHandler(async(req,res)=>{
    // 1. req body -> data
    // 2. username or email
    // 3. find the user
    // 4. password check
    // 5. access and refresh token
    // 6. send cookie
    
    
    // 1. req body -> data
    const{email,username,password}=req.body
    
    // 2. username or email
    if(!username || !email){
        throw new ApiError(400,"username or email is required")
    }
    
    // 3. find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // 4. password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    // 5. access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password - refreshToken")

    // 6. send cookie
    //when we do httpOnly and secure true then the cookies are only modifiable from the server, we cannot modify it from frontend
    const options ={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

export {registerUser,loginUser}