import React from 'react'

const testNotifications = [
  {
    id: 1,
    title: "siggy-ai-main",
    message: "failed to deploy in the Production environment",
    time: "2d ago",
    type: "error"
  },
  {
    id: 2,
    title: "siggy-ai-main",
    message: "failed to deploy in the Preview environment",
    time: "2d ago",
    type: "error"
  },
  {
    id: 3,
    title: "payment-service",
    message: "successfully deployed to Production",
    time: "1d ago",
    type: "success"
  },
  {
    id: 4,
    title: "auth-service",
    message: "new version released",
    time: "5h ago",
    type: "info"
  },
  {
    id: 5,
    title: "frontend",
    message: "build warnings detected",
    time: "Just now",
    type: "warning"
  },
   {
    id: 6,
    title: "frontend",
    message: "build warnings detected",
    time: "Just now",
    type: "warning"
  },
   {
    id: 7,
    title: "frontend",
    message: "build warnings detected",
    time: "Just now",
    type: "warning"
  },
   {
    id: 8,
    title: "frontend",
    message: "build warnings detected",
    time: "Just now",
    type: "warning"
  },
   {
    id: 9,
    title: "frontend",
    message: "build warnings detected",
    time: "Just now",
    type: "warning"
  },

];

const NotificationCard = () => {
  return (
    <div className="absolute right-10 top-[88px] w-[400px] bg-black shadow-lg rounded-lg py-4 z-50 transition-all duration-300 font-normal font-base">
 <div className="flex items-center border-b border-gray-700">
      <button className="flex-1 px-4 py-3 text-sm font-medium text-white border-b-2 ">
        Inbox <span className="ml-1 text-xs px-2 py-0.5 rounded-full">  {testNotifications.length}</span>
      </button>
      {/* <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white">
        Archive
      </button>
      <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white">
        Comments
      </button>
      <button className="px-3 py-3">
        <Image src="/images/icons/settings.svg" width={18} height={18} alt="settings"/>
      </button> */}
    </div>
        {/* Notifications list */}
    <div className="max-h-[400px] overflow-y-auto">
      {testNotifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-800 hover:bg-gray-700 cursor-pointer">
         <span>
              {n.type === "error" && <span className="text-red-500">⚠️</span>}
              {n.type === "success" && <span className="text-green-500">✅</span>}
              {n.type === "info" && <span className="text-blue-400">ℹ️</span>}
              {n.type === "warning" && <span className="text-yellow-400">⚠️</span>}
            </span>
          <div>
            <p className="text-base text-white">
            {n.title}
            </p>
            <span className="text-base text-white">{n.time}</span>
          </div>
        </div>
      ))}
    </div>
   </div>
  )
}

export default NotificationCard