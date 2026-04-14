import React, { useContext, useState } from 'react';
import { Layout, Input, Button, Form, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../Setting/Setting';
import { AuthContext } from '../contexts/AuthContext';

const { Content } = Layout;

function DangNhap() {
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Xử lý khi form đăng nhập được gửi
  const onFinish = async (values) => {
    setLoading(true); // Bắt đầu trạng thái tải
    const { email, password } = values;
    // Gọi hàm đăng nhập từ AuthContext
    const result = await login(email, password);
    setLoading(false); // Kết thúc trạng thái tải

    // Xử lý kết quả đăng nhập
    if (result.success) {
      message.success('Đăng nhập thành công! Đang chuyển hướng...');
      navigate('/home'); // Điều hướng về trang chủ
    } else {
      message.error(result.message || 'Đăng nhập thất bại!');
    }
  };

  return (
    <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
      <Content className="p-6">
        <div
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
          style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, borderWidth: '1px' }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.text }}>Đăng Nhập</h2>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: theme.colors.text }} />}
                placeholder="Email"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: theme.colors.text }} />}
                placeholder="Mật khẩu"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={loading} // Hiển thị trạng thái tải trên nút
                style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
              >
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>
          <div className="text-center mt-4">
            <span style={{ color: theme.colors.text }}>Chưa có tài khoản? </span>
            <Link to="/register" style={{ color: theme.colors.primary }}>Đăng ký ngay</Link>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default DangNhap;