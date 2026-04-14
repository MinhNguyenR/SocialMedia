import React, { useState, useContext } from 'react';
import { Layout, Form, Input, Button, Upload, message, Typography, Spin, Card } from 'antd';
import { UploadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../Setting/Setting';

const { Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

function ThemBaiViet() {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const { token, isAuthenticated, loading: authLoading } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    // Xử lý thay đổi file khi tải lên
    const handleFileChange = ({ fileList: newFileList }) => {
        // Giới hạn số lượng file tối đa là 5
        const filteredList = newFileList.slice(-5).map(file => {
            // Tạo URL tạm thời cho các file đã chọn để xem trước
            if (file.status === 'done' && file.originFileObj) {
                return { ...file, url: URL.createObjectURL(file.originFileObj) };
            }
            return file;
        });
        setFileList(filteredList);
    };

    // Xử lý khi form được gửi đi
    const onFinish = async (values) => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (!isAuthenticated) {
            message.error('Bạn cần đăng nhập để đăng bài.');
            return;
        }

        // Kiểm tra nếu không có nội dung và không có ảnh
        if (!values.content && fileList.length === 0) {
            message.error('Bài viết không được để trống nội dung hoặc ảnh.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('content', values.content || ''); // Thêm nội dung bài viết

        // Thêm các file ảnh/video vào FormData
        fileList.forEach(file => {
            formData.append('images', file.originFileObj); // 'images' phải khớp với tên trường trong Multer
        });

        try {
            // Gửi yêu cầu POST để tạo bài viết
            const res = await axios.post('http://localhost:5000/api/posts/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Đặt Content-Type cho FormData
                    Authorization: `Bearer ${token}`
                },
            });

            if (res.data.success) {
                message.success('Bài viết đã được đăng thành công!');
                form.resetFields(); // Reset form
                setFileList([]); // Xóa danh sách file đã chọn
                navigate('/home'); // Điều hướng về trang chủ
            } else {
                message.error(res.data.message || 'Đăng bài thất bại.');
            }
        } catch (error) {
            // Xử lý lỗi từ API
            message.error(error.response?.data?.message || 'Lỗi khi đăng bài.');
        } finally {
            setUploading(false); // Kết thúc trạng thái tải lên
        }
    };

    // Hiển thị trạng thái tải nếu AuthContext đang tải
    if (authLoading) {
        return (
            <Layout className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                <Spin size="large" tip="Đang tải dữ liệu xác thực..." />
            </Layout>
        );
    }

    // Nút tải lên tùy chỉnh cho Ant Design Upload
    const uploadButton = (
        <div style={{ color: theme.colors.text }}>
            <PlusOutlined style={{ color: theme.colors.text }} />
            <div style={{ marginTop: 8, color: theme.colors.text }}>Tải ảnh/video</div>
        </div>
    );

    return (
        <Content className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
            <Card
                className="shadow-lg rounded-lg w-full max-w-2xl"
                style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, borderWidth: '1px' }}
            >
                <Title level={3} className="text-center mb-6" style={{ color: theme.colors.text }}>
                    Tạo Bài Viết Mới
                </Title>
                <Form
                    form={form}
                    name="new_post"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="content"
                        rules={[{ required: false, message: 'Vui lòng nhập nội dung bài viết!' }]} // Có thể không bắt buộc nếu có ảnh
                    >
                        <TextArea
                            rows={4}
                            placeholder="Bạn đang nghĩ gì?"
                            style={{ backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.text + '20' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: theme.colors.text }}>Thêm ảnh</span>}
                        valuePropName="fileList"
                        getValueFromEvent={handleFileChange}
                    >
                        <Upload
                            name="images"
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false} // Ngăn Ant Design tự động tải lên
                            accept="image/*,video/*"
                            multiple
                            maxCount={5} // Giới hạn 5 file
                            style={{ borderColor: theme.colors.text + '20' }}
                        >
                            {fileList.length < 5 && uploadButton}
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={uploading}
                            icon={<SendOutlined />}
                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, width: '100%' }}
                        >
                            {uploading ? 'Đang đăng...' : 'Đăng bài'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Content>
    );
}

export default ThemBaiViet;