import React, { useContext, useState } from 'react';
import { Layout, Input, Button, Form, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../Setting/Setting';
import { AuthContext } from '../contexts/AuthContext'; 

const { Content } = Layout;

function DangKy() {
  const { theme } = useContext(ThemeContext);
  const { register } = useContext(AuthContext); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Xử lý khi form được gửi đi
  const onFinish = async (values) => {
    setLoading(true);
    const { username, email, password } = values;
    // Gọi hàm đăng ký từ AuthContext
    const result = await register(username, email, password);
    setLoading(false);

    // Xử lý kết quả đăng ký
    if (result.success) {
      message.success('Đăng ký thành công! Đang chuyển hướng...');
      navigate('/home');
    } else {
      message.error(result.message || 'Đăng ký thất bại!');
    }
  };

  return (
    <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
      <Content className="p-6">
        <div
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
          style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, borderWidth: '1px' }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.text }}>Đăng Ký</h2>
          <Form
            name="register"
            initialValues={{ remember: true }}
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Vui lòng nhập tên người dùng!' },
                { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự!' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: theme.colors.text }} />}
                placeholder="Tên người dùng"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

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
                type="email"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: theme.colors.text }} />}
                placeholder="Mật khẩu"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    // Kiểm tra mật khẩu xác nhận có khớp không
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: theme.colors.text }} />}
                placeholder="Xác nhận mật khẩu"
                style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={loading}
                style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
              >
                Đăng Ký
              </Button>
            </Form.Item>
          </Form>
          <div className="text-center mt-4">
            <span style={{ color: theme.colors.text }}>Đã có tài khoản? </span>
            <Link to="/login" style={{ color: theme.colors.primary }}>Đăng nhập ngay</Link>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default DangKy;