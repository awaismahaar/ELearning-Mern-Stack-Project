import mongoose , {Schema , Document} from 'mongoose'
import { IUser } from './user.model';

interface IComment extends Document{
    user : IUser;
    question : string;
    questionReplies : IComment[]
}

interface IReview extends Document{
    user : IUser;
    comment : string;
    rating : number;
    repliesComment : IComment[]
}

interface ILink extends Document{
    title : string;
    url : string;
}

interface ICourseData extends Document{
    title : string;
    description : string;  
    videoUrl : string;
    videoThumbnail : object;
    videoSection : string;
    videoLength : number;
    videoPlayer : string;
    links : ILink[];
    questions : IComment[];
    suggestions : string;
}

interface ICourse extends Document{
    name : string;
    description : string;
    price : number;
    estimatedPrice : number;
    demoUrl : string;
    thumbnail : object;
    benefits : {title : string}[];
    prerequisites : {title : string}[];
    courseData : ICourseData[];
    reviews : IReview[];
    rating?: number;
    purchased?: number;
    level : string;
    tags : string;
}

// comment Schema
const commentSchema = new Schema<IComment>({
    user : Object,
    question : {
        type : String,
    },
    questionReplies : [Object]
});

// review Schema
const reviewSchema = new Schema<IReview>({
    user : Object,
    comment : {
        type : String,
    },
    rating : {
        type : Number,
        default : 0
    },
    repliesComment : [Object]
});

// Link Schema

const linkSchema = new Schema<ILink>({
    title : {
        type : String,
    },
    url : {
        type : String,
        required : true
    }
});

// courseData schema

const courseDataSchema = new Schema<ICourseData>({
    title : {
        type : String,
    },
    description : {
        type : String,
    },
    videoUrl : {
        type : String,
    },
    videoSection : {
        type : String,
    },
    videoLength : {
        type : Number,
    },
    videoPlayer : {
        type : String,
    },
    links : [linkSchema],
    questions : [commentSchema],
    suggestions : {
        type : String,
    }
});

// course Schema

const courseSchema = new Schema<ICourse>({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
    },
    price : {
        type : Number,
        required : true
    },
    estimatedPrice : {
        type : Number,
    },
    demoUrl : {
        type : String,
    },
    thumbnail : {
        public_id : String,
        url : String
    },
    benefits : [{title : String}],
    prerequisites : [{title : String}],
    courseData : [courseDataSchema],
    reviews : [reviewSchema],
    rating : {
        type : Number,
        default : 0
    },
    purchased : {
        type : Number,
        default : 0
    },
    level : {
        type : String,
    },
    tags : {
        type : String
    }
},{timestamps: true})

const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;