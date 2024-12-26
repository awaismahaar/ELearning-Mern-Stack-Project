"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
const redis_1 = require("./redis");
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '5');
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '7');
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();
    if (process.env.NODE_ENV === 'production') {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie('access_token', accessToken, exports.accessTokenOptions);
    res.cookie('refresh_token', refreshToken, exports.refreshTokenOptions);
    // session store in redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    res.status(statusCode).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isVerified: user.isVerified,
            role: user.role
        },
        accessToken
    });
};
exports.sendToken = sendToken;
