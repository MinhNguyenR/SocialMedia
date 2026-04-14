import mongoose from 'mongoose';

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true, 
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            default: null,
        },
        isGroup: { 
            type: Boolean,
            default: false,
        },
        admin: [ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
