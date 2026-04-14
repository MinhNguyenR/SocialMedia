import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import TrangChu from './TrangHoatDong/TrangChu.jsx';
import TinNhan from './TrangHoatDong/TinNhan.jsx';
import ThongBao from './TrangHoatDong/ThongBao.jsx';
import CuaHang from './TrangHoatDong/CuaHang.jsx';
import Nhom from './TrangHoatDong/Nhom.jsx';
import BanBe from './TrangHoatDong/BanBe.jsx';
import DangNhap from './TrangHoatDong/DangNhap.jsx';
import DangKy from './TrangHoatDong/DangKy.jsx';
import ProFile from './TrangHoatDong/ProFile.jsx';
import ThemDonHang from './TrangHoatDong/ThemDonHang.jsx';
import ThemNhom from './TrangHoatDong/ThemNhom.jsx';
import GiaoDien from './TrangHoatDong/GiaoDien.jsx'
import ThemBaiViet from './TrangHoatDong/ThemBaiViet.jsx';
import CaiDatTaiKhoan from './TrangHoatDong/CaiDatTaiKhoan.jsx';
import Setting, { ThemeProvider } from './Setting/Setting.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

const { Content } = Layout;


function LocationLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log("Current router location.pathname (inside Router):", location.pathname); 
  }, [location]);
  return null; 
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <LocationLogger />

          <Layout className="min-h-screen">
            <Content>
              <Routes>
                <Route path="/" element={<TrangChu />} />
                <Route path="/home" element={<TrangChu />} />
                <Route path="/settings/theme" element={<GiaoDien />} />
                <Route path="/messages" element={<TinNhan />} />
                <Route path="/notifications" element={<ThongBao />} />
                <Route path="/marketplace" element={<CuaHang />} />
                <Route path="/marketplace/add" element={<ThemDonHang />} />
                <Route path="/groups" element={<Nhom />} />
                <Route path="/groups/add" element={<ThemNhom />} />
                <Route path="/friends" element={<BanBe />} />
                <Route path="/login" element={<DangNhap />} />
                <Route path="/register" element={<DangKy />} />

                <Route path="/profile/:userId" element={<ProFile />} />
                <Route path="/profile" element={<ProFile />} />

                <Route path="/settings/account" element={<CaiDatTaiKhoan />} />
                <Route path="/create-post" element={<ThemBaiViet />} />
                <Route path="/settings" element={<Setting />} />
              </Routes>
            </Content>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
