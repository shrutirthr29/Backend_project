const asyncHandler = (requestHandler) =>{
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}
    
export {asyncHandler}



//-------procedure to write high order function---------
// const asyncHandler = () =>{}
// const asyncHandler = (func) =>{}
// const asyncHandler = (func) =>{() => {}}
// const asyncHandler = (func) => async () => {} 
//----------------------------------------------------

// using try catch
// const asyncHandler = (fn) => async (req, res,next) => {
//     try{
//         await fn(req, res, next)
//     }catch(err){
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// } 