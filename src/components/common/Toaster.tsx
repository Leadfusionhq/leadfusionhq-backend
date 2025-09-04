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
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default Toaster;