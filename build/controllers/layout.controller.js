"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
// create layout
exports.createLayout = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const layout = await layout_model_1.default.findOne({ type });
        if (layout) {
            return next(new ErrorHandler_1.default(`${type} already exists`, 400));
        }
        if (type === "Banner") {
            const { title, description, image } = req.body;
            if (!title || !description || !image) {
                return next(new ErrorHandler_1.default("All fields are required for Banner layout", 400));
            }
            const myCloud = await cloudinary_1.default.uploader.upload(image, {
                folder: "layout"
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                description
            };
            await layout_model_1.default.create({ type: type, banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            if (!faq) {
                return next(new ErrorHandler_1.default("All fields are required for FAQ layout", 400));
            }
            await layout_model_1.default.create({
                type: type,
                faq
            });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            if (!categories) {
                return next(new ErrorHandler_1.default("Name required for Categories layout", 400));
            }
            await layout_model_1.default.create({
                type: type,
                categories,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Layout created successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// edit layout
exports.editLayout = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const bannerLayout = await layout_model_1.default.findOne({ type: "Banner" });
        if (type === "Banner") {
            const { title, description, image } = req.body;
            await cloudinary_1.default.uploader.destroy(bannerLayout?.banner.image.public_id);
            const myCloud = await cloudinary_1.default.uploader.upload(image, {
                folder: "layout"
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                description
            };
            await layout_model_1.default.findByIdAndUpdate(bannerLayout?._id, { type: "Banner", banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqLayout = await layout_model_1.default.findOne({ type: "FAQ" });
            await layout_model_1.default.findByIdAndUpdate(faqLayout?._id, { type: "FAQ", faq });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryLayout = await layout_model_1.default.findOne({ type: "Categories" });
            await layout_model_1.default.findByIdAndUpdate(categoryLayout?._id, { type: "Categories", categories });
        }
        return res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get layout by type
exports.getLayoutByType = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        const layout = await layout_model_1.default.findOne({ type });
        if (!layout) {
            return next(new ErrorHandler_1.default(`${type} layout not found`, 404));
        }
        return res.status(200).json({
            success: true,
            layout
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
