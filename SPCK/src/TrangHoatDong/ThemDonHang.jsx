import React, { useContext } from 'react';
 import { Layout, Typography, Input, Button, Form, Upload } from 'antd';
 import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
 import { useNavigate } from 'react-router-dom';
 import Navbar from '../ChucNang/Navbar';
 import { ThemeContext } from '../Setting/Setting';

 const { Content } = Layout;
 const { Title } = Typography;
 const { TextArea } = Input;

 function ThemDonHang() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values) => {
   console.log('Success:', values);
   navigate('/marketplace');
  };

  const onFinishFailed = (errorInfo) => {
   console.log('Failed:', errorInfo);
  };

  const handleGoBack = () => {
   navigate('/marketplace');
  };

  const uploadProps = {
   name: 'file',
   action: 'https://example.com/upload', 
   listType: 'picture-card',
   maxCount: 3, 
  };

  return (
   <Layout className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
    <Navbar />
    <Content className="flex flex-col items-center justify-center p-6 flex-1">
     <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md" style={{ backgroundColor: theme.colors.siderBackground }}>
      <Title level={3} className="text-center" style={{ color: theme.colors.text, marginBottom: 24 }}>Thêm Đơn Hàng Mới</Title>
      <Form
       form={form}
       layout="vertical"
       onFinish={onFinish}
       onFinishFailed={onFinishFailed}
      >
       <Form.Item
        label={<span style={{ color: theme.colors.text }}>Tên hàng</span>}
        name="tenHang"
        rules={[{ required: true, message: 'Vui lòng nhập tên hàng!' }]}
       >
        <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text }} />
       </Form.Item>

       <Form.Item
        label={<span style={{ color: theme.colors.text }}>Loại mặt hàng</span>}
        name="loaiMatHang"
        rules={[{ required: true, message: 'Vui lòng chọn loại mặt hàng!' }]}
       >
        <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text }} />
       </Form.Item>

       <Form.Item
        label={<span style={{ color: theme.colors.text }}>Giá tiền</span>}
        name="giaTien"
        rules={[{ required: true, message: 'Vui lòng nhập giá tiền!' }]}
       >
        <Input type="number" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }} />
       </Form.Item>

       <Form.Item
        label={<span style={{ color: theme.colors.text }}>Giới thiệu</span>}
        name="gioiThieu"
       >
        <TextArea rows={4} style={{ backgroundColor: theme.colors.background, color: theme.colors.text }} />
       </Form.Item>

       <Form.Item
        label={<span style={{ color: theme.colors.text }}>Ảnh/Video</span>}
        name="media"
       >
        <Upload {...uploadProps}>
         <Button icon={<UploadOutlined />} style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}>
          Tải lên
         </Button>
        </Upload>
       </Form.Item>

       <Form.Item className="flex justify-end">
        <Button onClick={handleGoBack} className="mr-2" style={{ color: theme.colors.text, borderColor: theme.colors.text + '40' }}>
         Quay lại
        </Button>
        <Button type="primary" htmlType="submit" style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}>
         Thêm Đơn Hàng
        </Button>
       </Form.Item>
      </Form>
     </div>
    </Content>
   </Layout>
  );
 }

 export default ThemDonHang;
 