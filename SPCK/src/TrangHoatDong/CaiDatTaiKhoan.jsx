import React, { useState, useEffect, useContext } from 'react';
import { Card, Avatar, Typography, Spin, Alert, Layout, Button, Modal, Form, Input, message } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined, CalendarOutlined, EditOutlined, LockOutlined, HomeOutlined, LogoutOutlined } from '@ant-design/icons';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../Setting/Setting';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Content } = Layout;

function CaiDatTaiKhoan() {

    const { user, isAuthenticated, loading: authLoading, setUser, logout } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const profileData = user;
    const [error, setError] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        if (profileData) {
            profileForm.setFieldsValue({
                username: profileData.username,
                email: profileData.email,
            });
        }
    }, [profileData, profileForm]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setError('Bạn cần đăng nhập để xem thông tin profile.');
        } else if (!authLoading && isAuthenticated && !user) {
            setError('Không thể tải thông tin profile người dùng. Vui lòng thử lại.');
        } else {
            setError(null);
        }
    }, [authLoading, isAuthenticated, user]);

    const showEditModal = () => {
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        profileForm.resetFields();
    };

    const handleEditSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/profile', values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.success) {
                message.success('Cập nhật profile thành công!');
                setUser(res.data.data);
                setIsEditModalVisible(false);
            } else {
                message.error(res.data.message || 'Cập nhật profile thất bại.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật profile:', err.response?.data || err.message);
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật profile.');
        }
    };

    const showPasswordModal = () => {
        setIsPasswordModalVisible(true);
    };

    const handlePasswordCancel = () => {
        setIsPasswordModalVisible(false);
        passwordForm.resetFields();
    };

    const handlePasswordSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/password', values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.success) {
                message.success('Cập nhật mật khẩu thành công!');
                setIsPasswordModalVisible(false);
            } else {
                message.error(res.data.message || 'Cập nhật mật khẩu thất bại.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật mật khẩu:', err.response?.data || err.message);
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu.');
        }
    };

    const handleGoHome = () => {
        navigate('/home');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        message.info('Bạn đã đăng xuất.');
    };

    if (authLoading) {
        return (
            <Content className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Spin size="large" tip="Đang tải thông tin..." />
            </Content>
        );
    }

    if (error) {
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    closable
                />
            </Content>
        );
    }

    if (!profileData) {
        return (
            <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
                <Alert
                    message="Thông tin không khả dụng"
                    description="Không thể tải thông tin profile. Vui lòng đăng nhập."
                    type="warning"
                    showIcon
                />
            </Content>
        );
    }
    const createdAt = profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('vi-VN') : 'Không xác định';

    return (
        <Content
            className="min-h-screen flex flex-col items-center justify-start py-10 px-4"
            style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
        >
            <Card
                className="w-full max-w-2xl shadow-lg rounded-lg p-6"
                style={{
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.text + '20',
                    color: theme.colors.text
                }}
            >
                <div className="flex flex-col items-center mb-6">
                    <Avatar
                        size={180}
                        icon={user?.avatar ? null : <UserOutlined />}
                        src={user?.avatar || undefined}
                        style={{ backgroundColor: theme.colors.primary, boxShadow: 'none' }}
                    />
                    <Title level={2} style={{ color: theme.colors.text }}>
                        {profileData.username || 'Người dùng'}
                    </Title>
                    <Text type="secondary" style={{ color: theme.colors.text + '80' }}>
                        @{profileData.username || 'unknown'}
                    </Text>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center text-lg">
                        <IdcardOutlined className="mr-3" style={{ color: theme.colors.primary }} />
                        <Text style={{ color: theme.colors.text }}>
                            ID: {profileData.id || 'Không có ID'}
                        </Text>
                    </div>
                    <div className="flex items-center text-lg">
                        <MailOutlined className="mr-3" style={{ color: theme.colors.primary }} />
                        <Text style={{ color: theme.colors.text }}>
                            Email: {profileData.email || 'Không có email'}
                        </Text>
                    </div>
                    <div className="flex items-center text-lg">
                        <UserOutlined className="mr-3" style={{ color: theme.colors.primary }} />
                        <Text style={{ color: theme.colors.text }}>
                            Tên người dùng: {profileData.username || 'Không có tên người dùng'}
                        </Text>
                    </div>
                    <div className="flex items-center text-lg">
                        <CalendarOutlined className="mr-3" style={{ color: theme.colors.primary }} />
                        <Text style={{ color: theme.colors.text }}>
                            Ngày tạo tài khoản: {createdAt}
                        </Text>
                    </div>
                </div>

                <div className="mt-8 flex justify-center space-x-4 flex-wrap gap-2">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={showEditModal}
                        style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }}
                    >
                        Chỉnh sửa Profile
                    </Button>
                    <Button
                        type="default"
                        icon={<LockOutlined />}
                        onClick={showPasswordModal}
                        style={{
                            backgroundColor: theme.colors.cardBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.text + '40'
                        }}
                    >
                        Đổi mật khẩu
                    </Button>
                    <Button
                        type="default"
                        icon={<HomeOutlined />}
                        onClick={handleGoHome}
                        style={{
                            backgroundColor: theme.colors.cardBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.text + '40'
                        }}
                    >
                        Về Trang Chủ
                    </Button>
                    <Button
                        type="default"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        style={{
                            backgroundColor: theme.colors.cardBackground,
                            color: theme.colors.error,
                            borderColor: theme.colors.error
                        }}
                    >
                        Đăng xuất
                    </Button>
                </div>
            </Card>

            <Modal
                title="Chỉnh sửa thông tin Profile"
                visible={isEditModalVisible}
                onCancel={handleEditCancel}
                footer={null}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
            >
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleEditSubmit}
                    initialValues={{ username: profileData?.username, email: profileData?.email }}
                >
                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Tên người dùng</span>}
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                    >
                        <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                    </Form.Item>
                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Email</span>}
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}
                    >
                        <Input style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, width: '100%' }}
                        >
                            Cập nhật
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Đổi mật khẩu"
                visible={isPasswordModalVisible}
                onCancel={handlePasswordCancel}
                footer={null}
                style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}
            >
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordSubmit}
                >
                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Mật khẩu hiện tại</span>}
                        name="currentPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                    >
                        <Input.Password style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                    </Form.Item>
                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Mật khẩu mới</span>}
                        name="newPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!', min: 6 }]}
                    >
                        <Input.Password style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                    </Form.Item>
                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Xác nhận mật khẩu mới</span>}
                        name="confirmNewPassword"
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Hai mật khẩu bạn nhập không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }} />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, width: '100%' }}
                        >
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Content>
    );
}

export default CaiDatTaiKhoan;
