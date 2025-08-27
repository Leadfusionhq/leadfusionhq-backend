import { Metadata } from "next";
import FAQManagement from '@/components/admin-dashboard/faq/FAQManagement';

export const metadata: Metadata = {
    title: 'Frequently Asked Questions | Lead Management',
    description: 'Find quick answers to common questions about user management, lead tracking, and platform settings.'
};

const AdminFAQs = () => {
    return <FAQManagement />;
};

export default AdminFAQs;