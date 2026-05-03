import React, { useEffect, useState } from 'react';
import { getNotices, replyToNotice, markNoticeAsRead } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

const Notices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  const fetchNotices = async () => {
    try {
      const res = await getNotices();
      setNotices(res.data.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleReplyChange = (id, text) => {
    setReplyText(prev => ({ ...prev, [id]: text }));
  };

  const handleSendReply = async (id) => {
    if (!replyText[id]) return;
    try {
      await replyToNotice(id, { message: replyText[id] });
      setReplyText(prev => ({ ...prev, [id]: '' }));
      fetchNotices();
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNoticeAsRead(id);
      fetchNotices();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  if (loading) return <div className="text-center py-10">Loading notices...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border-l-4 border-indigo-500 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
            Notices & Communication
          </h1>
          <p className="text-gray-600 mt-1">Manage all your warnings, updates, and direct messages here.</p>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow border border-gray-100">
          No notices found in your inbox.
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map(notice => {
            const isSender = notice.senderId._id === user._id;
            // Highlight if we are the receiver and it's unread
            const isUnread = !notice.isRead && notice.receiverId._id === user._id;

            return (
              <div key={notice._id} className={`bg-white rounded-xl shadow-sm border ${isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-gray-200'} overflow-hidden`}>
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3">
                        {notice.senderId.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {isSender ? `To: ${notice.receiverId.name}` : `From: ${notice.senderId.name}`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(notice.createdAt).toLocaleString()} 
                          {notice.taskId && <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-gray-600">Task: {notice.taskId}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${notice.status === 'Replied' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {notice.status}
                      </span>
                      {isUnread && (
                        <button onClick={() => handleMarkRead(notice._id)} className="text-xs text-blue-600 hover:underline mt-1 font-medium">Mark as Read</button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800 relative">
                    <div className="absolute top-2 left-2 text-gray-300"><MessageSquare className="w-4 h-4" /></div>
                    <p className="pl-6 whitespace-pre-wrap">{notice.message}</p>
                  </div>
                </div>

                {/* Replies Thread */}
                {notice.replies && notice.replies.length > 0 && (
                  <div className="bg-gray-50 p-5 border-b border-gray-100 space-y-4">
                    {notice.replies.map((reply, idx) => {
                      const isMe = reply.senderId._id === user._id;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                            <div className="text-xs opacity-75 mb-1 flex justify-between">
                              <span>{isMe ? 'You' : reply.senderId.name}</span>
                              <span className="ml-4">{new Date(reply.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Reply Box */}
                <div className="p-4 bg-white flex items-end space-x-2">
                  <textarea 
                    rows="1"
                    placeholder="Type your reply..."
                    className="flex-1 resize-none border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={replyText[notice._id] || ''}
                    onChange={(e) => handleReplyChange(notice._id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(notice._id); } }}
                  ></textarea>
                  <button 
                    onClick={() => handleSendReply(notice._id)}
                    disabled={!replyText[notice._id]}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notices;
