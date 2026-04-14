import React, { useContext, useEffect, useState } from 'react';
import { Layout, Typography, Button, List, Avatar, Spin, message } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

function ThongBao() {
  const { theme } = useContext(ThemeContext);
  const { user, isAuthenticated, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Xử lý quay lại trang trước
  const handleGoBack = () => {
    navigate('/');
  };

  // Tải danh sách lời mời kết bạn
  const fetchFriendRequests = async () => {
    // Kiểm tra xác thực và user ID trước khi gửi yêu cầu
    if (!isAuthenticated || !user || !user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setFriendRequests(response.data.data); // Cập nhật danh sách lời mời
      } else {
        message.error(response.data.message || 'Không thể tải lời mời kết bạn.');
      }
    } catch (error) {
      message.error('Lỗi khi tải lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Gọi hàm tải lời mời khi component được mount hoặc user/token thay đổi
  useEffect(() => {
    fetchFriendRequests();
  }, [user, isAuthenticated, token]);

  // Xử lý chấp nhận lời mời kết bạn
  const handleAcceptRequest = async (senderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${senderId}/accept-friend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        message.success('Đã chấp nhận lời mời kết bạn!');
        // Cập nhật lại danh sách lời mời sau khi chấp nhận
        setFriendRequests(prevRequests => prevRequests.filter(req => req._id !== senderId));
      } else {
        message.error(response.data.message || 'Không thể chấp nhận lời mời.');
      }
    } catch (error) {
      message.error('Lỗi khi chấp nhận lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  // Xử lý từ chối lời mời kết bạn
  const handleRejectRequest = async (senderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${senderId}/decline-friend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        message.success('Đã từ chối lời mời kết bạn.');
        // Cập nhật lại danh sách lời mời sau khi từ chối
        setFriendRequests(prevRequests => prevRequests.filter(req => req._id !== senderId));
      } else {
        message.error(response.data.message || 'Không thể từ chối lời mời.');
      }
    } catch (error) {
      message.error('Lỗi khi từ chối lời mời: ' + (error.response?.data?.message || error.message));
    }
  };

  // Hiển thị trạng thái tải
  if (loading) {
    return (
      <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <Spin size="large" tip="Đang tải thông báo..." />
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Navbar />
      <Content className="flex flex-col items-center justify-center p-6 flex-1">
        <div
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl text-center"
          style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, borderWidth: '1px' }}
        >
          {friendRequests.length > 0 ? (
            <>
              <Title level={3} style={{ color: theme.colors.text }}>Lời mời kết bạn</Title>
              <List
                itemLayout="horizontal"
                dataSource={friendRequests}
                renderItem={(request) => (
                  <List.Item
                    actions={[
                      <Button
                        key="accept"
                        type="primary"
                        onClick={() => handleAcceptRequest(request._id)}
                        style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
                      >
                        Chấp nhận
                      </Button>,
                      <Button
                        key="reject"
                        type="default"
                        onClick={() => handleRejectRequest(request._id)}
                        style={{ color: theme.colors.text, borderColor: theme.colors.text + '20' }}
                      >
                        Từ chối
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={request.avatar} icon={!request.avatar && <UserOutlined />} style={{ backgroundColor: theme.colors.primary }} />}
                      title={<span style={{ color: theme.colors.text }}>{request.username || 'Người dùng ẩn danh'}</span>}
                      description={<Text style={{ color: theme.colors.text + 'B0' }}>Đã gửi lời mời kết bạn</Text>}
                    />
                  </List.Item>
                )}
              />
            </>
          ) : (
            <>
              <Title level={3} style={{ color: theme.colors.text }}>Chưa có thông báo nào</Title>
              <p style={{ color: theme.colors.text + 'B0' }}>Tất cả thông báo của bạn sẽ xuất hiện ở đây.</p>
              <Button
                type="primary"
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                className="mt-6"
                style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
              >
                Quay lại Trang chủ
              </Button>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default ThongBao;