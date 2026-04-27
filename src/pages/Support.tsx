import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Send, MessageSquare, ShieldCheck, CheckCheck, Plus, ChevronRight, Inbox, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Support() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Get all support threads for this merchant
    const unsubThreads = onSnapshot(
      query(
        collection(db, 'supportThreads'), 
        where('merchantId', '==', auth.currentUser.uid),
        orderBy('lastMessageAt', 'desc')
      ),
      (snap) => {
        const threadList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setThreads(threadList);
        
        // Auto-select the first one if none selected
        if (threadList.length > 0 && !selectedThread) {
          // setSelectedThread(threadList[0]); // Optional: auto-select first
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching threads:", error);
        setLoading(false);
      }
    );

    return () => unsubThreads();
  }, []);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    // 2. Listen for messages in the selected thread
    const unsubMessages = onSnapshot(
      query(
        collection(db, 'supportMessages'), 
        where('threadId', '==', selectedThread.id),
        orderBy('createdAt', 'asc')
      ),
      (msgSnap) => {
        setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Mark as read
        if (selectedThread.unreadCountByMerchant > 0) {
          updateDoc(doc(db, 'supportThreads', selectedThread.id), { unreadCountByMerchant: 0 });
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubMessages();
  }, [selectedThread?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateTicket = async () => {
    if (!auth.currentUser) return;
    setIsCreating(true);
    try {
      const threadRef = await addDoc(collection(db, 'supportThreads'), {
        merchantId: auth.currentUser.uid,
        merchantName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Merchant',
        status: 'open',
        lastMessageAt: serverTimestamp(),
        unreadCountByAdmin: 0,
        unreadCountByMerchant: 0,
        title: `New Support Ticket` // Default title
      });
      setSelectedThread({ id: threadRef.id, status: 'open', title: 'New Support Ticket' });
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || !selectedThread) return;

    const content = newMessage;
    setNewMessage('');

    try {
      // Update existing thread
      await updateDoc(doc(db, 'supportThreads', selectedThread.id), {
        lastMessageAt: serverTimestamp(),
        unreadCountByAdmin: (selectedThread.unreadCountByAdmin || 0) + 1,
        status: 'open'
      });

      // Add message
      await addDoc(collection(db, 'supportMessages'), {
        threadId: selectedThread.id,
        merchantId: auth.currentUser.uid,
        senderId: auth.currentUser.uid,
        senderType: 'merchant',
        content,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatMsgDate = (date: any) => {
    if (!date) return '...';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'HH:mm');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Sidebar: Ticket History */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tickets</h2>
          <button 
            onClick={handleCreateTicket}
            disabled={isCreating}
            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
            title="New Ticket"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tickets yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThread(t)}
                  className={`w-full p-4 text-left transition-all hover:bg-white flex items-start justify-between gap-4 ${
                    selectedThread?.id === t.id ? 'bg-white shadow-sm z-10' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <h3 className="text-xs font-black text-slate-900 truncate">
                        {t.title || `Support #${t.id.slice(-6).toUpperCase()}`}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate mb-2">
                       Last activity: {t.lastMessageAt ? format(t.lastMessageAt.toDate(), 'MMM d, p') : 'Just now'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        t.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                      {t.unreadCountByMerchant > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[8px] font-black tracking-widest">
                          {t.unreadCountByMerchant} NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat */}
      <div className="flex-1 flex flex-col bg-white relative">
        {!selectedThread ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-wide">Select a ticket</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 font-medium italic">
              Choose a support ticket from the list or start a new one to chat with our team.
            </p>
            <button 
              onClick={handleCreateTicket}
              disabled={isCreating}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Start New Ticket
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase italic">
                    {selectedThread.title || `Ticket #${selectedThread.id.slice(-6).toUpperCase()}`}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedThread.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedThread.status === 'open' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                    {selectedThread.status}
                  </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                    No messages yet in this ticket. Write something below to start.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.senderType === 'merchant' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] flex flex-col ${msg.senderType === 'merchant' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm font-medium ${
                        msg.senderType === 'merchant' 
                          ? 'bg-slate-900 text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1.5 font-bold px-1 flex items-center gap-1 italic">
                        {formatMsgDate(msg.createdAt)}
                        {msg.senderType === 'merchant' && <CheckCheck size={10} className="text-emerald-500" />}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || selectedThread.status === 'closed'}
                  className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 active:scale-95 shrink-0"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="flex items-center justify-center gap-4 mt-3">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  Encrypted
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={10} className="text-amber-500" />
                  Avg Response: 15m
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
