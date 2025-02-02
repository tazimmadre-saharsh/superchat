import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, PlusCircle, Gift } from 'lucide-react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { firestore, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import firebase from 'firebase/app';
import { Loader } from './Loader';

interface Message {
  id: string;
  text: string;
  uid: string;
  photoURL: string;
  displayName: string;
  createdAt: any;
  channelId: string;
}

function formatMessageDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'long' }) + ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export function Chat({ channelId }: { channelId: string }) {
  const [formValue, setFormValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const messagesRef = firestore.collection('messages');
  const query = messagesRef
    .where('channelId', '==', channelId)
    .orderBy('createdAt')
    .limit(50);

  const [messages, loading, error] = useCollectionData<Message>(query, { idField: 'id' });
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      firestore.collection('users').doc(auth.currentUser!.uid).update({
        isTyping: true,
        typingIn: channelId,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      firestore.collection('users').doc(auth.currentUser!.uid).update({
        isTyping: false,
        typingIn: null,
      });
    }, 1500);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    try {
      const { uid, photoURL, displayName } = auth.currentUser!;
      await messagesRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        channelId,
        uid,
        photoURL: photoURL || 'https://api.dicebear.com/7.x/avatars/svg?seed=' + uid,
        displayName: displayName || 'Anonymous',
      });
      setFormValue('');
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading messages</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader size="large" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
            <div className="text-center">
              <p className="text-lg mb-2">Welcome to the beginning of this channel!</p>
              <p className="text-sm">Send your first message to get started</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages?.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-[var(--bg-secondary)]">
        <div className="flex items-center space-x-2">
          <button type="button" className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <PlusCircle className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-[var(--bg-primary)] rounded-md flex items-center">
            <input
              value={formValue}
              onChange={(e) => {
                setFormValue(e.target.value);
                handleTyping();
              }}
              placeholder="Send a message..."
              className="flex-1 bg-transparent text-[var(--text-primary)] px-4 py-2 focus:outline-none"
            />

            <div className="flex items-center px-2 space-x-2 text-[var(--text-secondary)]">
              <button type="button" className="p-2 hover:text-[var(--text-primary)]">
                <Gift className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 hover:text-[var(--text-primary)]">
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!formValue.trim()}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const { text, uid, photoURL, displayName, createdAt } = message;
  const isCurrentUser = uid === auth.currentUser?.uid;
  const timestamp = createdAt?.toDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-start space-x-3 group hover:bg-[var(--bg-secondary)] p-2 rounded`}
    >
      <img
        src={photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${uid}`}
        alt="avatar"
        className="w-10 h-10 rounded-full"
      />

      <div className="flex-1">
        <div className="flex items-baseline space-x-2">
          <span className="font-medium text-[var(--text-primary)]">{displayName}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {timestamp ? formatMessageDate(timestamp) : 'Sending...'}
          </span>
        </div>
        <p className="text-[var(--text-secondary)] mt-1">{text}</p>
      </div>
    </motion.div>
  );
}