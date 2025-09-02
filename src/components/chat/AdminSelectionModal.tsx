import React, { useState, useEffect } from 'react';
import { X, User, Mail, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import axiosWrapper from "@/utils/api";
import { API_URL } from "@/utils/apiUrl";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface Admin {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
  specializations?: string[];
  responseTime?: string;
}

interface AdminSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAdmin: (adminId: string, adminName: string) => void;
  initialSubject?: string;
}

const AdminSelectionModal: React.FC<AdminSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectAdmin,
  initialSubject = ''
}) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [chatSubject, setChatSubject] = useState(initialSubject);
  const token = useSelector((state: RootState) => state.auth.token);

  const predefinedSubjects = [
    "General Support",
    "Account Issues", 
    "Billing Questions",
    "Technical Problem",
    "Feature Request",
    "Bug Report",
    "Other"
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setChatSubject(initialSubject);
    }
  }, [isOpen, initialSubject]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await axiosWrapper(
        "get", 
        API_URL.GET_ALL_ADMINS, 
        {}, 
        token ?? undefined
      ) as any;
      console.log('response',response)
      // Mock online status and additional info (you can get this from your backend)
      const adminsWithStatus = response.data.map((admin: any) => ({
        ...admin,
        isOnline: Math.random() > 0.3, // Mock online status
        responseTime: Math.random() > 0.5 ? "Usually responds within 5 mins" : "Usually responds within 1 hour",
        specializations: ["General Support", "Technical Issues"] // Mock specializations
      }));
      
      setAdmins(adminsWithStatus);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (selectedAdmin) {
      const admin = admins.find(a => a._id === selectedAdmin);
      onSelectAdmin(selectedAdmin, admin?.name || '');
      onClose();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Start a Conversation
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100">
            Choose an admin to help you with your questions or concerns
          </p>
        </div>

        <div className="p-6">
          {/* Quick Subject Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What do you need help with?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {predefinedSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setChatSubject(subject)}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    chatSubject === subject
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            
            {/* Custom subject input */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Or describe your issue briefly..."
                value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Admin Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Support Team
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No admins available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {admins.map((admin) => (
                  <div
                    key={admin._id}
                    onClick={() => setSelectedAdmin(admin._id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedAdmin === admin._id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selected indicator */}
                    {selectedAdmin === admin._id && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {admin.avatar ? (
                            <img 
                              src={admin.avatar} 
                              alt={admin.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(admin.name)
                          )}
                        </div>
                        {/* Online status */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          admin.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>

                      {/* Admin Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {admin.name}
                          </h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {admin.role}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{admin.email}</span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            admin.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-500">
                            {admin.isOnline ? 'Online now' : 'Offline'}
                          </span>
                        </div>

                        {/* Response time */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{admin.responseTime}</span>
                        </div>

                        {/* Specializations */}
                        {admin.specializations && admin.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {admin.specializations.map((spec, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
     
            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 pb-2">
                <div className="flex items-center justify-end gap-3 pb-3">
                    <button onClick={onClose} className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
                    Cancel
                    </button>
                    <button
                    onClick={handleStartChat}
                    disabled={!selectedAdmin || !chatSubject.trim()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedAdmin && chatSubject.trim()
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    >
                    Start Conversation
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminSelectionModal;