import React, { useContext } from 'react';
import { Layout, Typography, Button, Card } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

function Nhom() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleCreateGroup = () => {
    navigate('/groups/add'); // Đã thêm navigate để chuyển sang trang ThemNhom.jsx
  };

  const handleGoBack = () => {
    navigate('/');
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
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateGroup}
            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
          >
            Tạo nhóm
          </Button>
        </div>

        <div
          className="flex flex-col items-center justify-center w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
        >
          <Title level={3} style={{ color: theme.colors.text }}>Chưa có nhóm nào</Title>
          <Paragraph style={{ color: theme.colors.text + 'B0' }}>
            Các nhóm của bạn sẽ xuất hiện ở đây.
          </Paragraph>
        </div>
      </Content>
    </Layout>
  );
}

export default Nhom;