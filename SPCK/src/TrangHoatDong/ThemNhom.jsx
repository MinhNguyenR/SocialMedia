import React, { useContext } from 'react';
import { Layout, Typography, Input, Button, Form, Upload, Select } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ChucNang/Navbar';
import { ThemeContext } from '../Setting/Setting';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

function ThemNhom() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Success:', values);
    navigate('/groups'); 
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const handleGoBack = () => {
    navigate('/groups'); 
  };

  const uploadProps = {
    name: 'avatar',
    action: 'https://example.com/upload-avatar', 
    listType: 'picture-card',
    maxCount: 1,
  };

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Navbar />
      <Content className="flex flex-col items-center justify-center p-6 flex-1">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md" style={{ backgroundColor: theme.colors.siderBackground }}>
          <Title level={3} className="text-center" style={{ color: theme.colors.text, marginBottom: 24 }}>Tạo Nhóm Mới</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              label={<span style={{ color: theme.colors.text }}>Tên nhóm</span>}
              name="tenNhom"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhóm!' }]}
            >
              <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: theme.colors.text }}>Loại nhóm</span>}
              name="loaiNhom"
              rules={[{ required: true, message: 'Vui lòng chọn loại nhóm!' }]}
            >
              <Select
                placeholder="Chọn loại nhóm"
                style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                dropdownStyle={{ backgroundColor: theme.colors.siderBackground }}
              >
                <Option value="music" style={{ color: theme.colors.text }}>Nhạc</Option>
                <Option value="game" style={{ color: theme.colors.text }}>Game</Option>
                <Option value="movie" style={{ color: theme.colors.text }}>Phim</Option>
                <Option value="sport" style={{ color: theme.colors.text }}>Thể thao</Option>
                <Option value="other" style={{ color: theme.colors.text }}>Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={{ color: theme.colors.text }}>Avatar nhóm (Không bắt buộc)</span>}
              name="avatarNhom"
              valuePropName="fileList"
              getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}>
                  Tải lên ảnh
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item className="flex justify-end">
              <Button onClick={handleGoBack} className="mr-2" style={{ color: theme.colors.text, borderColor: theme.colors.text + '40' }}>
                Quay lại
              </Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}>
                Tạo Nhóm
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
}

export default ThemNhom;
