import React, { useContext } from 'react';
import { Layout, Card, Switch, ColorPicker, Space, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';

const { Content } = Layout;
const { Title, Text } = Typography;

function GiaoDien() {
  const { theme, toggleThemeMode, updateCustomColor } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleColorChange = (key, color) => {
    updateCustomColor(key, color.toHexString());
  };

  const handleGoBack = () => {
    navigate('/settings');
  };

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Navbar />
      <Content className="flex flex-col items-center justify-center p-6 flex-1">
        <Card
          title={<span style={{ color: theme.colors.text }}>Cài đặt Giao diện</span>}
          className="shadow-lg rounded-lg w-full max-w-2xl"
          style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
        >
          <Space direction="vertical" size="large" className="w-full">
            <div className="flex items-center justify-between">
              <Title level={4} className="mb-0" style={{ color: theme.colors.text }}>Chế độ Sáng/Tối</Title>
              <Switch
                checked={theme.mode === 'dark'}
                onChange={toggleThemeMode}
                checkedChildren="Tối"
                unCheckedChildren="Sáng"
              />
            </div>

            <Title level={4} className="mt-6 mb-4" style={{ color: theme.colors.text }}>Tùy chỉnh Màu sắc</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-3 border rounded-md" style={{ borderColor: theme.colors.text + '40' }}>
                <Text strong style={{ color: theme.colors.text }}>Màu nền chính</Text>
                <ColorPicker
                  value={theme.colors.background}
                  onChange={(color) => handleColorChange('background', color)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md" style={{ borderColor: theme.colors.text + '40' }}>
                <Text strong style={{ color: theme.colors.text }}>Màu chính</Text>
                <ColorPicker
                  value={theme.colors.primary}
                  onChange={(color) => handleColorChange('primary', color)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md" style={{ borderColor: theme.colors.text + '40' }}>
                <Text strong style={{ color: theme.colors.text }}>Màu chữ</Text>
                <ColorPicker
                  value={theme.colors.text}
                  onChange={(color) => handleColorChange('text', color)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md" style={{ borderColor: theme.colors.text + '40' }}>
                <Text strong style={{ color: theme.colors.text }}>Màu nền Sidebar</Text>
                <ColorPicker
                  value={theme.colors.siderBackground}
                  onChange={(color) => handleColorChange('siderBackground', color)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}
              >
                Quay lại Cài đặt
              </Button>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

export default GiaoDien;
