import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import Image from 'next/image';
const ProfileCard = () => {
      const { user} = useSelector((state: RootState) => state.auth);
      console.log("usermmmmmmmmm",user)
    
  // Dummy user data
//   const user = {
//     name: "Aman Singh",
//     email: "amansingh@gmail.com",
//     role: "Web Developer",
//     avatar: "https://ui-avatars.com/api/?name=Aman+Singh&background=204D9D&color=fff", // dummy avatar
//   };

  // Dummy menu items
  const menuItems = [
    { id: 1, label: "Dashboard", link: "/dashboard" },
    { id: 2, label: "Settings", link: "/settings" },
    { id: 3, label: "Billing", link: "/billing" },
    { id: 4, label: "Logout", link: "/logout" },
  ];

  return (
    <div className="absolute right-10 top-[88px] w-[320px] bg-black shadow-lg rounded-lg pt-4 z-50 transition-all duration-300 text-base font-normal">
      {/* User Info */}
      <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-800">
       
            <Image src="/images/icons/User.svg" width={60} height={60} alt="profile_image_icon" className="w-12 h-12 rounded-full border border-gray-700"/>
        
        <div>
        {user?.name && <p className="text-white font-medium">{user.name}</p>}  
        {user?.email && <p className="text-white text-sm">{user?.email}</p> }  
        </div>
      </div>

      {/* Menu List */}
      <div className="flex flex-col">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 text-white hover:bg-gray-700 cursor-pointer border-b border-gray-800"
          >
            {item.label}
          </div>
        ))}
      </div>
      <button className="px-4 py-3 w-full text-white hover:bg-gray-700 cursor-pointer  border-gray-800">
       Upgrade 
      </button>
    </div>
  )
}

export default ProfileCard
