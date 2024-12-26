"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = void 0;
const redis_1 = require("../utils/redis");
const getUserById = async (id, res) => {
    // fetch user from redis
    const user = await redis_1.redis.get(id);
    if (user) {
        return res.status(200).json({
            success: true,
            user
        });
    }
};
exports.getUserById = getUserById;
