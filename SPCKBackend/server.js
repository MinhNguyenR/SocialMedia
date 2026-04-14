import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import conversationRoutes from './src/routes/conversationRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

let onlineUsers = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('addNewUser', (userId) => {
        onlineUsers[userId] = socket.id;
        io.emit('getOnlineUsers', onlineUsers);
        console.log('Online users:', onlineUsers);
    });

    socket.on('sendMessage', (message) => {
        const recipientSocketId = onlineUsers[message.recipientId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('getMessage', message);
            console.log('Message sent to', message.recipientId, ':', message);
        } else {
            console.log('Recipient not online:', message.recipientId);
        }
    });

    socket.on('typing', (data) => {
        const recipientSocketId = onlineUsers[data.recipientId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', data);
        }
    });

    socket.on('stopTyping', (data) => {
        const recipientSocketId = onlineUsers[data.recipientId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('stopTyping', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        onlineUsers = Object.fromEntries(
            Object.entries(onlineUsers).filter(([key, value]) => value !== socket.id)
        );
        io.emit('getOnlineUsers', onlineUsers);
        console.log('Online users after disconnect:', onlineUsers);
    });
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
