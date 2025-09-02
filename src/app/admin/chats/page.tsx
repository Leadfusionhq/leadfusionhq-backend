import { Metadata } from "next";
import Chats from '@/components/admin-dashboard/chat/Chats';

export const metadata: Metadata = {
    title: 'Chats | Lead Management',
    description: 'Find quick answers to common questions about user management, lead tracking, and platform settings.'
};

const AdminChats = () => {
    return (
    <div className="">
     <Chats />
    </div>
    );
};

export default AdminChats;