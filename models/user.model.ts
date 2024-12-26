import mongoose,{Schema,Document} from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
const emailRegexPattern:RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export interface IUser extends Document {
    name: string
    email: string
    password:string
    avatar : {
        public_id : string
        url : string
    }
    isVerified : boolean
    courses : Array<{courseId : string}>
    role : string
    comparePassword : (password:string)=> Promise<boolean>
    signAccessToken : ()=> string
    signRefreshToken : ()=> string
}

const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true , "Please enter your name"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        match: emailRegexPattern
    },
    password: {
        type: String,
        min : [6, "Password must be at least 6 characters"],
        select : false
    },
    avatar: {
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [{
        courseId: {
            type: String
        }
    }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
},{timestamps: true})

// hash password before saving

userSchema.pre<IUser>('save', async function(next: Function) {
    if (this.isModified('password')) {
        const hashedPassword = await bcrypt.hash(this.password, 10)
        this.password = hashedPassword
    }
    next()
})

// generate access token
userSchema.methods.signAccessToken = function(): string {
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' })
}

// generate refresh token

userSchema.methods.signRefreshToken = function(): string {
    return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' })
}

// compare password

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password)
}

const User = mongoose.model<IUser>('User', userSchema)
export default User;