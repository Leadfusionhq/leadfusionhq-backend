"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";


const Toaster = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      if (error === "unauthorized") {
        toast.error("You don’t have permission to access this page.");
      }
      if (error === "login-required") {
        toast.info("Please log in to continue.");
      }

      // Clean query param after showing toast
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("error");
      router.replace("?" + newParams.toString(), { scroll: false });
    }
  }, [searchParams, router]);

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