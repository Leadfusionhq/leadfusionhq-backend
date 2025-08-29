import { Metadata } from "next";
import SettingsSupportClient from '@/components/admin-dashboard/setting-support/SettingsSupportClient';

export const metadata: Metadata = {
    title: 'User Management | Lead Management Platform',
    description: 'User Management where you manage all your leads and settings.'
};

const SettingsSupport = () => {
    return <SettingsSupportClient />;
};

export default SettingsSupport;