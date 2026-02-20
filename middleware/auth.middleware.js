import jwt from "jsonwebtoken";

export const isLoggedIn = async (req, res, next ) => {
    try{
        console.log("cookies: ", req.cookies);
        let token = req.cookies?.token

        console.log('Token found: ', token ? "Yes" : "No")
        if(!token){
            console.log("No token")
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log("decoded ", decoded)
        req.user = decoded

        next();
        
    }catch(error){
        console.log("Auth middleware failure");
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
    
    //next();
};