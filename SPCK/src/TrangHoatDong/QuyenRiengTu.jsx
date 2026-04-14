import React, { useContext } from 'react';
import { Layout, Typography, Button, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

function QuyenRiengTu() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/settings');
  };

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <Navbar />
      <Content className="flex flex-col items-center justify-center p-6 flex-1">
        <Card
          className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-md"
          style={{ backgroundColor: theme.colors.siderBackground, color: theme.colors.text }}
        >
          <Title level={3} style={{ color: theme.colors.text }}>Cài đặt Quyền riêng tư</Title>
          <Paragraph style={{ color: theme.colors.text + 'B0' }}>
            Nội dung cài đặt quyền riêng tư sẽ được thêm vào đây.
          </Paragraph>
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            className="mt-6"
            style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}
          >
            Quay lại Cài đặt
          </Button>
        </Card>
      </Content>
    </Layout>
  );
}

export default QuyenRiengTu;
