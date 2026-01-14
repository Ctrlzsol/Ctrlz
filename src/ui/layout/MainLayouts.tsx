
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-grow min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export const DashboardLayout = () => {
  return (
    <>
      <main className="flex-grow min-h-screen bg-[#f5f5f7]">
        <Outlet />
      </main>
    </>
  );
};
