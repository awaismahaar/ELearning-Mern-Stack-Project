import mongoose, { Schema, Model, Document } from 'mongoose'

interface IFAQ extends Document {
    question: string;
    answer: string;
}

interface Category extends Document {
    name: string;
}

interface BannerImage extends Document {
    public_id: string;
    url: string;
}

interface Layout extends Document {
    type: string;
    faq: IFAQ[];
    categories: Category[];
    banner: {
        title: string;
        description: string;
        image: BannerImage;
    }
}

const faqSchema = new Schema<IFAQ>({
    question: {
        type: String,
    },
    answer: {
        type: String,
    }
})

const categorySchema = new Schema<Category>({
    name: {
        type: String,
    }
})

const bannerImageSchema = new Schema<BannerImage>({
    public_id : {
        type : String,
    },
    url : {
        type : String,
    }
})

const layoutSchema = new Schema<Layout>({
    type: {
        type: String,
        required: true
    },
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        image: bannerImageSchema
    }
})

const Layout: Model<Layout> = mongoose.model<Layout>('Layout', layoutSchema)

export default Layout