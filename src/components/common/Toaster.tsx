"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { useEffect } from "react";


const Toaster = () => {

  useEffect(() => {
    const msg = Cookies.get("toast");
    if (msg) {
      if (msg === "unauthorized") toast.error("You don’t have permission to access this page.");
      if (msg === "login-required") toast.info("Please log in to continue.");
      Cookies.remove("toast"); // clear after showing
    }
  }, []);

  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={3}
      toastStyle={{
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '14px 20px',
        minHeight: '56px',
        fontSize: '14px',
        fontWeight: 500,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    />
  );
};

export default Toaster;