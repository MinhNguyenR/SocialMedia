import React, { useContext, useState, useEffect } from 'react';
import { Layout, Input, Button, Avatar, Card, Menu, Dropdown, Image, Modal, message, Spin, Typography, Badge } from 'antd';
import {
    UserOutlined,
    SettingOutlined,
    UsergroupAddOutlined,
    ShopOutlined,
    PictureOutlined,
    TagOutlined,
    BellOutlined,
    MessageOutlined,
    EllipsisOutlined,
    DeleteOutlined,
    LikeOutlined,
    CommentOutlined,
    ShareAltOutlined,
    SendOutlined,
    CloseOutlined,
    UserAddOutlined, 
    CheckOutlined   
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../ChucNang/Navbar.jsx';
import { ThemeContext } from '../Setting/Setting.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE_URL = 'http://localhost:5000';

function TrangChu() {
    const { theme } = useContext(ThemeContext);
    const { user, isAuthenticated, loading: authLoading, token } = useContext(AuthContext); // Lấy token từ AuthContext
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [sentRequests, setSentRequests] = useState([]); // Theo dõi các ID đã gửi lời mời

    // Hàm fetch bài viết từ backend
    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/posts`);
            if (response.data.success) {
                setPosts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching posts:', error.response?.data || error.message);
            message.error('Không thể tải bài viết. Vui lòng thử lại.');
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchFriendSuggestions = async () => {
        if (!isAuthenticated) return;
        setLoadingSuggestions(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/suggestions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSuggestedUsers(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy gợi ý kết bạn:', error.response?.data || error.message);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const fetchUnreadMessageCount = async () => {
        if (!isAuthenticated || !token) {
            setUnreadMessageCount(0);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/messages/unread/count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setUnreadMessageCount(response.data.count);
            } else {
                setUnreadMessageCount(0);
            }
        } catch (error) {
            console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error.response?.data || error.message);
            setUnreadMessageCount(0);
        }
    };

    useEffect(() => {
        fetchPosts();
        if (isAuthenticated) {
            fetchUnreadMessageCount();
            fetchFriendSuggestions(); // Gọi hàm fetch gợi ý
            const interval = setInterval(fetchUnreadMessageCount, 30000);
            return () => clearInterval(interval);
        } else {
            setUnreadMessageCount(0);
        }
    }, [isAuthenticated, user, token]);

    const handleSendFriendRequest = async (targetUserId) => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để kết bạn.');
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/${targetUserId}/friend-request`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Đã gửi lời mời kết bạn!');
                // Thêm ID vào danh sách đã gửi để cập nhật UI
                setSentRequests(prev => [...prev, targetUserId]);
            } else {
                message.error(response.data.message || 'Gửi lời mời thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi gửi lời mời kết bạn:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra.');
        }
    };


    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 10) return "vừa xong";
        if (seconds < 60) return `${seconds} giây trước`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;

        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDeletePost = async (postId) => {
        console.log('handleDeletePost called for postId:', postId);
        Modal.confirm({
            title: 'Xác nhận xóa bài viết',
            content: 'Bạn có chắc chắn muốn xóa bài viết này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setDeletingPostId(postId);
                try {
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
                        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
                    } else {
                        message.error(response.data.message || 'Xóa bài viết thất bại.');
                    }
                } catch (error) {
                    console.error('Error deleting post:', error.response?.data || error.message);
                    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa bài viết.');
                } finally {
                    setDeletingPostId(null);
                }
            },
        });
    };

    const handleLikePost = async (postId) => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để thích bài viết.');
            navigate('/login');
            return;
        }

        try {
            const response = await axios.put(`${API_BASE_URL}/api/posts/${postId}/react`, { type: 'like' }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setPosts(prevPosts =>
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
            const response = await axios.post(`${API_BASE_URL}/api/posts/${selectedPost._id}/comment`, { text: commentText }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                message.success('Bình luận đã được thêm!');
                console.log('Dữ liệu bình luận mới từ backend:', response.data.data);

                setPosts(prevPosts => {
                    const updatedPosts = prevPosts.map(post =>
                        post._id === selectedPost._id
                            ? {
                                ...post,
                                comments: [...post.comments, response.data.data]
                            }
                            : post
                    );
                    return updatedPosts;
                });
                setSelectedPost(prevPost => {
                    const updatedSelectedPost = {
                        ...prevPost,
                        comments: [...prevPost.comments, response.data.data]
                    };
                    return updatedSelectedPost;
                });

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

    const postOptionsMenu = (post) => {
        const isOwner = user && post.user && user.id === post.user._id;
        console.log(`Post ID: ${post._id}, Current User ID: ${user ? user.id : 'N/A'}, Post Owner ID: ${post.user ? post.user._id : 'N/A'}, Is Owner: ${isOwner}`);
        return (
            <Menu>
                {isOwner && (
                    <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={() => handleDeletePost(post._id)} danger>
                        Xóa bài viết
                    </Menu.Item>
                )}
            </Menu>
        );
    };

    const menuItems = [
        {
            key: 'friends',
            icon: <UserOutlined style={{ color: theme.colors.text }} />,
            label: <Link to="/friends" style={{ color: theme.colors.text }}>Bạn bè</Link>,
            className: 'hover:bg-opacity-10 rounded-lg transition-colors duration-200 ease-in-out'
        },
        {
            key: 'groups',
            icon: <UsergroupAddOutlined style={{ color: theme.colors.text }} />,
            label: <Link to="/groups" style={{ color: theme.colors.text }}>Nhóm</Link>,
            className: 'hover:bg-opacity-10 rounded-lg transition-colors duration-200 ease-in-out'
        },
        {
            key: 'marketplace',
            icon: <ShopOutlined style={{ color: theme.colors.text }} />,
            label: <Link to="/marketplace" style={{ color: theme.colors.text }}>Cửa hàng</Link>,
            className: 'hover:bg-opacity-10 rounded-lg transition-colors duration-200 ease-in-out'
        },
        {
            key: 'settings',
            icon: <SettingOutlined style={{ color: theme.colors.text }} />,
            label: <Link to="/settings" style={{ color: theme.colors.text }}>Cài đặt</Link>,
            className: 'hover:bg-opacity-10 rounded-lg transition-colors duration-200 ease-in-out'
        },
    ];

    const handleCreatePostClick = () => {
        navigate('/create-post');
    };

    const handleNotificationClick = () => {
        navigate('/notifications');
    };

    const handleMessageClick = () => {
        navigate('/messages');
    };

    const commonCardShadow = theme.mode === 'light' ? '0 8px 20px rgba(0,0,0,0.08)' : '0 8px 20px rgba(0,0,0,0.3)';

    if (authLoading) {
        return (
            <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Spin size="large" tip="Đang tải xác thực..." />
            </Layout>
        );
    }

    return (
        <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
            <Navbar />

            <Layout className="pt-16">
                <Sider width={200} className="p-4"
                    style={{
                        backgroundColor: theme.colors.siderBackground,
                        color: theme.colors.text,
                        borderRadius: '0 16px 16px 0',
                        boxShadow: commonCardShadow,
                        transition: 'all 0.3s ease-in-out'
                    }}>
                    <Menu
                        mode="vertical"
                        items={menuItems}
                        style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
                        className="custom-menu-styles"
                    />
                </Sider>

                <Content className="p-6" style={{ backgroundColor: theme.colors.background }}>
                    <div className="max-w-3xl mx-auto">
                        {isAuthenticated ? (
                            <>
                                <Card
                                    className="mb-6 transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-[1.01]"
                                    style={{
                                        backgroundColor: theme.colors.siderBackground,
                                        color: theme.colors.text,
                                        borderRadius: '16px',
                                        boxShadow: commonCardShadow,
                                        border: 'none'
                                    }}>
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            icon={user?.avatar ? null : <UserOutlined />}
                                            src={user?.avatar || undefined}
                                            style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                        />
                                        <div
                                            className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-opacity-10 transition-colors duration-200 ease-in-out"
                                            onClick={handleCreatePostClick}
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
                                            onClick={handleCreatePostClick}
                                            style={{ color: theme.colors.text }}
                                            className="hover:bg-opacity-10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                                        >
                                            Ảnh/Video
                                        </Button>
                                        <Button
                                            type="text"
                                            icon={<TagOutlined style={{ fontSize: '20px', color: theme.colors.primary }} />}
                                            onClick={handleCreatePostClick}
                                            style={{ color: theme.colors.text }}
                                            className="hover:bg-opacity-10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                                        >
                                            Tag tên
                                        </Button>
                                        <Button
                                            type="primary"
                                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, borderRadius: '10px' }}
                                            className="hover:opacity-80 transition-opacity duration-200 ease-in-out transform hover:scale-[1.01]"
                                            onClick={handleCreatePostClick}
                                        >
                                            Đăng bài
                                        </Button>
                                    </div>
                                </Card>

                                {loadingPosts ? (
                                    <div className="flex justify-center items-center h-48">
                                        <Spin size="large" tip="Đang tải bài viết..." />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10" style={{ color: theme.colors.text + '80' }}>
                                        Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <Card
                                            key={post._id}
                                            className="mb-4 transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-[1.01]"
                                            style={{
                                                backgroundColor: theme.colors.siderBackground,
                                                color: theme.colors.text,
                                                borderRadius: '16px',
                                                boxShadow: commonCardShadow,
                                                border: 'none'
                                            }}
                                            loading={deletingPostId === post._id}
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <Link to={`/profile/${post.user?._id}`} className="flex items-center gap-4"
                                                    onClick={() => console.log("Navigating to profile from post:", `/profile/${post.user?._id}`)}>
                                                    <Avatar
                                                        icon={post.user?.avatar ? null : <UserOutlined />}
                                                        src={post.user?.avatar}
                                                        style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                                    />
                                                    <div className="flex-1 flex flex-col">
                                                        <h4 className="font-bold" style={{ color: theme.colors.text }}>
                                                            {post.user ? post.user.username : 'Người dùng ẩn danh'}
                                                        </h4>
                                                        <p className="text-xs" style={{ color: theme.colors.text + 'B0' }}>
                                                            {formatTimeAgo(post.createdAt)}
                                                        </p>
                                                    </div>
                                                </Link>
                                                <Dropdown overlay={() => postOptionsMenu(post)} trigger={['click']}>
                                                    <Button type="text" icon={<EllipsisOutlined />} style={{ color: theme.colors.text }} />
                                                </Dropdown>
                                            </div>

                                            <p className="mt-2 text-base" style={{ color: theme.colors.text }}>
                                                {post.content}
                                            </p>

                                            {post.images && post.images.length > 0 && (
                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {post.images?.map((media, index) =>
                                                        media.resource_type === 'video' ? (
                                                            <video
                                                                key={index}
                                                                controls
                                                                src={media.url}
                                                                style={{ maxWidth: '100%', borderRadius: '10px', margin: '10px 0' }}
                                                            />
                                                        ) : (
                                                            <Image
                                                                key={index}
                                                                src={media.url}
                                                                alt={`media-${index}`}
                                                                style={{ maxWidth: '100%', borderRadius: '10px', margin: '10px 0' }}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.text + '20' }}>
                                                <div className="flex justify-around">
                                                    <Button
                                                        type="text"
                                                        icon={<LikeOutlined style={{ color: user && post.reactions.some(r => r.user && r.user._id === user.id) ? theme.colors.primary : theme.colors.text }} />}
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
                            </>
                        ) : (
                           <div className="text-center mt-20 p-4">
                                <Title level={2} style={{ color: theme.colors.text }}>Chào mừng bạn đến với MXH!</Title>
                                <p className="text-lg mb-8" style={{ color: theme.colors.text + '80' }}>
                                    Vui lòng đăng nhập hoặc tạo tài khoản để khám phá thêm các bài viết và tính năng tương tác.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Link to="/login">
                                        <Button
                                            type="primary"
                                            size="large"
                                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, borderRadius: '10px' }}
                                        >
                                            Đăng nhập
                                        </Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button
                                            type="default"
                                            size="large"
                                            style={{
                                                backgroundColor: theme.colors.background,
                                                color: theme.colors.primary,
                                                borderColor: theme.colors.primary,
                                                borderRadius: '10px'
                                            }}
                                        >
                                            Tạo tài khoản
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </Content>

                {isAuthenticated && (
                    <Sider width={300} className="p-4"
                        style={{
                            backgroundColor: theme.colors.siderBackground,
                            color: theme.colors.text,
                            borderRadius: '16px 0 0 16px',
                            boxShadow: commonCardShadow,
                            transition: 'all 0.3s ease-in-out'
                        }}>
                        <Card
                            title={<span style={{ color: theme.colors.text }}>Tiện ích</span>}
                            className="mb-4 transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-[1.01]"
                            style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderRadius: '16px',
                                boxShadow: commonCardShadow,
                                border: 'none'
                            }}>
                            <div className="space-y-4">
                                <div
                                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-opacity-10 transition-colors duration-200 ease-in-out transform hover:scale-[1.01]"
                                    onClick={handleNotificationClick}
                                    style={{ color: theme.colors.text, backgroundColor: theme.colors.background }}
                                >
                                    <BellOutlined style={{ color: theme.colors.text }} />
                                    <span style={{ color: theme.colors.text }}>Thông báo mới</span>
                                </div>
                                <div
                                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-opacity-10 transition-colors duration-200 ease-in-out transform hover:scale-[1.01]"
                                    onClick={handleMessageClick}
                                    style={{ color: theme.colors.text, backgroundColor: theme.colors.background }}
                                >
                                    <MessageOutlined style={{ color: theme.colors.text }} />
                                    <span style={{ color: theme.colors.text }}>Tin nhắn chưa đọc</span>
                                    {unreadMessageCount > 0 && (
                                        <Badge
                                            count={unreadMessageCount}
                                            size="small"
                                            offset={[5, -5]}
                                            style={{
                                                backgroundColor: '#1890ff',
                                                color: '#fff',
                                                marginLeft: '8px'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* --- PHẦN GỢI Ý KẾT BẠN ĐÃ ĐƯỢC CẬP NHẬT --- */}
                        <Card
                            title={<span style={{ color: theme.colors.text }}>Gợi ý kết bạn</span>}
                            className="mb-4 transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-[1.01]"
                            style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderRadius: '16px',
                                boxShadow: commonCardShadow,
                                border: 'none'
                            }}>
                            {loadingSuggestions ? (
                                <div className="flex justify-center items-center h-24">
                                    <Spin />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {suggestedUsers.length > 0 ? (
                                        suggestedUsers.map((suggestedUser) => (
                                            <div key={suggestedUser._id} className="flex items-center justify-between gap-2">
                                                <Link to={`/profile/${suggestedUser._id}`} className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                                                    <Avatar 
                                                        src={suggestedUser.avatar} 
                                                        icon={<UserOutlined />} 
                                                        style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }} 
                                                    />
                                                    <p className="font-medium" style={{ color: theme.colors.text }}>
                                                        {suggestedUser.username}
                                                    </p>
                                                </Link>
                                                
                                                {sentRequests.includes(suggestedUser._id) ? (
                                                    <Button
                                                        size="small"
                                                        type="default"
                                                        icon={<CheckOutlined />}
                                                        disabled
                                                        style={{ borderRadius: '10px' }}
                                                    >
                                                        Đã gửi
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        icon={<UserAddOutlined />}
                                                        style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, borderRadius: '10px' }}
                                                        className="hover:opacity-80 transition-opacity duration-200 ease-in-out transform hover:scale-[1.01]"
                                                        onClick={() => handleSendFriendRequest(suggestedUser._id)}
                                                    >
                                                        Kết bạn
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <Text style={{ color: theme.colors.text + '80' }}>Không có gợi ý nào.</Text>
                                    )}
                                </div>
                            )}
                        </Card>
                    </Sider>
                )}
            </Layout>
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
                                    <Link to={`/profile/${selectedPost.user?._id}`} className="flex items-center gap-4"
                                        onClick={() => console.log("Navigating to profile from comment modal:", `/profile/${selectedPost.user?._id}`)}>
                                        <Avatar
                                            icon={user?.avatar ? null : <UserOutlined />}
                                            src={user?.avatar || undefined}
                                            style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                                        />
                                        <div className="flex-1 flex flex-col">
                                            <h4 className="font-bold" style={{ color: theme.colors.text }}>
                                                {selectedPost.user ? selectedPost.user.username : 'Người dùng ẩn danh'}
                                            </h4>
                                            <p className="text-xs" style={{ color: theme.colors.text + 'B0' }}>
                                                {formatTimeAgo(selectedPost.createdAt)}
                                            </p>
                                        </div>
                                    </Link>
                                    <Dropdown overlay={() => postOptionsMenu(selectedPost)} trigger={['click']}>
                                        <Button type="text" icon={<EllipsisOutlined />} style={{ color: theme.colors.text }} />
                                    </Dropdown>
                                </div>
                                <p className="mt-2 text-base" style={{ color: theme.colors.text }}>
                                    {selectedPost.content}
                                </p>
                                {selectedPost.images && selectedPost.images.length > 0 && (
                                    <div className="mt-4 grid grid-cols-1 gap-2">
                                        {selectedPost.images.map((media, index) => (
                                            media.resource_type === 'video' ? (
                                                <video key={index} src={media.url} controls />
                                            ) : (
                                                <Image key={index} src={media.url} />
                                            )

                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6" style={{ backgroundColor: theme.colors.background }}>
                                <Title level={4} style={{ color: theme.colors.text, marginBottom: '16px' }}>Bình luận</Title>
                                {console.log('Comments array being rendered:', selectedPost.comments)}
                                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                                    selectedPost.comments.map((comment) => (
                                        <div
                                            key={comment._id}
                                            className={`flex mb-4 justify-start`}
                                        >
                                            <div className={`flex items-start gap-3 max-w-[80%] flex-row`}>
                                                <Link to={`/profile/${comment.user?._id}`} style={{ textDecoration: 'none' }}>
                                                    <Avatar
                                                        icon={comment.user?.avatar ? null : <UserOutlined />}
                                                        size="default"
                                                        src={comment.user?.avatar}
                                                        style={{ backgroundColor: theme.colors.primary }}
                                                    />
                                                </Link>
                                                <div
                                                    className={`p-3 rounded-xl`}
                                                    style={{
                                                        backgroundColor: theme.colors.cardBackground,
                                                        color: theme.colors.text,
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Link to={`/profile/${comment.user?._id}`} style={{ textDecoration: 'none' }}>
                                                            <p className="font-bold text-sm" style={{ color: theme.colors.text }}>
                                                                {comment.user ? comment.user.username : 'Người dùng ẩn danh'}
                                                                {comment.user?._id === user?.id && <span className="ml-1 text-xs" style={{ color: theme.colors.primary }}> (Bạn)</span>}
                                                            </p>
                                                        </Link>
                                                        <p className="text-xs ml-2" style={{ color: theme.colors.text + '80' }}>
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm" style={{ color: theme.colors.text }}>{comment.text}</p>
                                                </div>
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
        </Layout>
    );
}

export default TrangChu;