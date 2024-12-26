import {Router} from 'express'
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
import { createLayout, editLayout, getLayoutByType } from '../controllers/layout.controller';
const layoutRouter = Router();

// Create layout
layoutRouter.post("/create-layout", isAuthenticated , validateUserRole("admin") , createLayout)
// edit layout
layoutRouter.put("/edit-layout", isAuthenticated , validateUserRole("admin") , editLayout)
// get layout by type
layoutRouter.get("/layout/:type" , getLayoutByType)

export default layoutRouter;