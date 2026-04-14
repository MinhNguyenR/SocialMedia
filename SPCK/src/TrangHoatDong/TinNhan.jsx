import React, { useState, useEffect, useContext, useRef } from 'react';
import { Layout, Typography, Button, Avatar, Input, List, Spin, message, Card, Modal, Checkbox, Dropdown, Menu, Radio } from 'antd';
import { Link } from 'react-router-dom';
import {
    ArrowLeftOutlined,
    UserOutlined,
    SendOutlined,
    MessageOutlined,
    CheckCircleFilled,
    ClockCircleOutlined,
    SearchOutlined,
    PlusCircleOutlined,
    SmileOutlined,
    EllipsisOutlined,
    UserAddOutlined,
    UserDeleteOutlined,
    CloseOutlined,
    DeleteOutlined
} from '@ant-design/icons';

import Navbar from '../ChucNang/Navbar.jsx';
import { ThemeContext } from '../Setting/Setting.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_SERVER_URL = 'http://localhost:5000';

function TinNhan() {
    const { theme } = useContext(ThemeContext);
    const { user: currentUser, isAuthenticated, loading: authLoading } = useContext(AuthContext) || {};
    const navigate = useNavigate();
    const location = useLocation();

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingStatus, setTypingStatus] = useState({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [showCommunityMode, setShowCommunityMode] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContentCardRef = useRef(null);
    const [chatContentDimensions, setChatContentDimensions] = useState({ left: 0, width: 0 });
    const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
    const [addableUsers, setAddableUsers] = useState([]);
    const [selectedAddMembers, setSelectedAddMembers] = useState([]);

    // States mới cho việc chuyển quyền admin
    const [isTransferAdminModalVisible, setIsTransferAdminModalVisible] = useState(false);
    const [newAdminCandidateId, setNewAdminCandidateId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated || authLoading || !currentUser || !currentUser.id) {
            console.log("Auth not ready or currentUser missing, skipping socket setup.");
            return;
        }

        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            newSocket.emit('addNewUser', currentUser.id);
        });

        newSocket.on('getOnlineUsers', (users) => {
            console.log('Online users updated:', users);
            setOnlineUsers(users);
        });

        newSocket.on('getMessage', (message) => {
            console.log('Received new message:', message);
            setMessages(prevMessages => {
                if (!prevMessages.some(msg => msg._id === message._id)) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });

            if (selectedConversation && message.conversation === selectedConversation._id) {
                markMessageAsReadApi(message._id);
                scrollToBottom();
            }
        });

        newSocket.on('typing', (data) => {
            setTypingStatus(prev => ({
                ...prev,
                [data.conversationId]: { ...(prev[data.conversationId] || {}), [data.senderId]: true }
            }));
        });

        newSocket.on('stopTyping', (data) => {
            setTypingStatus(prev => {
                const newState = { ...prev };
                if (newState[data.conversationId]) {
                    delete newState[data.conversationId][data.senderId];
                    if (Object.keys(newState[data.conversationId]).length === 0) {
                        delete newState[data.conversationId];
                    }
                }
                return newState;
            });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setOnlineUsers({});
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, authLoading, currentUser, selectedConversation]);

    const markMessageAsReadApi = async (messageId) => {
        if (!currentUser || !currentUser.id) {
            console.warn("Cannot mark message as read: currentUser is not defined.");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/messages/${messageId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(prevMessages =>
                prevMessages.map(m =>
                    m._id === messageId ? { ...m, readBy: [...(m.readBy || []), currentUser.id] } : m
                )
            );
        } catch (error) {
            console.error(`Error marking message ${messageId} as read:`, error.response?.data || error.message);
        }
    };

    useEffect(() => {
        const fetchConversationsAndHandleParams = async () => {
            if (!isAuthenticated || authLoading || !currentUser || !currentUser.id) {
                setLoadingConversations(false);
                return;
            }
            setLoadingConversations(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    const fetchedConversations = response.data.data.filter(conv => !conv.isDeleted);
                    setConversations(fetchedConversations);

                    const params = new URLSearchParams(location.search);
                    const conversationIdFromUrl = params.get('conversationId');
                    const targetUserIdFromUrl = params.get('targetUserId');

                    if (conversationIdFromUrl) {
                        const convToSelect = fetchedConversations.find(conv => conv._id === conversationIdFromUrl);
                        if (convToSelect) {
                            setSelectedConversation(convToSelect);
                        } else {
                            if (targetUserIdFromUrl) {
                                await getOrCreateConversation(targetUserIdFromUrl, fetchedConversations);
                            }
                        }
                    } else if (targetUserIdFromUrl) {
                        await getOrCreateConversation(targetUserIdFromUrl, fetchedConversations);
                    }
                }
            } catch (error) {
                console.error('Error fetching conversations:', error.response?.data || error.message);
                message.error('Không thể tải danh sách cuộc trò chuyện.');
            } finally {
                setLoadingConversations(false);
            }
        };

        if (!authLoading) {
            fetchConversationsAndHandleParams();
        }
    }, [isAuthenticated, authLoading, location.search, currentUser]);

    const getOrCreateConversation = async (targetUserId, currentConversations) => {
        if (!currentUser || !currentUser.id || !targetUserId) return;

        const existingConv = currentConversations.find(conv =>
            Array.isArray(conv.participants) &&
            conv.participants.some(p => p._id === targetUserId) &&
            conv.participants.some(p => p._id === currentUser.id) &&
            !conv.isGroup // Chỉ tìm cuộc trò chuyện 1-1
        );

        if (existingConv) {
            setSelectedConversation(existingConv);
            return;
        }

        setLoadingMessages(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/conversations/user/${targetUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const newOrExistingConv = response.data.data;
                setSelectedConversation(newOrExistingConv);
                setConversations(prev => {
                    if (!prev.some(conv => conv._id === newOrExistingConv._id)) {
                        return [newOrExistingConv, ...prev];
                    }
                    return prev;
                });
            } else {
                message.error('Không thể tạo hoặc lấy cuộc trò chuyện mới.');
            }
        } catch (error) {
            console.error('Error getting or creating conversation:', error.response?.data || error.message);
            message.error('Có lỗi xảy ra khi lấy hoặc tạo cuộc trò chuyện.');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedConversation) {
                setMessages([]);
                return;
            }
            setLoadingMessages(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/messages/${selectedConversation._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setMessages(response.data.data);
                    if (currentUser && currentUser.id) {
                        markAllMessagesAsRead(response.data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching messages:', error.response?.data || error.message);
                message.error('Không thể tải tin nhắn.');
            } finally {
                setLoadingMessages(false);
                scrollToBottom();
            }
        };

        fetchMessages();
    }, [selectedConversation, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setNewMessageContent('');
    };

    const handleSendMessage = async () => {
        if (!newMessageContent.trim() || !selectedConversation || !currentUser || !currentUser.id) return;

        const tempMessage = {
            _id: Date.now().toString(),
            conversation: selectedConversation._id,
            sender: {
                _id: currentUser.id,
                username: currentUser.username,
                avatar: currentUser.avatar
            },
            content: newMessageContent.trim(),
            createdAt: new Date().toISOString(),
            isPending: true,
        };

        setMessages(prevMessages => [...prevMessages, tempMessage]);
        setNewMessageContent('');
        if (socket && selectedConversation && currentUser) {
            const recipient = Array.isArray(selectedConversation.participants) ? selectedConversation.participants.find(p => p._id !== currentUser.id) : null;
            if (recipient) {
                socket.emit('stopTyping', {
                    conversationId: selectedConversation._id,
                    senderId: currentUser.id,
                    recipientId: recipient._id,
                });
            }
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/messages/${selectedConversation._id}`, {
                content: tempMessage.content
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log('Message sent via API:', response.data.data);
                setMessages(prevMessages => prevMessages.map(msg =>
                    msg._id === tempMessage._id ? { ...response.data.data, isPending: false } : msg
                ));

                setConversations(prevConversations =>
                    prevConversations.map(conv =>
                        conv._id === selectedConversation._id
                            ? { ...conv, lastMessage: response.data.data, updatedAt: new Date().toISOString() }
                            : conv
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                );

                const recipient = Array.isArray(selectedConversation.participants) ? selectedConversation.participants.find(p => p._id !== currentUser.id) : null;
                if (socket && recipient) {
                    socket.emit('sendMessage', {
                        ...response.data.data,
                        recipientId: recipient._id,
                    });
                }
            } else {
                message.error('Gửi tin nhắn thất bại.');
                setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessage._id));
            }
        } catch (error) {
            console.error('Error sending message:', error.response?.data || error.message);
            message.error('Có lỗi xảy ra khi gửi tin nhắn.');
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessage._id));
        }
    };

    const handleTyping = (e) => {
        setNewMessageContent(e.target.value);
        if (socket && selectedConversation && currentUser) {
            const recipient = Array.isArray(selectedConversation.participants) ? selectedConversation.participants.find(p => p._id !== currentUser.id) : null;
            if (recipient) {
                socket.emit('typing', {
                    conversationId: selectedConversation._id,
                    senderId: currentUser.id,
                    recipientId: recipient._id,
                });
            }
        }
    };

    const handleStopTyping = () => {
        if (socket && selectedConversation && currentUser) {
            const recipient = Array.isArray(selectedConversation.participants) ? selectedConversation.participants.find(p => p._id !== currentUser.id) : null;
            if (recipient) {
                socket.emit('stopTyping', {
                    conversationId: selectedConversation._id,
                    senderId: currentUser.id,
                    recipientId: recipient._id,
                });
            }
        }
    };

    const getParticipantInfo = (conversation) => {
        if (!currentUser || !conversation || !Array.isArray(conversation.participants)) return null;
        if (conversation.isGroup) { // Sử dụng isGroup để xác định đây là nhóm
            return { username: conversation.name || `Nhóm ${conversation._id.substring(0, 8)}` };
        }
        const otherParticipant = conversation.participants.find(p => p._id !== currentUser.id);
        return otherParticipant || (conversation.participants.length > 0 ? conversation.participants[0] : null);
    };

    const isCurrentUserAdmin = selectedGroup && currentUser && selectedGroup.admin &&
        selectedGroup.admin.some(adminUser => adminUser._id === currentUser.id);

    const isCurrentUserSoleAdmin = selectedGroup && selectedGroup.isGroup && selectedGroup.admin &&
        selectedGroup.admin.length === 1 &&
        selectedGroup.admin.some(adminUser => adminUser._id === currentUser.id);

    const handleLeaveGroup = async () => {
        console.log("handleLeaveGroup called.");
        console.log("selectedGroup:", selectedGroup);
        console.log("isCurrentUserAdmin (from state):", isCurrentUserAdmin); 
        console.log("isCurrentUserSoleAdmin (from state):", isCurrentUserSoleAdmin); 
        // Nếu là cuộc trò chuyện 1-1, không cho phép rời nhóm, mà là soft-delete
        if (selectedGroup && !selectedGroup.isGroup) {
            message.error('Không thể rời khỏi cuộc trò chuyện 1-1. Hãy xóa nó.');
            return;
        }

        // Nếu là nhóm VÀ người dùng hiện tại là admin
        if (selectedGroup && selectedGroup.isGroup && isCurrentUserAdmin) {
            console.log("Current user is an admin of the group, showing transfer admin modal.");
            setIsTransferAdminModalVisible(true);
            return; // Dừng hàm, chờ người dùng thao tác với modal chuyển quyền
        }

        // Nếu là thành viên bình thường hoặc đã chuyển quyền admin (đến đây isCurrentUserAdmin sẽ là false)
        try {
            console.log("Current user is not an admin, or admin transfer already handled. Proceeding to call leave group API.");
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConversations(prev => prev.filter(conv => conv._id !== selectedGroup._id));
                setSelectedConversation(null);
                setMessages([]);
                setGroupModalVisible(false);
                message.success('Bạn đã thoát nhóm thành công!');
            }
        } catch (error) {
            console.error('Error leaving group:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thoát nhóm.');
        }
    };

    const handleTransferAdminAndLeave = async () => {
        console.log("handleTransferAdminAndLeave called.");
        if (!newAdminCandidateId) {
            message.error('Vui lòng chọn một người để chuyển quyền admin.');
            return;
        }
        if (!selectedGroup) return;

        try {
            const token = localStorage.getItem('token');
            // Chuyển quyền admin
            console.log(`Transferring admin rights for group ${selectedGroup._id} to new admin ${newAdminCandidateId}`);
            await axios.put(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/transfer-admin`,
                { newAdminId: newAdminCandidateId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success('Đã chuyển quyền admin thành công. Bạn đang rời nhóm...');

            // Sau khi chuyển quyền, cập nhật lại trạng thái nhóm để đảm bảo frontend biết quyền admin đã thay đổi
            const updatedGroupResponse = await axios.get(`${API_BASE_URL}/api/conversations/${selectedGroup._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedGroupData = updatedGroupResponse.data.data;

            // Cập nhật conversations list và selectedGroup
            setConversations(prev => prev.map(conv => conv._id === updatedGroupData._id ? updatedGroupData : conv));
            setSelectedGroup(updatedGroupData);

            //  Rời nhóm
            console.log("Calling leave group API after successful admin transfer.");
            const response = await axios.put(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setConversations(prev => prev.filter(conv => conv._id !== selectedGroup._id));
                setSelectedConversation(null);
                setMessages([]);
                setGroupModalVisible(false); 
                setIsTransferAdminModalVisible(false); 
                setNewAdminCandidateId(null);
                message.success('Bạn đã thoát nhóm thành công!');
            } else {
                message.error('Gặp lỗi khi cố gắng rời nhóm sau khi chuyển quyền admin.');
            }

        } catch (error) {
            console.error('Error transferring admin and leaving:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi chuyển quyền admin và thoát nhóm.');
        }
    };

    const handleDeleteGroup = async () => {
        if (!selectedGroup || !isCurrentUserAdmin) {
            message.error('Bạn không có quyền xóa nhóm này.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/delete-permanently`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConversations(prev => prev.filter(conv => conv._id !== selectedGroup._id));
                setSelectedConversation(null);
                setMessages([]);
                setGroupModalVisible(false);
                message.success('Đã xóa nhóm vĩnh viễn thành công!');
            }
        } catch (error) {
            console.error('Error deleting group permanently:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhóm.');
        }
    };

    const isOnline = (userId) => {
        return !!onlineUsers[userId];
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return `${seconds} giây trước`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    };

    const markAllMessagesAsRead = async (msgs) => {
        if (!currentUser || !currentUser.id || !selectedConversation) return;

        const unreadMessages = msgs.filter(msg =>
            msg.sender && msg.sender._id !== currentUser.id && !msg.readBy.includes(currentUser.id)
        );

        for (const msg of unreadMessages) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${API_BASE_URL}/api/messages/${msg._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(prevMessages =>
                    prevMessages.map(m =>
                        m._id === msg._id ? { ...m, readBy: [...(m.readBy || []), currentUser.id] } : m
                    )
                );
            } catch (error) {
                console.error(`Error marking message ${msg._id} as read:`, error.response?.data || error.message);
            }
        }
    };

    if (authLoading || !currentUser) {
        return (
            <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Spin size="large" tip="Đang tải dữ liệu người dùng..." />
            </Layout>
        );
    }

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    useEffect(() => {
        const updateDimensions = () => {
            if (chatContentCardRef.current) {
                const rect = chatContentCardRef.current.getBoundingClientRect();
                setChatContentDimensions({
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        const timeoutId = setTimeout(updateDimensions, 0);

        window.addEventListener('resize', updateDimensions);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [selectedConversation, loadingConversations, loadingMessages]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        if (selectedUsers.length < 1) {
            message.error('Vui lòng chọn ít nhất 1 người để tạo nhóm (ngoài bạn).');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const uniqueParticipantIds = Array.from(new Set([currentUser.id, ...selectedUsers]));

            const response = await axios.post(`${API_BASE_URL}/api/conversations/group`, {
                participantIds: uniqueParticipantIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const newGroup = response.data.data;
                setConversations(prev => [newGroup, ...prev.filter(c => c._id !== newGroup._id)]);
                setSelectedConversation(newGroup);
                setIsModalVisible(false);
                setSelectedUsers([]);
                message.success('Tạo nhóm thành công!');
            } else {
                message.error('Tạo nhóm thất bại.');
            }
        } catch (error) {
            console.error('Error creating group:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm.');
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedUsers([]);
    };

    const onCheckboxChange = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSoftDeleteConversation = async (conversationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/conversations/${conversationId}/soft-delete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(prev => prev.filter(conv => conv._id !== conversationId));
            if (selectedConversation && selectedConversation._id === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }
            message.success('Đã xóa cuộc trò chuyện thành công!');
        } catch (error) {
            console.error('Error soft deleting conversation:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa cuộc trò chuyện.');
        }
    };

    const showGroupModal = (group) => {
        // Chỉ mở modal quản lý nhóm nếu đó là một nhóm
        if (group.isGroup) {
            setSelectedGroup(group);
            setGroupName(group.name || `Nhóm ${group._id.substring(0, 8)}`);
            setGroupModalVisible(true);
        } else {
            message.info('Đây không phải là nhóm để quản lý.');
        }
    };

    const handleUpdateGroupName = async () => {
        if (!groupName.trim()) {
            message.error('Tên nhóm không được để trống.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/conversations/${selectedGroup._id}`, { name: groupName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const updatedConversation = response.data.data;
                setConversations(prev => prev.map(conv =>
                    conv._id === updatedConversation._id ? updatedConversation : conv
                ));
                if (selectedConversation && selectedConversation._id === updatedConversation._id) {
                    setSelectedConversation(updatedConversation);
                }
                setGroupModalVisible(false);
                message.success('Đổi tên nhóm thành công!');
            } else {
                message.error('Đổi tên nhóm thất bại.');
            }
        } catch (error) {
            console.error('Error updating group name:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi tên nhóm.');
        }
    };

    const handleAddMember = async (userId) => {
        if (!selectedGroup || !isCurrentUserAdmin) {
            message.error('Bạn không có quyền thêm thành viên.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/add-member`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const updatedGroup = response.data.data;
                setConversations(prev => prev.map(conv =>
                    conv._id === updatedGroup._id ? updatedGroup : conv
                ));
                if (selectedConversation && selectedConversation._id === updatedGroup._id) {
                    setSelectedConversation(updatedGroup);
                }
                setGroupModalVisible(false);
                message.success('Thêm thành viên thành công!');
            } else {
                message.error('Thêm thành viên thất bại.');
            }
        } catch (error) {
            console.error('Error adding member:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm thành viên.');
        }
    };

    const handleKickMember = async (memberId) => {
        if (!selectedGroup || !isCurrentUserAdmin || memberId === currentUser.id) {
            message.error('Bạn không có quyền kick thành viên hoặc không thể kick chính mình.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/kick-member`, { memberId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const updatedGroup = response.data.data;
                setConversations(prev => prev.map(conv =>
                    conv._id === updatedGroup._id ? updatedGroup : conv
                ));
                if (selectedConversation && selectedConversation._id === updatedGroup._id) {
                    setSelectedConversation(updatedGroup);
                }
                setGroupModalVisible(false);
                message.success('Đã kick thành viên thành công!');
            } else {
                message.error('Kick thành viên thất bại.');
            }
        } catch (error) {
            console.error('Error kicking member:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi kick thành viên.');
        }
    };

    const toggleCommunityMode = () => {
        setShowCommunityMode(!showCommunityMode);
    };

    const showAddMemberModal = () => {
        setIsAddMemberModalVisible(true);
        setGroupModalVisible(false);
        if (!selectedConversation || !currentUser) return;
        const participants = selectedConversation.participants || [];
        const existingIds = participants.map(p => p._id);
        const allUsers = conversations
            .flatMap(conv => conv.participants || [])
            .filter(u => u._id !== currentUser.id);
        const uniqueUsers = Array.from(new Map(allUsers.map(u => [u._id, u])).values())
            .filter(u => !existingIds.includes(u._id));
        setAddableUsers(uniqueUsers);
    };

    const handleAddMemberCheckbox = (userId) => {
        setSelectedAddMembers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleAddMembersConfirm = async () => {
        if (!selectedGroup || selectedAddMembers.length === 0 || !isCurrentUserAdmin) {
            message.error('Bạn không có quyền thêm thành viên.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                selectedAddMembers.map(userId =>
                    axios.post(`${API_BASE_URL}/api/conversations/${selectedGroup._id}/add-member`, { userId }, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );
            message.success('Thêm thành viên thành công!');
            setIsAddMemberModalVisible(false);
            setSelectedAddMembers([]);
            const updatedGroup = (await axios.get(`${API_BASE_URL}/api/conversations/${selectedGroup._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })).data.data;
            setConversations(prev => prev.map(conv => conv._id === updatedGroup._id ? updatedGroup : conv));
            if (selectedConversation && selectedConversation._id === updatedGroup._id) {
                setSelectedConversation(updatedGroup);
            }
        } catch (error) {
            console.error('Error adding members:', error);
            message.error(error.response?.data?.message || 'Lỗi khi thêm thành viên.');
        }
    };

    return (
        <Layout className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
            <Navbar />
            <Content
                className="flex flex-1 pt-16 p-4 overflow-hidden"
                style={{ color: theme.colors.text, height: 'calc(100vh - 64px)' }}
            >
                <Card
                    className="w-1/4 min-w-[250px] max-w-[350px] flex flex-col mr-4 flex-shrink-0"
                    style={{
                        backgroundColor: theme.colors.siderBackground,
                        borderColor: theme.colors.border + '20',
                        color: theme.colors.text,
                        boxShadow: theme.mode === 'light' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                        height: '100%',
                    }}
                    bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    <div className="p-4 flex-shrink-0" style={{ backgroundColor: theme.colors.cardBackground, borderBottom: `1px solid ${theme.colors.border + '20'}`, borderRadius: '16px 16px 0 0' }}>
                        <Title level={4} className="mb-0" style={{ color: theme.colors.text, display: 'flex', alignItems: 'center' }}>
                            <MessageOutlined className="mr-2" /> Đoạn chat
                        </Title>
                    </div>

                    <div className="p-4 flex-shrink-0" style={{ backgroundColor: theme.colors.siderBackground }}>
                        <Search
                            placeholder="Tìm kiếm trên Messenger"
                            prefix={<SearchOutlined style={{ color: theme.colors.text + '80' }} />}
                            className="w-full rounded-lg mb-3"
                            style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                border: '1px solid ' + theme.colors.text + '20',
                                boxShadow: 'none',
                            }}
                        />

                        <div className="flex mb-2">
                            <Button
                                type="text"
                                className="flex-1 rounded-md"
                                style={{
                                    color: showCommunityMode ? theme.colors.text : theme.colors.primary,
                                    backgroundColor: showCommunityMode ? 'transparent' : theme.colors.primary + '10'
                                }}
                                onClick={() => setShowCommunityMode(false)}
                            >
                                Hộp thư
                            </Button>
                            <Button
                                type="text"
                                className="flex-1 rounded-md"
                                style={{
                                    color: showCommunityMode ? theme.colors.primary : theme.colors.text,
                                    backgroundColor: showCommunityMode ? theme.colors.primary + '10' : 'transparent'
                                }}
                                onClick={toggleCommunityMode}
                            >
                                Cộng đồng
                            </Button>
                        </div>
                    </div>

                    {loadingConversations ? (
                        <div className="flex justify-center items-center flex-1">
                            <Spin />
                        </div>
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={showCommunityMode ? conversations.filter(conv => conv.isGroup) : conversations.filter(conv => !conv.isGroup)}
                            className="flex-1 overflow-y-auto px-2"
                            renderItem={(conv) => {
                                const participant = getParticipantInfo(conv);
                                const lastMessage = conv.lastMessage;
                                const isConvSelected = selectedConversation && selectedConversation._id === conv._id;
                                const isUnread = lastMessage && lastMessage.sender._id !== currentUser.id && !lastMessage.readBy.includes(currentUser.id);

                                const menu = (
                                    <Menu style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}>
                                        {!conv.isGroup && (
                                            <Menu.Item key="delete" onClick={() => handleSoftDeleteConversation(conv._id)} style={{ color: theme.colors.text }}>
                                                Xóa cuộc trò chuyện
                                            </Menu.Item>
                                        )}
                                        {conv.isGroup && (
                                            <Menu.Item key="groupOptions" onClick={() => showGroupModal(conv)} style={{ color: theme.colors.text }}>
                                                Quản lý nhóm
                                            </Menu.Item>
                                        )}
                                        <Menu.Item key="createGroup" onClick={showModal} style={{ color: theme.colors.text }}>
                                            Tạo nhóm trò chuyện
                                        </Menu.Item>
                                    </Menu>
                                );

                                return (
                                    <List.Item
                                        key={conv._id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`cursor-pointer px-2 py-3 rounded-lg my-1 hover:bg-opacity-10 transition-colors duration-200 ${isConvSelected ? 'bg-opacity-15' : ''}`}
                                        style={{
                                            backgroundColor: isConvSelected ? theme.colors.primary + '20' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                        }}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                // Bọc avatar trong Link để chuyển hướng đến trang hồ sơ
                                                <Link to={`/profile/${participant?._id}`} style={{ textDecoration: 'none' }}>
                                                    <div className="relative">
                                                        <Avatar src={participant?.avatar} icon={<UserOutlined />} style={{ backgroundColor: theme.colors.primary }} />
                                                        {isOnline(participant?._id) && (
                                                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: theme.colors.primary }}></span>
                                                        )}
                                                    </div>
                                                </Link>
                                            }
                                            title={<span className="font-semibold" style={{ color: theme.colors.text }}>{participant?.username}</span>}
                                            description={
                                                <div className="flex flex-col">
                                                    <Text className="text-sm truncate" style={{ color: isUnread ? theme.colors.text : theme.colors.text + 'B0', fontWeight: isUnread ? 'bold' : 'normal' }}>
                                                        {lastMessage ? `${lastMessage.sender.username === currentUser.username ? 'Bạn: ' : ''}${lastMessage.content}` : 'Bắt đầu cuộc trò chuyện'}
                                                    </Text>
                                                    {lastMessage && (
                                                        <div className="flex items-center justify-between">
                                                            <Text className="text-xs" style={{ color: theme.colors.text + '80' }}>
                                                                {formatTimeAgo(lastMessage.createdAt)}
                                                            </Text>
                                                            {isUnread && (
                                                                <span className="h-2 w-2 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: theme.colors.primary }}></span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                        <Dropdown
                                            overlay={menu}
                                            trigger={['click']}
                                        >
                                            <Button
                                                type="text"
                                                icon={<EllipsisOutlined />}
                                                style={{
                                                    color: theme.colors.text,
                                                    padding: '4px',
                                                    minWidth: '24px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            />
                                        </Dropdown>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </Card>

                <Card
                    ref={chatContentCardRef}
                    className="flex-1 flex flex-col"
                    style={{
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: theme.colors.border + '20',
                        color: theme.colors.text,
                        height: '100%',
                        boxShadow: theme.mode === 'light' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                    }}
                    bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    {!selectedConversation ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                            <MessageOutlined style={{ fontSize: '64px', color: theme.colors.text + '50' }} />
                            <Title level={3} className="mt-4" style={{ color: theme.colors.text }}>
                                Chọn một cuộc trò chuyện
                            </Title>
                            <Text style={{ color: theme.colors.text + 'B0' }}>
                                Hoặc tìm kiếm người bạn muốn nhắn tin để bắt đầu.
                            </Text>
                        </div>
                    ) : (
                        <>
                            <div
                                className="flex items-center p-4 border-b flex-shrink-0"
                                style={{
                                    backgroundColor: theme.colors.cardBackground,
                                    borderColor: theme.colors.border + '20',
                                    color: theme.colors.text,
                                    borderRadius: '16px 16px 0 0',
                                    height: '64px',
                                }}
                            >
                                <Button
                                    type="text"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => setSelectedConversation(null)}
                                    style={{ color: theme.colors.text, borderRadius: '8px' }}
                                />
                                <div className="flex items-center ml-3 flex-1">
                                    <Link
                                        to={selectedConversation?.isGroup ? '#' : `/profile/${getParticipantInfo(selectedConversation)?._id}`} // Chuyển hướng đến trang hồ sơ
                                        style={{ textDecoration: 'none' }}
                                        onClick={(e) => selectedConversation?.isGroup && e.preventDefault()} // Ngăn chuyển hướng nếu là nhóm
                                    >
                                        <div className="relative">
                                            <Avatar src={getParticipantInfo(selectedConversation)?.avatar} icon={<UserOutlined />} style={{ backgroundColor: theme.colors.primary }} />
                                            {isOnline(getParticipantInfo(selectedConversation)?._id) && (
                                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: theme.colors.primary }}></span>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="ml-3">
                                        <Title level={5} className="mb-0" style={{ color: theme.colors.text }}>
                                            {getParticipantInfo(selectedConversation)?.username}
                                        </Title>
                                        {isOnline(getParticipantInfo(selectedConversation)?._id) ? (
                                            <Text style={{ color: theme.colors.primary }}>Đang hoạt động</Text>
                                        ) : (
                                            <Text type="secondary" style={{ color: theme.colors.text + '80' }}>Ngoại tuyến</Text>
                                        )}
                                        {selectedConversation && typingStatus[selectedConversation._id] &&
                                            typingStatus[selectedConversation._id][getParticipantInfo(selectedConversation)?._id] && (
                                                <Text type="secondary" className="block text-xs italic" style={{ color: theme.colors.primary }}>
                                                    Đang gõ...
                                                </Text>
                                            )}
                                    </div>
                                </div>
                                {selectedConversation?.isGroup ? (
                                    <Button
                                        type="text"
                                        icon={<EllipsisOutlined />}
                                        onClick={() => showGroupModal(selectedConversation)}
                                        style={{ color: theme.colors.text, borderRadius: '8px' }}
                                    />
                                ) : (
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleSoftDeleteConversation(selectedConversation._id)}
                                        style={{ color: theme.colors.text, borderRadius: '8px' }}
                                    />
                                )}
                            </div>

                            <div
                                className={`p-6 overflow-y-auto space-y-4`}
                                style={{
                                    backgroundColor: theme.colors.background,
                                    height: '546px',
                                    maxHeight: '546px',
                                }}
                            >
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spin />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-500" style={{ color: theme.colors.text + '80' }}>
                                        Hãy gửi tin nhắn đầu tiên!
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={msg._id || index}
                                            className={`flex ${msg.sender && msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`flex items-end max-w-[70%] ${msg.sender && msg.sender._id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                <Link
                                                    to={`/profile/${msg.sender?._id}`} // Chuyển hướng đến trang hồ sơ của người gửi
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <Avatar
                                                        src={msg.sender?.avatar}
                                                        icon={<UserOutlined />}
                                                        size="small"
                                                        className="mx-2 flex-shrink-0"
                                                        style={{ backgroundColor: theme.colors.primary }}
                                                    />
                                                </Link>
                                                <div
                                                    className={`p-3 rounded-xl`}
                                                    style={{
                                                        backgroundColor: msg.sender && msg.sender._id === currentUser.id ? theme.colors.primary : theme.colors.cardBackground,
                                                        color: msg.sender && msg.sender._id === currentUser.id ? '#fff' : theme.colors.text,
                                                    }}
                                                >
                                                    <Text className="block text-base" style={{ color: msg.sender && msg.sender._id === currentUser.id ? '#fff' : theme.colors.text }}>
                                                        {msg.content}
                                                    </Text>
                                                    <div className="flex justify-end items-center text-xs mt-1">
                                                        <Text style={{ color: msg.sender && msg.sender._id === currentUser.id ? '#fff' : theme.colors.text + 'A0' }}>
                                                            {formatTimeAgo(msg.createdAt)}
                                                        </Text>
                                                        {msg.sender && msg.sender._id === currentUser.id && (
                                                            msg.isPending ? (
                                                                <ClockCircleOutlined className="ml-1" style={{ color: '#fff' }} />
                                                            ) : (
                                                                getParticipantInfo(selectedConversation)?._id && msg.readBy && msg.readBy.includes(getParticipantInfo(selectedConversation)?._id) && (
                                                                    <CheckCircleFilled className="ml-1" style={{ color: '#fff' }} />
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </>
                    )}
                </Card>
            </Content>

            {selectedConversation && (
                <div
                    className="fixed bottom-0 z-10 p-4 flex items-center"
                    style={{
                        backgroundColor: theme.colors.siderBackground,
                        borderTop: `1px solid ${theme.colors.border + '20'}`,
                        left: `${chatContentDimensions.left}px`,
                        width: `${chatContentDimensions.width}px`,
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                        height: '64px',
                    }}
                >
                    <div className="flex items-center flex-1 mr-3 rounded-md"
                        style={{
                            backgroundColor: theme.colors.background,
                            border: '1px solid ' + theme.colors.text + '20',
                        }}
                    >
                        <Button
                            type="text"
                            icon={<PlusCircleOutlined />}
                            style={{ color: theme.colors.text + '80', marginRight: '8px' }}
                            className="rounded-full !w-8 !h-8 flex items-center justify-center p-0"
                        />
                        <Input
                            value={newMessageContent}
                            onChange={handleTyping}
                            onBlur={handleStopTyping}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none"
                            style={{
                                backgroundColor: 'transparent',
                                color: theme.colors.text,
                                boxShadow: 'none',
                                border: 'none'
                            }}
                            onPressEnter={handleSendMessage}
                        />
                        <Button
                            type="text"
                            icon={<SmileOutlined />}
                            style={{ color: theme.colors.text + '80', marginLeft: '8px' }}
                            className="rounded-full !w-8 !h-8 flex items-center justify-center p-0"
                        />
                    </div>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        disabled={!newMessageContent.trim()}
                        className="!w-10 !h-10 rounded-full flex items-center justify-center p-0"
                        style={{
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                            boxShadow: `0 2px 8px ${theme.colors.primary + '60'}`,
                        }}
                    />
                </div>
            )}

            <Modal
                title={<span style={{ color: theme.colors.text }}>Tạo nhóm trò chuyện</span>}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                bodyStyle={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
                closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                footer={[
                    <Button key="back" onClick={handleCancel} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type={selectedUsers.length >= 1 ? 'primary' : 'default'}
                        disabled={selectedUsers.length < 1}
                        onClick={handleOk}
                        style={{ backgroundColor: selectedUsers.length >= 1 ? theme.colors.primary : theme.colors.border, color: selectedUsers.length >= 1 ? '#fff' : theme.colors.text }}
                    >
                        Tạo nhóm
                    </Button>,
                ]}
            >
                <List
                    dataSource={conversations.filter(conv => conv.participants && conv.participants.length === 2 && !conv.isGroup && conv.participants.some(p => p._id !== currentUser.id))}
                    renderItem={(conv) => {
                        const participant = getParticipantInfo(conv);
                        if (!participant) return null;
                        return (
                            <List.Item style={{ color: theme.colors.text }}>
                                <Checkbox
                                    checked={selectedUsers.includes(participant._id)}
                                    onChange={() => onCheckboxChange(participant._id)}
                                    style={{ color: theme.colors.text }}
                                >
                                    <span style={{ color: theme.colors.text }}>{participant?.username || 'Người dùng ẩn danh'}</span>
                                </Checkbox>
                            </List.Item>
                        );
                    }}
                />
            </Modal>
            <Modal
                title={<span style={{ color: theme.colors.text }}>Thêm thành viên vào nhóm</span>}
                visible={isAddMemberModalVisible}
                onOk={handleAddMembersConfirm}
                onCancel={() => {
                    setIsAddMemberModalVisible(false);
                    setSelectedAddMembers([]);
                }}
                bodyStyle={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
                okButtonProps={{ disabled: selectedAddMembers.length === 0 || !isCurrentUserAdmin }}
                okText="Thêm thành viên"
                cancelText="Hủy"
                closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                footer={[
                    <Button key="back" onClick={() => { setIsAddMemberModalVisible(false); setSelectedAddMembers([]); }} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        disabled={selectedAddMembers.length === 0 || !isCurrentUserAdmin}
                        onClick={handleAddMembersConfirm}
                        style={{ backgroundColor: (selectedAddMembers.length > 0 && isCurrentUserAdmin) ? theme.colors.primary : theme.colors.border, color: (selectedAddMembers.length > 0 && isCurrentUserAdmin) ? '#fff' : theme.colors.text }}
                    >
                        Thêm thành viên
                    </Button>,
                ]}
            >
                <List
                    dataSource={addableUsers}
                    renderItem={(user) => {
                        const alreadyInGroup = selectedGroup?.participants.some(p => p._id === user._id);
                        return (
                            <List.Item style={{ color: theme.colors.text }}>
                                <Checkbox
                                    checked={selectedAddMembers.includes(user._id)}
                                    onChange={() => handleAddMemberCheckbox(user._id)}
                                    disabled={alreadyInGroup || !isCurrentUserAdmin}
                                    style={{ color: (alreadyInGroup || !isCurrentUserAdmin) ? theme.colors.text + '50' : theme.colors.text }}
                                >
                                    <span style={{ color: (alreadyInGroup || !isCurrentUserAdmin) ? theme.colors.text + '50' : theme.colors.text }}>
                                        {user.username || 'Người dùng ẩn danh'}
                                    </span>
                                </Checkbox>
                            </List.Item>
                        );
                    }}
                />
            </Modal>
            <Modal
                title={<span style={{ color: theme.colors.text }}>Quản lý nhóm</span>}
                visible={groupModalVisible}
                onOk={() => setGroupModalVisible(false)}
                onCancel={() => setGroupModalVisible(false)}
                bodyStyle={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
                closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                footer={[
                    <Button key="back" onClick={() => setGroupModalVisible(false)} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}>
                        Đóng
                    </Button>,
                    isCurrentUserAdmin && (
                        <Button key="save" type="primary" onClick={handleUpdateGroupName} style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}>
                            Lưu
                        </Button>
                    ),
                    <Button
                        key="leave"
                        danger
                        onClick={handleLeaveGroup}
                        style={{
                            backgroundColor: '#ff4d4f',
                            borderColor: '#ff4d4f',
                            color: '#fff',
                        }}
                    >
                        Thoát nhóm
                    </Button>,
                    isCurrentUserAdmin && (
                        <Button
                            key="deleteGroup"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteGroup}
                            style={{ marginLeft: '8px', backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff' }}
                        >
                            Xóa nhóm
                        </Button>
                    )
                ]}
            >
                <div>
                    <div className="mb-4">
                        <label style={{ color: theme.colors.text }}>Tên nhóm:</label>
                        <Input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm"
                            disabled={!isCurrentUserAdmin}
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        />
                    </div>
                    <div className="mb-4">
                        <h4 style={{ color: theme.colors.text }}>Thành viên:</h4>
                        <List
                            dataSource={selectedGroup?.participants}
                            renderItem={(member) => (
                                <List.Item style={{ color: theme.colors.text }}>
                                    <span style={{ color: theme.colors.text }}>
                                        {member.username} {member._id === currentUser.id && '(Bạn)'}
                                        {selectedGroup.admin && selectedGroup.admin.includes(member._id) && ' (Admin)'}
                                    </span>
                                    {selectedGroup.isGroup && member._id !== currentUser.id && isCurrentUserAdmin && (
                                        !selectedGroup.admin.includes(member._id) && ( // Chỉ hiển thị nút kick nếu người đó không phải admin
                                            <Button
                                                icon={<UserDeleteOutlined />}
                                                onClick={() => handleKickMember(member._id)}
                                                style={{ marginLeft: '8px', color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
                                            />
                                        )
                                    )}
                                </List.Item>
                            )}
                        />
                    </div>
                    {isCurrentUserAdmin && (
                        <Button icon={<UserAddOutlined />} onClick={showAddMemberModal} block style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, color: '#fff' }}>
                            Thêm thành viên
                        </Button>
                    )}
                </div>
            </Modal>

            <Modal
                title={<span style={{ color: theme.colors.text }}>Chuyển quyền Admin và Thoát nhóm</span>}
                visible={isTransferAdminModalVisible}
                onOk={handleTransferAdminAndLeave}
                onCancel={() => { setIsTransferAdminModalVisible(false); setNewAdminCandidateId(null); }}
                bodyStyle={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
                closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                footer={[
                    <Button key="cancelTransfer" onClick={() => { setIsTransferAdminModalVisible(false); setNewAdminCandidateId(null); }} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}>
                        Hủy
                    </Button>,
                    <Button
                        key="confirmTransferAndLeave"
                        type="primary"
                        onClick={handleTransferAdminAndLeave}
                        disabled={!newAdminCandidateId}
                        style={{ backgroundColor: !newAdminCandidateId ? theme.colors.border : theme.colors.primary, color: !newAdminCandidateId ? theme.colors.text : '#fff' }}
                    >
                        Chuyển quyền Admin và Thoát
                    </Button>,
                ]}
            >
                <div className="mb-4">
                    {/* Hiển thị thông báo khác nếu không phải admin duy nhất nhưng vẫn cần chuyển */}
                    {isCurrentUserSoleAdmin ? (
                        <Text style={{ color: theme.colors.text }}>Bạn là admin duy nhất của nhóm. Vui lòng chọn một thành viên khác để chuyển quyền admin trước khi thoát nhóm.</Text>
                    ) : (
                        <Text style={{ color: theme.colors.text }}>Vui lòng chọn một thành viên để chuyển quyền admin trước khi thoát nhóm.</Text>
                    )}

                    <List
                        dataSource={selectedGroup?.participants.filter(p => p._id !== currentUser.id)}
                        renderItem={(member) => (
                            <List.Item style={{ color: theme.colors.text }}>
                                <Radio
                                    value={member._id}
                                    checked={newAdminCandidateId === member._id}
                                    onChange={() => setNewAdminCandidateId(member._id)}
                                >
                                    <span style={{ color: theme.colors.text }}>{member.username}</span>
                                </Radio>
                            </List.Item>
                        )}
                    />
                </div>
            </Modal>
        </Layout>
    );
}

export default TinNhan;
