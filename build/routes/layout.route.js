"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const layout_controller_1 = require("../controllers/layout.controller");
const layoutRouter = (0, express_1.Router)();
// Create layout
layoutRouter.post("/create-layout", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), layout_controller_1.createLayout);
// edit layout
layoutRouter.put("/edit-layout", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), layout_controller_1.editLayout);
// get layout by type
layoutRouter.get("/layout/:type", layout_controller_1.getLayoutByType);
exports.default = layoutRouter;
