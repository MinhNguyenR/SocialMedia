import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Nhập tên'],
        unique: true,
        trim: true,
        maxlength: [20, 'Tên không quá 20 chữ']
    },
    email: {
        type: String,
        required: [true, 'Thêm email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Nhập đúng định dạng'
        ]
    },
    password: {
        type: String,
        required: [true, 'Thêm mật khẩu'],
        minlength: [6, 'Mật khẩu cần hơn 6 kí tự'],
        select: false 
    },
    avatar: {
        type: String, 
        default: '' 
    },
    bio: {
        type: String,
        default: '', 
        maxlength: [200, 'Tiểu sử không quá 200 ký tự'] 
    },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' 
        }
    ],
    friendRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', async function(next) {
    console.log('Kiểm tra xem mật khẩu có đang sửa đổi không');
    if (!this.isModified('password')) {
        console.log('Mật khẩu chưa được thay đổi');
        next();
        return; 
    }
    console.log('Mật khẩu đã thêm hoặc thay đổi');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Băm mật khẩu thành công.');
    next();
});

UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h' 
    });
};

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
