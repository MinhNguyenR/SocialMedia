import React, { createContext, useState, useEffect, useContext } from 'react';
import { Card, Button, Space, Typography, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SettingOutlined, LockOutlined, UserOutlined as UserSettingOutlined } from '@ant-design/icons';
import Navbar from '../ChucNang/Navbar'; 

const { Title } = Typography;
const { Content } = Layout;

export const ThemeContext = createContext();

const defaultColors = {
  background: '#FFFFFF',
  primary: '#1890ff',
  text: '#333333',
  siderBackground: '#FFFFFF',
};

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme ? JSON.parse(savedTheme) : { mode: 'light', colors: defaultColors };
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('appTheme', JSON.stringify(theme));
  }, [theme]);

  const toggleThemeMode = () => {
    setTheme(prevTheme => ({
      ...prevTheme,
      mode: prevTheme.mode === 'light' ? 'dark' : 'light',
      colors: prevTheme.mode === 'light' ? {
        background: '#1A202C',
        primary: '#60A5FA',
        text: '#E2E8F0',
        siderBackground: '#2D3748',
      } : defaultColors,
    }));
  };

  const updateCustomColor = (key, color) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      colors: {
        ...prevTheme.colors,
        [key]: color,
      },
    }));
  };

  const contextValue = {
    theme,
    toggleThemeMode,
    updateCustomColor,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

function Setting() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Navbar /> {/* Render Navbar here */}
      <Content className="flex flex-col items-center justify-center p-6 flex-1">
        <Card
          title={<span style={{ color: theme.colors.text }}>Cài đặt</span>}
          className="shadow-lg rounded-lg w-full max-w-md"
          style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
        >
          <Space direction="vertical" size="large" className="w-full">
            <Button
              type="default"
              size="large"
              className="w-full text-left"
              icon={<SettingOutlined style={{ color: theme.colors.primary }} />}
              onClick={() => navigate('/settings/theme')}
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.text + '40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '16px'
              }}
            >
              Cài đặt Giao diện
            </Button>
            <Button
              type="default"
              size="large"
              className="w-full text-left"
              icon={<LockOutlined style={{ color: theme.colors.primary }} />}
              onClick={() => navigate('/settings/privacy')}
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.text + '40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '16px'
              }}
            >
              Quyền riêng tư
            </Button>
            <Button
              type="default"
              size="large"
              className="w-full text-left"
              icon={<UserSettingOutlined style={{ color: theme.colors.primary }} />}
              onClick={() => navigate('/settings/account')}
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.text + '40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '16px'
              }}
            >
              Tài khoản
            </Button>
          </Space>

          <div className="mt-6 flex justify-end">
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}
            >
              Quay lại Trang chủ
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default Setting;
