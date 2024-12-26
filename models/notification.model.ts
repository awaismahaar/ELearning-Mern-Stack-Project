import mongoose , {Schema , Document} from 'mongoose'

export interface INotification extends Document{
    title : string;
    message : string;
    status : string;
    userId : string;
}

const notificationSchema = new Schema<INotification>({
    title : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    status : {
        type : String,
        enum : ['unread', 'read'],
        default : 'unread'
    },
    userId : {
        type : String,
        required : true
    }
},{timestamps : true})

const Notification = mongoose.model<INotification>('Notification', notificationSchema)
export default Notification;