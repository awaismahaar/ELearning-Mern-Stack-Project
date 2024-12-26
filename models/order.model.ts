import mongoose , {Schema , Document} from 'mongoose'

export interface IOrder extends Document{
    userId : string;
    courseId : string;
    payment_info : object;
}

const orderSchema = new Schema<IOrder>({
    userId : {
        type : String,
        required : true
    },
    courseId : {
        type : String,
        required : true
    },
    payment_info : {
        type : Object,
    },
},{timestamps: true})

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;