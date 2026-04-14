import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Card, Avatar, Typography, Spin, Layout, Button, Modal, message, Image, Menu, Dropdown, Alert, Input, Form } from 'antd';
import { UserOutlined, PlusOutlined, MessageOutlined, EllipsisOutlined, LikeOutlined, CommentOutlined, ShareAltOutlined, DeleteOutlined, PictureOutlined, TagOutlined, MinusCircleOutlined, SendOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../Setting/Setting';
import Navbar from '../ChucNang/Navbar';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Content } = Layout;
const { TextArea } = Input;


const API_BASE_URL = 'http://localhost:5000';


function ProFile() {
    console.log('ProFile.jsx: AuthContext object imported:', AuthContext);

    if (!AuthContext) {
        console.error("ProFile.jsx: AuthContext is null or undefined before useContext call!");
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'red', color: 'white' }}>
                <Alert
                    message="Lỗi nghiêm trọng"
                    description="Không thể tải AuthContext. Vui lòng kiểm tra lại cấu hình ứng dụng."
                    type="error"
                    showIcon
                />
            </Content>
        );
    }

    const authContextValue = useContext(AuthContext);
    console.log('ProFile.jsx: Value received from useContext(AuthContext):', authContextValue);

    if (!authContextValue) {
        console.error("ProFile.jsx: useContext(AuthContext) returned null or undefined!");
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'red', color: 'white' }}>
                <Alert
                    message="Lỗi xác thực"
                    description="Không thể truy cập thông tin người dùng. Vui lòng kiểm tra lại AuthProvider."
                    type="error"
                    showIcon
                />
            </Content>
        );
    }

    const { user: currentUser, isAuthenticated, loading: authLoading, setUser, logout } = authContextValue;
    const { theme } = useContext(ThemeContext);
    const { user: authUser, token, setUser: setAuthUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const { userId } = useParams();

    const [profileUser, setProfileUser] = useState(null);
    const isMyProfile = useMemo(() => {
        if (!profileUser || !currentUser) return false;
        return profileUser.id?.toString() === currentUser.id?.toString();
    }, [profileUser, currentUser]);

    const [userPosts, setUserPosts] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [error, setError] = useState(null);
    const [friendStatus, setFriendStatus] = useState('');

    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const [newBio, setNewBio] = useState('');
    const [isBioModalVisible, setIsBioModalVisible] = useState(false);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [profileForm] = Form.useForm();

    useEffect(() => {
        if (profileUser) {
            profileForm.setFieldsValue({
                username: profileUser.username,
                email: profileUser.email,
            });
        }
    }, [profileUser, profileForm]);

    useEffect(() => {
        console.log('✅ useEffect đang chạy');

        if (!authUser || !profileUser) {
            console.log('⚠️ authUser hoặc profileUser chưa sẵn sàng');
            return;
        }

        if (authUser.id === profileUser.id) {
            console.log('👤 Đây là profile của chính mình, không cần check friendStatus');
            return;
        }

        console.log('📡 Gọi API kiểm tra trạng thái kết bạn...');
        const checkFriendStatus = async () => {
            console.log("📡 Gọi API kiểm tra trạng thái kết bạn...");
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/${profileUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = res.data.data;

                if (!data) {
                    console.warn("⚠️ Không nhận được data người dùng!");
                    return;
                }

                if (data.friends?.includes(authUser.id)) {
                    setFriendStatus('friends');
                } else if (data.friendRequests?.includes(authUser.id)) {
                    setFriendStatus('sent');
                } else if (authUser.friendRequests?.includes(profileUser.id)) {
                    setFriendStatus('received');
                } else {
                    setFriendStatus('none');
                }
                console.log("✅ friendStatus:", friendStatus);
            } catch (err) {
                console.error('❌ Lỗi kiểm tra trạng thái kết bạn:', err);
            }
        };


        checkFriendStatus();
    }, [authUser, profileUser, token]);


    // Fetch thông tin profile của người dùng dựa trên userId từ URL
    useEffect(() => {
        const fetchProfile = async () => {
            setLoadingProfile(true);
            setError(null);
            try {
                const targetUserId = userId || (currentUser ? currentUser.id : null);

                if (!targetUserId) {
                    if (!currentUser) {
                        navigate('/login');
                        return;
                    }
                    setError('Không tìm thấy ID người dùng để hiển thị profile.');
                    setLoadingProfile(false);
                    return;
                }

                const response = await axios.get(`${API_BASE_URL}/api/users/${targetUserId}`);
                if (response.data.success) {
                    const fetchedProfileData = {
                        ...response.data.data,
                        id: response.data.data.id || response.data.data._id
                    };
                    setProfileUser(fetchedProfileData);
                    // Chỉ set newBio nếu là profile của chính người dùng
                    if (currentUser && fetchedProfileData.id === currentUser.id) {
                        setNewBio(fetchedProfileData.bio || '');
                    }
                } else {
                    setError(response.data.message || 'Không thể tải thông tin profile người dùng.');
                }
            } catch (err) {
                console.error('Error fetching profile user:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải profile.');
            } finally {
                setLoadingProfile(false);
            }
        };

        if (!authLoading) {
            fetchProfile();
        }
    }, [userId, currentUser, authLoading, navigate]);

    useEffect(() => {
        const fetchUserPosts = async () => {
            console.log('--- Fetching User Posts ---');
            console.log('profileUser for posts useEffect:', profileUser);
            if (!profileUser?.id) {
                console.log('profileUser.id is not available or profileUser is null, skipping post fetch.');
                setLoadingPosts(false);
                return;
            }

            setLoadingPosts(true);
            try {
                const postsApiUrl = `${API_BASE_URL}/api/posts/user/${profileUser.id}`;
                console.log(`Attempting to fetch posts from: ${postsApiUrl}`);
                const response = await axios.get(postsApiUrl);

                if (response.data.success) {
                    console.log('Posts fetched successfully:', response.data.data);
                    setUserPosts(response.data.data);
                } else {
                    console.error('Failed to fetch user posts:', response.data.message);
                    message.error(response.data.message || 'Không thể tải bài viết của người dùng này.');
                }
            } catch (err) {
                console.error('Error fetching user posts:', err.response?.data || err.message);
                message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải bài viết.');
            } finally {
                setLoadingPosts(false);
                console.log('--- Post Fetching Finished ---');
            }
        };

        if (profileUser && !loadingProfile) {
            fetchUserPosts();
        }
    }, [profileUser, loadingProfile]);

    const handleSendRequest = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/users/${profileUser.id}/friend-request`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendStatus('sent');
        } catch (err) {
            message.error('Lỗi gửi lời mời kết bạn');
        }
    };

    const handleAcceptRequest = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/users/${profileUser.id}/accept-friend`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendStatus('friends');
        } catch (err) {
            message.error('Lỗi chấp nhận kết bạn');
        }
    };

    const handleDeclineRequest = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/users/${profileUser.id}/decline-friend`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendStatus('none');
        } catch (err) {
            message.error('Lỗi từ chối kết bạn');
        }
    };

    const handleUnfriend = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/users/${profileUser.id}/remove-friend`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendStatus('none');
        } catch (err) {
            message.error('Lỗi huỷ kết bạn');
        }
    };



    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file); // 👈 Phải là 'avatar'

        try {
            const res = await axios.put('http://localhost:5000/api/users/avatar', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data.success) {
                message.success('Cập nhật avatar thành công!');
                setAuthUser((prev) => ({
                    ...prev,
                    avatar: res.data.data.avatar,
                }));
                setProfileUser((prev) => ({
                    ...prev,
                    avatar: res.data.data.avatar,
                }));
            } else {
                message.error(res.data.message || 'Cập nhật avatar thất bại.');
            }
        } catch (err) {
            console.error('Lỗi upload avatar:', err);
            message.error('Không thể tải ảnh đại diện.');
        }
    };

    useEffect(() => {
        const fetchFriends = async () => {
            setLoadingFriends(true);
            try {
                const url = `${API_BASE_URL}/api/users/${authUser.id}/friends`;
                console.log('Gọi API danh sách bạn bè:', url);
                const res = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.data.success) {
                    setFriends(res.data.data || []); // Đảm bảo set mảng rỗng nếu không có dữ liệu
                    console.log('Danh sách bạn bè:', res.data.data);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách bạn bè:', error.response?.data || error.message);
                message.error('Không thể tải danh sách bạn bè.');
            } finally {
                setLoadingFriends(false);
            }
        };

        if (authUser?.id) {
            fetchFriends();
        }
    }, [authUser?.id, token]);

    const handleLikePost = async (postId) => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để thích bài viết.');
            navigate('/login');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/posts/${postId}/react`, { type: 'like' }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setUserPosts(prevPosts =>
                    prevPosts.map(post =>
                        post._id === postId
                            ? { ...post, reactions: response.data.data }
                            : post
                    )
                );
                message.success(response.data.message);
            } else {
                message.error(response.data.message || 'Thao tác thích thất bại.');
            }
        } catch (error) {
            console.error('Error liking post:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thích bài viết.');
        }
    };

    const handleCommentClick = (post) => {
        setSelectedPost(post);
        setIsCommentModalVisible(true);
    };

    const handleCommentModalCancel = () => {
        setIsCommentModalVisible(false);
        setSelectedPost(null);
        setCommentText('');
    };

    const handleAddComment = async () => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để bình luận.');
            navigate('/login');
            return;
        }
        if (!commentText.trim()) {
            message.error('Nội dung bình luận không được để trống.');
            return;
        }

        setSubmittingComment(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/posts/${selectedPost._id}/comment`, { text: commentText }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                message.success('Bình luận đã được thêm!');
                setUserPosts(prevPosts =>
                    prevPosts.map(post =>
                        post._id === selectedPost._id
                            ? {
                                ...post,
                                comments: [...post.comments, response.data.data]
                            }
                            : post
                    )
                );
                setSelectedPost(prevPost => ({
                    ...prevPost,
                    comments: [...prevPost.comments, response.data.data]
                }));
                setCommentText('');
            } else {
                message.error(response.data.message || 'Thêm bình luận thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi thêm bình luận:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm bình luận.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShareClick = (post) => {
        const shareUrl = `${window.location.origin}/post/${post._id}`;
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        message.success('Đã sao chép liên kết bài viết!');
    };

    const handleDeletePost = async (postId) => {
        Modal.confirm({
            title: 'Xác nhận xóa bài viết',
            content: 'Bạn có chắc chắn muốn xóa bài viết này không? Bài viết sẽ không hiển thị nhưng vẫn còn trong dữ liệu.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        message.error('Bạn cần đăng nhập để xóa bài viết.');
                        navigate('/login');
                        return;
                    }

                    const response = await axios.put(`${API_BASE_URL}/api/posts/${postId}/delete`, {}, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (response.data.success) {
                        message.success('Bài viết đã được xóa thành công!');
                        setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
                    } else {
                        message.error(response.data.message || 'Xóa bài viết thất bại.');
                    }
                } catch (error) {
                    console.error('Error deleting post:', error.response?.data || error.message);
                    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa bài viết.');
                }
            },
        });
    };

    const postOptionsMenu = (post) => {
        const isOwner = currentUser && post.user && currentUser.id === post.user._id;
        return (
            <Menu>
                {isOwner && (
                    <Menu.Item key="delete" icon={<MinusCircleOutlined />} onClick={() => handleDeletePost(post._id)} danger>
                        Xóa bài viết
                    </Menu.Item>
                )}
            </Menu>
        );
    };

    const handleUpdateBio = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/users/bio`, { bio: newBio }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.data.success) {
                message.success('Cập nhật tiểu sử thành công!');
                setUser(res.data.data);
                setProfileUser(res.data.data);
                setIsBioModalVisible(false);
            } else {
                message.error(res.data.message || 'Cập nhật tiểu sử thất bại.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật tiểu sử:', err.response?.data || err.message);
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tiểu sử.');
        }
    };

    const handleEditSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.success) {
                message.success('Cập nhật profile thành công!');
                setUser(res.data.data);
                setProfileUser(res.data.data);
                setIsEditModalVisible(false);
            } else {
                message.error(res.data.message || 'Cập nhật profile thất bại.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật profile:', err.response?.data || err.message);
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật profile.');
        }
    };
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'vừa xong';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };
    // Hàm xử lý khi nhấn nút "Nhắn tin"
    const handleMessageUser = async () => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để nhắn tin.');
            navigate('/login');
            return;
        }
        if (!profileUser || !currentUser || profileUser.id === currentUser.id) {
            message.warning('Không thể nhắn tin cho chính mình hoặc người dùng không hợp lệ.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Gọi API để lấy hoặc tạo cuộc trò chuyện với người dùng này
            const response = await axios.get(`${API_BASE_URL}/api/conversations/user/${profileUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.data?._id) {
                // Chuyển hướng đến trang messages với conversationId
                navigate(`/messages?conversationId=${response.data.data._id}&targetUserId=${profileUser.id}`);
            } else {
                message.error('Không thể bắt đầu cuộc trò chuyện.');
            }
        } catch (error) {
            console.error('Error initiating conversation:', error.response?.data || error.message);
            message.error('Có lỗi xảy ra khi bắt đầu cuộc trò chuyện.');
        }
    };

    if (authLoading || loadingProfile) {
        return (
            <Content className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Spin size="large" tip="Đang tải thông tin profile..." />
            </Content>
        );
    }

    if (error) {
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    closable
                />
            </Content>
        );
    }

    if (!profileUser) {
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
                <Alert
                    message="Không tìm thấy người dùng"
                    description="Profile của người dùng này không tồn tại hoặc đã bị xóa."
                    type="warning"
                    showIcon
                />
            </Content>
        );
    }

    profileUser.id.toString() === currentUser.id.toString();

    console.log('--- Debugging ProFile.jsx ---');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('currentUser (from AuthContext):', currentUser);
    console.log('profileUser (fetched from API):', profileUser);
    console.log('profileUser.id:', profileUser?.id, ' (Type:', typeof profileUser?.id, ')');
    console.log('currentUser.id:', currentUser?.id, ' (Type:', typeof currentUser?.id, ')');
    console.log('Comparison (profileUser.id.toString() === currentUser.id.toString()):',
        profileUser?.id?.toString() === currentUser?.id?.toString());
    console.log('isMyProfile (final boolean):', isMyProfile);
    console.log('-----------------------------');


    return (
        <Layout className="min-h-screen">
            <Navbar />
            <Content
                className="flex flex-col items-center py-6 px-4 pt-10"
                style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
            >
                {/* Profile Info */}
                <div className="w-full max-w-4xl text-center mt-8 mb-8 px-4">
                    {/* Avatar */}
                    <div className="relative w-fit mx-auto mb-4 group">
                        <Avatar
                            size={120}
                            src={profileUser?.avatar}
                            icon={!profileUser?.avatar && <UserOutlined />}
                            className="border-4"
                            style={{
                                borderColor: isMyProfile ? theme.colors.primary : '#ccc',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }}
                        />

                        {isMyProfile && (
                            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-lg cursor-pointer group-hover:scale-105 transition-transform border" title="Thay ảnh đại diện">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <EditOutlined style={{ fontSize: '18px', color: theme.colors.primary }} />
                            </label>
                        )}
                    </div>
                    <Title level={2} className="mb-1" style={{ color: theme.colors.text }}>
                        {profileUser.username || 'Người dùng'}
                    </Title>
                    <Text type="secondary" style={{ color: theme.colors.text + '80' }}>
                        @{profileUser.username || 'unknown'}
                    </Text>

                    {/* Bio/Tiểu sử */}
                    <div className="mt-4 text-lg flex items-center justify-center text-center" style={{ color: theme.colors.text }}>
                        <p className="mr-2">
                            {profileUser.bio || 'Chưa có tiểu sử.'}
                        </p>
                        {isMyProfile && (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => setIsBioModalVisible(true)}
                                style={{ color: theme.colors.primary }}
                            />
                        )}
                    </div>

                    {!isMyProfile && (
                        <div className="flex flex-col items-center gap-3 mt-4">
                            {/* Nút kết bạn */}
                            <div className="flex gap-2">
                                {!isMyProfile && friendStatus === 'none' && (
                                    <Button type="primary" onClick={handleSendRequest}>Kết bạn</Button>
                                )}
                                {friendStatus === 'sent' && (
                                    <Button disabled>Đã gửi lời mời</Button>
                                )}
                                {friendStatus === 'received' && (
                                    <>
                                        <Button type="primary" onClick={handleAcceptRequest}>Chấp nhận</Button>
                                        <Button danger onClick={handleDeclineRequest}>Từ chối</Button>
                                    </>
                                )}
                                {friendStatus === 'friends' && (
                                    <Button danger onClick={handleUnfriend}>Huỷ kết bạn</Button>
                                )}
                            </div>

                            {/* Nút nhắn tin */}
                            <Button
                                type="primary"
                                icon={<MessageOutlined />}
                                size="large"
                                onClick={handleMessageUser}
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    borderColor: theme.colors.primary,
                                    borderRadius: '8px',
                                }}
                            >
                                Nhắn tin
                            </Button>
                        </div>
                    )}
                </div>

                {/* Left Column: Intro */}
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    <div className="md:col-span-1 space-y-6">
                        <Card
                            title={<span style={{ color: theme.colors.text }}>Giới thiệu</span>}
                            className="shadow-lg rounded-lg"
                            style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.text + '20', color: theme.colors.text }}
                        >
                            <p style={{ color: theme.colors.text }}>
                                {profileUser.intro || 'Chưa có thông tin giới thiệu.'}
                            </p>
                            {isMyProfile && (
                                <Button
                                    type="text"
                                    className="w-full mt-4"
                                    style={{ color: theme.colors.primary }}
                                    onClick={() => message.info('Chức năng chỉnh sửa chi tiết sẽ được phát triển sau.')}
                                >
                                    Chỉnh sửa chi tiết
                                </Button>
                            )}
                        </Card>
                        <Card
                            title={<span style={{ color: theme.colors.text }}>Bạn bè</span>}
                            className="shadow-lg rounded-lg"
                            style={{
                                backgroundColor: theme.colors.cardBackground,
                                borderColor: theme.colors.text + '20',
                                color: theme.colors.text
                            }}
                        >
                            {loadingFriends ? (
                                <Spin />
                            ) : friends.length === 0 ? (
                                <p style={{ color: theme.colors.text }}>Chưa có bạn bè nào.</p>
                            ) : (
                                <ul className="grid grid-cols-2 gap-3 mt-2">
                                    {friends.map((friend) => (
                                        <li
                                            key={friend._id}
                                            className="flex items-center gap-2 p-2 border rounded"
                                            style={{ borderColor: theme.colors.text + '20' }}
                                        >
                                            <Avatar
                                                size={40}
                                                src={friend.avatar}
                                                icon={!friend.avatar && <UserOutlined />}
                                            />
                                            <div>
                                                <p className="font-medium" style={{ color: theme.colors.text }}>
                                                    {friend.username}
                                                </p>
                                                <p className="text-xs" style={{ color: theme.colors.text + '80' }}>
                                                    {formatTimeAgo(friend.createdAt)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Posts */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Create Post Section (only for current user's profile) */}
                        <Title level={4} style={{ color: theme.colors.text }}>Bài viết</Title>
                        {isMyProfile && (
                            <Card
                                className="mb-6 shadow-lg rounded-lg"
                                style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.text + '20', color: theme.colors.text }}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        icon={profileUser.avatar ? null : <UserOutlined />}
                                        src={profileUser.avatar}
                                        style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                    />
                                    <div
                                        className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-opacity-10 transition-colors duration-200 ease-in-out"
                                        onClick={() => navigate('/create-post')}
                                        style={{
                                            backgroundColor: theme.colors.background,
                                            color: theme.colors.text + '80',
                                            minHeight: '44px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '1px solid ' + theme.colors.text + '20',
                                            boxShadow: 'none',
                                        }}
                                    >
                                        Bạn đang nghĩ gì?
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-center items-center gap-6">
                                    <Button
                                        type="text"
                                        icon={<PictureOutlined style={{ fontSize: '20px', color: theme.colors.primary }} />}
                                        onClick={() => navigate('/create-post')}
                                        style={{ color: theme.colors.text }}
                                        className="hover:bg-opacity-10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                                    >
                                        Ảnh/Video
                                    </Button>
                                    <Button
                                        type="text"
                                        icon={<TagOutlined style={{ fontSize: '20px', color: theme.colors.primary }} />}
                                        onClick={() => navigate('/create-post')}
                                        style={{ color: theme.colors.text }}
                                        className="hover:bg-opacity-10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                                    >
                                        Tag tên
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* User Posts */}

                        {loadingPosts ? (
                            <div className="flex justify-center items-center h-48">
                                <Spin size="large" tip="Đang tải bài viết..." />
                            </div>
                        ) : userPosts.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10" style={{ color: theme.colors.text + '80' }}>
                                {isMyProfile ? 'Bạn chưa có bài viết nào. Hãy đăng bài đầu tiên!' : 'Người dùng này chưa có bài viết nào.'}
                            </div>
                        ) : (
                            userPosts.map(post => (
                                <Card
                                    key={post._id}
                                    className="mb-4 shadow-lg rounded-lg"
                                    style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.text + '20', color: theme.colors.text }}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <Avatar
                                            icon={post.user?.avatar ? null : <UserOutlined />}
                                            src={post.user?.avatar}
                                            style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold" style={{ color: theme.colors.text }}>
                                                {post.user ? post.user.username : 'Người dùng ẩn danh'}
                                            </h4>
                                            <p className="text-sm" style={{ color: theme.colors.text + 'B0' }}>
                                                {formatTimeAgo(post.createdAt)}
                                            </p>
                                        </div>
                                        <Dropdown overlay={() => postOptionsMenu(post)} trigger={['click']}>
                                            <Button type="text" icon={<EllipsisOutlined />} style={{ color: theme.colors.text }} />
                                        </Dropdown>
                                    </div>

                                    <p className="mt-2 text-base" style={{ color: theme.colors.text }}>
                                        {post.content}
                                    </p>

                                    {post.images && post.images.length > 0 && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {post.images.map((media, index) => (
                                                media.resource_type === 'video' ? (
                                                    <video key={index} controls src={media.url} />
                                                ) : (
                                                    <Image key={index} src={media.url} />
                                                )
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.text + '20' }}>
                                        <div className="flex justify-around">
                                            <Button
                                                type="text"
                                                icon={<LikeOutlined style={{ color: currentUser && post.reactions.some(r => r.user && r.user._id === currentUser.id) ? theme.colors.primary : theme.colors.text }} />}
                                                onClick={() => handleLikePost(post._id)}
                                                style={{ color: theme.colors.text }}
                                            >
                                                {post.reactions.length > 0 && post.reactions.length} Thích
                                            </Button>
                                            <Button
                                                type="text"
                                                icon={<CommentOutlined style={{ color: theme.colors.text }} />}
                                                onClick={() => handleCommentClick(post)}
                                                style={{ color: theme.colors.text }}
                                            >
                                                {post.comments.length > 0 && post.comments.length} Bình luận
                                            </Button>
                                            <Button
                                                type="text"
                                                icon={<ShareAltOutlined style={{ color: theme.colors.text }} />}
                                                onClick={() => handleShareClick(post)}
                                                style={{ color: theme.colors.text }}
                                            >
                                                Chia sẻ
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <Modal
                    title={<span style={{ color: theme.colors.text }}>Cập nhật Tiểu sử</span>}
                    visible={isBioModalVisible}
                    onCancel={() => setIsBioModalVisible(false)}
                    footer={[
                        <Button key="back" onClick={() => setIsBioModalVisible(false)} style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}>
                            Hủy
                        </Button>,
                        <Button key="submit" type="primary" onClick={handleUpdateBio} style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, color: '#fff' }}>
                            Cập nhật
                        </Button>,
                    ]}
                    style={{ backgroundColor: theme.colors.cardBackground }}
                    bodyStyle={{ backgroundColor: theme.colors.background }}
                    closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                >
                    <TextArea
                        rows={4}
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Viết tiểu sử của bạn tại đây..."
                        maxLength={200}
                        style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }}
                    />
                    <Text type="secondary" className="block text-right mt-2" style={{ color: theme.colors.text + '80' }}>
                        {newBio.length}/200 ký tự
                    </Text>
                </Modal>

                <Modal
                    title={<span style={{ color: theme.colors.text }}>Chỉnh sửa thông tin Profile</span>}
                    visible={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    footer={null}
                    style={{ backgroundColor: theme.colors.cardBackground }}
                    bodyStyle={{ backgroundColor: theme.colors.background }}
                    closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                >
                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleEditSubmit}
                        initialValues={{ username: profileUser?.username, email: profileUser?.email }}
                    >
                        <Form.Item
                            label={<span style={{ color: theme.colors.text }}>Tên người dùng</span>}
                            name="username"
                            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                        >
                            <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                        </Form.Item>
                        <Form.Item
                            label={<span style={{ color: theme.colors.text }}>Email</span>}
                            name="email"
                            rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}
                        >
                            <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, width: '100%', color: '#fff' }}
                            >
                                Cập nhật
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={null}
                    visible={isCommentModalVisible}
                    onCancel={handleCommentModalCancel}
                    footer={null}
                    width="80%"
                    style={{
                        top: 20,
                        padding: 0,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: theme.mode === 'light' ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.5)',
                    }}
                    bodyStyle={{
                        padding: 0,
                        backgroundColor: theme.colors.cardBackground,
                        color: theme.colors.text,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh',
                    }}
                    centered
                    closeIcon={<span style={{ color: theme.colors.text }}><CloseOutlined /></span>}
                >
                    {selectedPost && (
                        <>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <div className="p-6 border-b" style={{ borderColor: theme.colors.text + '20' }}>
                                    <div className="flex items-start gap-4 mb-4">
                                        <Avatar
                                            icon={user?.avatar ? null : <UserOutlined />}
                                            src={user?.avatar || undefined}
                                            style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold" style={{ color: theme.colors.text }}>
                                                {selectedPost.user ? selectedPost.user.username : 'Người dùng ẩn danh'}
                                            </h4>
                                            <p className="text-sm" style={{ color: theme.colors.text + 'B0' }}>
                                                {formatTimeAgo(selectedPost.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-base" style={{ color: theme.colors.text }}>
                                        {selectedPost.content}
                                    </p>

                                    {selectedPost.images && selectedPost.images.length > 0 && (
                                        <div className="mt-4 grid grid-cols-1 gap-2">
                                            {selectedPost.images.map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={`data:${img.contentType};base64,${arrayBufferToBase64(img.data.data)}`}
                                                    alt={`Post image ${index}`}
                                                    className="w-full h-auto rounded-lg object-cover"
                                                    style={{ maxHeight: '400px' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6" style={{ backgroundColor: theme.colors.background }}>
                                    <Title level={4} style={{ color: theme.colors.text, marginBottom: '16px' }}>Bình luận</Title>
                                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                                        selectedPost.comments.map((comment) => (
                                            <div key={comment._id} className="flex items-start gap-3 mb-4">
                                                <Avatar
                                                    icon={comment.user?.avatar ? null : <UserOutlined />}
                                                    src={comment.user?.avatar}
                                                    size="small"
                                                    style={{ backgroundColor: theme.colors.primary }}
                                                />
                                                <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}>
                                                    <p className="font-bold text-sm" style={{ color: theme.colors.text }}>
                                                        {comment.user ? comment.user.username : 'Người dùng ẩn danh'}
                                                    </p>
                                                    <p className="text-sm" style={{ color: theme.colors.text }}>{comment.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1" style={{ color: theme.colors.text + '80' }}>
                                                        {formatTimeAgo(comment.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500" style={{ color: theme.colors.text + '80' }}>
                                            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t" style={{ borderColor: theme.colors.text + '20', backgroundColor: theme.colors.cardBackground }}>
                                <Input.Group compact>
                                    <Input
                                        style={{
                                            width: 'calc(100% - 60px)',
                                            backgroundColor: theme.colors.background,
                                            color: theme.colors.text,
                                            borderColor: theme.colors.text + '20'
                                        }}
                                        placeholder="Viết bình luận..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onPressEnter={handleAddComment}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleAddComment}
                                        loading={submittingComment}
                                        style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
                                    />
                                </Input.Group>
                            </div>
                        </>
                    )}
                </Modal>
            </Content>
        </Layout>
    );
}
export default ProFile;
