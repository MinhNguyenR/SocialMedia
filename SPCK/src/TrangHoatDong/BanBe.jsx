import React, { useContext, useState, useEffect } from 'react';
import { Layout, Typography, Button, Card, Spin, Alert, Avatar } from 'antd'; // Import Spin, Alert, Avatar
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'; // Import UserOutlined
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography; // Import Text

const API_BASE_URL = 'http://localhost:5000'; // Define your API base URL

function BanBe() {
  const { theme } = useContext(ThemeContext);
  const {isAuthenticated } = useContext(AuthContext); 
  const { user: authUser, token, setUser: setAuthUser } = useContext(AuthContext);// Get authUser, token, isAuthenticated from AuthContext
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState(null);

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
                    setFriends(res.data.data || []); 
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

  const handleGoBack = () => {
    navigate('/');
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


  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <Navbar />

      <Content className="flex flex-col items-center justify-center p-6 flex-1 relative">
        <div className="absolute top-6 right-6 flex gap-4">
          <Button
            type="default"
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}
          >
            Quay lại Trang chủ
          </Button>
        </div>

        <div
          className="flex flex-col items-center w-full max-w-md p-8 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
        >
          <Title level={3} style={{ color: theme.colors.text }}>Bạn bè của bạn</Title>

          {loadingFriends ? (
            <Spin size="large" tip="Đang tải danh sách bạn bè..." />
          ) : error ? (
            <Alert
              message="Lỗi"
              description={error}
              type="error"
              showIcon
              closable
              className="w-full mt-4"
            />
          ) : friends.length === 0 ? (
            <Paragraph style={{ color: theme.colors.text + 'B0' }}>
              Bạn chưa có bạn bè nào.
            </Paragraph>
          ) : (
            <ul className="w-full mt-4 space-y-4">
              {friends.map((friend) => (
                <Card
                  key={friend._id}
                  className="shadow-md rounded-lg text-left"
                  style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.text + '20' }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      size={50}
                      src={friend.avatar}
                      icon={!friend.avatar && <UserOutlined />}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div>
                      <Title level={5} style={{ color: theme.colors.text, marginBottom: 0 }}>
                        {friend.username}
                      </Title>
                      <Text type="secondary" style={{ color: theme.colors.text + '80' }}>
                        {formatTimeAgo(friend.createdAt)}
                      </Text>
                    </div>
                  </div>
                  <Button
                    type="link"
                    onClick={() => navigate(`/profile/${friend._id}`)}
                    style={{ color: theme.colors.primary, marginTop: '8px' }}
                  >
                    Xem Profile
                  </Button>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default BanBe;