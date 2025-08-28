"use client";
import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useSocket } from '@/context/SocketContext';

const NotificationCard = () => {
  const { 
    notifications, 
    unreadCount, 
    loading,
    removeNotification, 
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications();
  
  const { connected } = useSocket();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read && notification._id) {
      await markAsRead(notification._id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string | number) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  const handleTabChange = (tab: 'all' | 'unread') => {
    setActiveTab(tab);
    fetchNotifications(tab === 'unread');
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="absolute right-10 top-[88px] w-[420px] bg-white shadow-2xl rounded-lg border border-gray-200 z-50 transition-all duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-[450px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <div className="text-gray-400 text-3xl mb-2">📭</div>
            <p className="text-sm">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id || notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group transition-colors ${
                !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {notification.type === 'error' && <span className="text-red-500 text-lg">⚠️</span>}
                {notification.type === 'success' && <span className="text-green-500 text-lg">✅</span>}
                {notification.type === 'info' && <span className="text-blue-500 text-lg">ℹ️</span>}
                {notification.type === 'warning' && <span className="text-yellow-500 text-lg">⚠️</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className={`text-sm font-medium ${
                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                
                <p className={`text-sm mt-1 break-words ${
                  !notification.read ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {notification.time}
                  </span>
                  
                  {notification.senderId && (
                    <span className="text-xs text-gray-500">
                      from {notification.senderId.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(e, notification._id || notification.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
                title="Delete notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <button
            onClick={() => fetchNotifications(activeTab === 'unread')}
            className="text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;