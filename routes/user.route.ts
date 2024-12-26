import express from 'express'
import { ActivateUser, deleteUser, getAllUsers, getUserProfile, Login, Logout, Register, socialAuth, updateAccessToken, updateAvatar, updatePassword, updateUserProfile, updateUserRole } from '../controllers/user.controller';
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
const userRouter = express.Router();

// registration
userRouter.post('/register' , Register);
// activate user account
userRouter.post("/activate-user" , ActivateUser);
// login user
userRouter.post("/login" , Login);
// logout user
userRouter.get("/logout" , isAuthenticated , Logout);
// refresh token
userRouter.get("/refresh-token" , updateAccessToken)
// get user information
userRouter.get("/me" , updateAccessToken , isAuthenticated , getUserProfile)
// social authentication
userRouter.post("/social-auth" , socialAuth);
// update user
userRouter.put("/update-user" , isAuthenticated , updateUserProfile);
// update password
userRouter.put("/update-password" , isAuthenticated , updatePassword)
// update avatar
userRouter.put("/update-avatar" , isAuthenticated , updateAvatar)
// get all users
 userRouter.get("/get-all-users" , isAuthenticated , validateUserRole("admin"), getAllUsers)
// update user role
userRouter.post("/update-user-role" , isAuthenticated , validateUserRole("admin"), updateUserRole);
// delete user 
userRouter.delete("/delete-user/:id" , isAuthenticated , validateUserRole("admin"), deleteUser);

export default userRouter;