import React, { useContext, useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, Avatar, List, Typography, Badge } from 'antd'; // Thêm Badge
import {
  HomeOutlined,
  MessageOutlined,
  BellOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../Setting/Setting.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const { Header } = Layout;
const { Search } = Input;
const { Text } = Typography;

const API_BASE_URL = 'http://localhost:5000';

function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); // State cho số tin nhắn chưa đọc

  const handleHomeClick = () => {
    navigate(isAuthenticated ? '/home' : '/');
  };

  const handleMessageClick = () => {
    navigate('/messages');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const isActive = (path) => {
    if (isAuthenticated && path === '/') {
      return location.pathname === '/home';
    }
    return location.pathname === path;
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSearchResults(value);
      }, 500); 
    } else {
      setSearchResults([]); 
    }
  };

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/search?username=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error.response?.data || error.message);
      setSearchResults([]);
    }
  };

  const handleUserSearchResultClick = (userId) => {
    setShowSuggestions(false);
    setSearchTerm('');
    navigate(`/profile/${userId}`);
  };

  // Hàm để lấy số tin nhắn chưa đọc
  const fetchUnreadMessageCount = async () => {
      if (!isAuthenticated || !currentUser) { // Chỉ fetch nếu đã xác thực
          setUnreadMessageCount(0);
          return;
      }
      try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_BASE_URL}/api/messages/unread/count`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
              // response.data.count có thể là số hoặc chuỗi "9+"
              // Nếu là chuỗi "9+", vẫn hiển thị như vậy
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
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
      // Gọi hàm lấy số tin nhắn chưa đọc khi component mount hoặc trạng thái xác thực thay đổi
      if (isAuthenticated) {
          fetchUnreadMessageCount();
          // Thiết lập polling để cập nhật số lượng định kỳ (ví dụ: mỗi 30 giây)
          const interval = setInterval(fetchUnreadMessageCount, 30000); 
          // Dọn dẹp interval khi component unmount
          return () => clearInterval(interval);
      } else {
          setUnreadMessageCount(0); // Đặt lại về 0 khi không đăng nhập
      }
  }, [isAuthenticated, currentUser]); // Phụ thuộc vào isAuthenticated và currentUser để fetch lại

  return (
    <>
      <Header
        className="shadow-sm flex items-center justify-between px-6 fixed top-0 w-full z-50"
        style={{
          backgroundColor: theme.colors.background,
          boxShadow: theme.mode === 'light' ? '0 2px 10px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.2)',
          borderRadius: '0',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <div className="flex items-center flex-1 relative" ref={searchRef}>
          <div className="text-2xl font-bold mr-4" style={{ color: theme.colors.primary }}>
            MXH
          </div>

          <Input
            placeholder="Tìm kiếm bạn bè, bài viết..."
            className="rounded-lg w-[180px]"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              border: '1px solid ' + theme.colors.text + '20',
              boxShadow: 'none',
            }}
            prefix={<SearchOutlined style={{ color: theme.colors.text + '80' }} />}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            value={searchTerm}
            onChange={handleSearchChange}
          />

          {showSuggestions && (
            <div
              className="absolute top-full left-[80px] mt-2 w-[180px] rounded-lg shadow-lg overflow-hidden"
              style={{
                backgroundColor: theme.colors.siderBackground,
                color: theme.colors.text,
                zIndex: 100,
                border: '1px solid ' + theme.colors.text + '20',
              }}
            >
              {searchResults.length > 0 ? (
                <List
                  dataSource={searchResults}
                  renderItem={(user) => (
                    <List.Item
                      key={user._id}
                      className="cursor-pointer hover:bg-opacity-10 px-4 py-2 transition-colors duration-200"
                      style={{
                        borderColor: 'transparent',
                      }}
                      onClick={() => handleUserSearchResultClick(user._id)}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                        title={<Text style={{ color: theme.colors.text }}>{user.username}</Text>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-sm p-4 text-center" style={{ color: theme.colors.text + '80' }}>
                  {!searchTerm ? 'Nhập để tìm kiếm người dùng...' : 'Không có kết quả tìm kiếm.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-16">
          <div
            className={`flex flex-col items-center justify-center relative pb-2 transition-all duration-200 ease-in-out cursor-pointer
              ${isActive('/') ? 'border-b-2' : ''}`}
            style={{
              borderColor: isActive('/') ? theme.colors.primary : 'transparent',
              boxShadow: 'none',
            }}
            onClick={handleHomeClick}
          >
            <Button
              type="text"
              icon={<HomeOutlined style={{ fontSize: '24px', color: theme.colors.text }} />}
              onClick={handleHomeClick}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>

          <div
            className={`flex flex-col items-center justify-center relative pb-2 transition-all duration-200 ease-in-out cursor-pointer
              ${isActive('/messages') ? 'border-b-2' : ''}`}
            style={{
              borderColor: isActive('/messages') ? theme.colors.primary : 'transparent',
              boxShadow: 'none',
            }}
          >
            {/* BADGE SỐ TIN NHẮN CHƯA ĐỌC */}
            {isAuthenticated && unreadMessageCount > 0 ? ( // Chỉ hiển thị badge nếu có tin nhắn và đã đăng nhập
              <Badge count={unreadMessageCount} size="small" offset={[5, -5]} style={{ backgroundColor: '#1890ff' }}>
                  <Button
                  type="text"
                  icon={<MessageOutlined style={{ fontSize: '24px', color: theme.colors.text }} />}
                  onClick={handleMessageClick}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
              </Badge>
            ) : (
                <Button
                type="text"
                icon={<MessageOutlined style={{ fontSize: '24px', color: theme.colors.text }} />}
                onClick={handleMessageClick}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
            )}
          </div>

          <div
            className={`flex flex-col items-center justify-center relative pb-2 transition-all duration-200 ease-in-out cursor-pointer
              ${isActive('/notifications') ? 'border-b-2' : ''}`}
            style={{
              borderColor: isActive('/notifications') ? theme.colors.primary : 'transparent',
              boxShadow: 'none',
            }}
          >
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: '24px', color: theme.colors.text }} />}
              onClick={handleNotificationClick}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 justify-end flex-1">
          {isAuthenticated ? (
            <>
              <Avatar
                size={40}
                icon={currentUser?.avatar ? null : <UserOutlined />}
                src={currentUser?.avatar}
                className="cursor-pointer"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: 'none',
                }}
                onClick={handleProfileClick}
              />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mr-4 px-4 py-2 rounded-md transition-all duration-200 ease-in-out hover:bg-opacity-10"
                style={{
                  color: theme.colors.primary,
                  border: 'none',
                  backgroundColor: 'transparent',
                }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md transition-all duration-200 ease-in-out hover:bg-opacity-10"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.primary,
                  border: 'none',
                }}
              >
                Tạo tài khoản
              </Link>
            </>
          )}
        </div>
      </Header>
    </>
  );
}

export default Navbar;
