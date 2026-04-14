import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Thiết lập header Authorization cho Axios khi token thay đổi
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            // Xóa header Authorization nếu không có token
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        // Tải thông tin người dùng khi component mount hoặc token thay đổi
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await axios.get('http://localhost:5000/api/auth/me');
                    if (res.data.success) {
                        const userData = {
                            id: res.data.data._id || res.data.data.id,
                            username: res.data.data.username,
                            email: res.data.data.email,
                            createdAt: res.data.data.createdAt,
                            avatar: res.data.data.avatar || ''
                        };
                        setUser(userData);
                    } else {
                        // Nếu API trả về lỗi, xóa token và đăng xuất
                        throw new Error(res.data.message || 'Failed to load user profile');
                    }
                } catch (error) {
                    // Xử lý lỗi khi tải thông tin người dùng
                    // Nếu lỗi là 401 (Unauthorized), xóa token
                    if (error.response && error.response.status === 401) {
                        setToken(null);
                        localStorage.removeItem('token');
                    }
                    setUser(null); // Đảm bảo user là null nếu có lỗi
                }
            }
            setLoading(false); // Kết thúc trạng thái tải
        };

        loadUser();
    }, [token]);

    // Hàm đăng ký người dùng
    const register = async (username, email, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            // Sau khi đăng ký thành công, tự động đăng nhập (hoặc bạn có thể yêu cầu đăng nhập lại)
            setToken(res.data.token);
            const userData = {
                id: res.data.user._id || res.data.user.id,
                username: res.data.user.username,
                email: res.data.user.email,
                createdAt: res.data.user.createdAt,
                avatar: res.data.user.avatar || ''
            };
            setUser(userData);
            localStorage.setItem('token', res.data.token);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Đăng ký thất bại' };
        }
    };

    // Hàm đăng nhập người dùng
    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            setToken(res.data.token);
            const userData = {
                id: res.data.user._id || res.data.user.id,
                username: res.data.user.username,
                email: res.data.user.email,
                createdAt: res.data.user.createdAt,
                avatar: res.data.user.avatar || ''
            };
            setUser(userData);
            localStorage.setItem('token', res.data.token);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' };
        }
    };

    // Hàm đăng xuất người dùng
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    // Hiển thị thông báo tải trong khi chờ xác thực
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Đang tải xác thực...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, register, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};