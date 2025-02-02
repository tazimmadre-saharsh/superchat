/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from "react";
import { MessageSquare, LogOut, Send, Menu, Hash, Smile, PlusCircle, AtSign, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/messaging";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

firebase.initializeApp({
  apiKey: "AIzaSyCbQ8iRO-ydbUBATcq7Ej5L4TDEptqjgAU",
  authDomain: "superchat-22eaa.firebaseapp.com",
  databaseURL: "https://superchat-22eaa-default-rtdb.firebaseio.com",
  projectId: "superchat-22eaa",
  storageBucket: "superchat-22eaa.appspot.com",
  messagingSenderId: "619162059122",
  appId: "1:619162059122:web:5280d9512f56bc16089deb",
  measurementId: "G-6XKVE61VN3",
});

const auth: any = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// Request notification permission
async function requestNotificationPermission() {
  try {
    await messaging.requestPermission();
    const token = await messaging.getToken();
    return token;
  } catch (error) {
    console.error("Error getting permission", error);
  }
}

function App() {
  const [user] = useAuthState(auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      requestNotificationPermission().then((token) => {
        if (token) {
          // Store the token in the user's document
          firestore.collection('users').doc(user.uid).set({
            fcmToken: token,
            online: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),

          }, { merge: true });
        }
      });

      // Set up presence system
      const userStatusRef = firestore.collection('users').doc(user.uid);

      // Set user as online
      userStatusRef.set({
        online: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        photoURL: user.photoURL,
        displayName: user.displayName
      }, { merge: true });

      // Set user as offline when they leave
      const handleBeforeUnload = () => {
        userStatusRef.set({
          online: false,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user, firestore]);

  return (
    <div className="h-screen flex bg-[#313338] text-gray-100">
      {user && (
        <div className={`${sidebarOpen ? 'w-60' : 'w-0'} transition-all duration-300 bg-[#2B2D31] h-screen flex-shrink-0`}>
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-6 h-6" />
              <span className="font-semibold">Superchat</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <OnlineUsers />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {user ? (
          <>
            <header className="h-14 border-b border-gray-700 flex items-center px-4 justify-between bg-[#313338]">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold">general</h2>
              </div>
              <SignOut />
            </header>
            <Chatroom />
          </>
        ) : (
          <Signin />
        )}
      </div>
    </div>
  );
}

function OnlineUsers() {
  const [users] = useCollectionData(
    firestore.collection('users').where('online', '==', true),
    { idField: 'id' }
  );

  return (
    <div className="p-4">
      <h3 className="text-gray-400 uppercase text-xs font-semibold mb-2">Online — {users?.length || 0}</h3>
      <div className="space-y-2">
        {users?.map((user) => (
          <div key={user.id} className="flex items-center space-x-2">
            <div className="relative">
              <img src={user.photoURL || 'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg'} alt="" className="w-8 h-8 rounded-full" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2B2D31]"></div>
            </div>
            <span className="text-sm">{user.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Signin() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#313338]">
      <div className="p-8 bg-[#2B2D31] rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-8">Welcome to Superchat</h2>
        <p className="text-gray-400 text-center mb-6">Join the conversation!</p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] transition-colors rounded-md font-medium flex items-center justify-center space-x-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

function SignOut() {
  const handleSignOut = async () => {
    if (auth.currentUser) {
      const userRef = firestore.collection('users').doc(auth.currentUser.uid);
      await userRef.set({
        online: false,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      auth.signOut();
    }
  };

  return auth.currentUser && (
    <button
      className="flex items-center space-x-2 px-3 py-1.5 bg-[#4752C4] hover:bg-[#3C45A5] rounded-md transition-colors"
      onClick={handleSignOut}
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}

function Chatroom() {
  const messagesEndRef = useRef<any>(null);
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limitToLast(50);
  const [messages] = useCollectionData(query, { idField: "id" });
  const [formValue, setFormValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateTypingStatus = () => {
    if (!isTyping) {
      setIsTyping(true);
      firestore.collection('users').doc(auth.currentUser.uid).set({
        isTyping: true
      }, { merge: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      firestore.collection('users').doc(auth.currentUser.uid).set({
        isTyping: false
      }, { merge: true });
    }, 1500);
  };

  const sendMessage = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    const { uid, photoURL, displayName } = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName,
    });
    setFormValue("");
    scrollToBottom();

    // Send notification to all users except sender
    const users = await firestore.collection('users').get();
    users.docs.forEach(doc => {
      if (doc.id !== uid && doc.data().fcmToken) {
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAkCjvQXI:APA91bEX4TLnxvBq-tTsLhHe9at-kRa3PbtSTXvEBBDMqLcPGfNF9lfxc9A7vAxTgY1fSY0PcE5OlyECRm68kCOlcTU21-y4tafJ40NgfKVzJzugCEFKCF3LiAGKXodJVO8JdNTV_2QH'
          },
          body: JSON.stringify({
            to: doc.data().fcmToken,
            notification: {
              title: `New message from ${displayName}`,
              body: formValue
            }
          })
        });
      }
    });
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#313338]">
        <AnimatePresence>
          {messages?.map((msg: any) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      <form onSubmit={sendMessage} className="p-4 bg-[#383A40]">
        <div className="flex items-center space-x-2">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-100">
            <PlusCircle className="w-5 h-5" />
          </button>
          <div className="flex-1 bg-[#2B2D31] rounded-md flex items-center">
            <input
              className="flex-1 bg-transparent text-gray-100 px-4 py-2 focus:outline-none"
              placeholder="Send a message..."
              value={formValue}
              onChange={(e) => {
                setFormValue(e.target.value);
                updateTypingStatus();
              }}
            />
            <div className="flex items-center px-2 space-x-2 text-gray-400">
              <button type="button" className="p-2 hover:text-gray-100">
                <Gift className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 hover:text-gray-100">
                <Gift className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 hover:text-gray-100">
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!formValue.trim()}
            className="p-2 text-gray-400 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  );
}

function ChatMessage(props: { message: { id?: any; reactions?: any; text?: any; uid?: any; photoURL?: any; displayName?: any; createdAt?: any; }; }) {
  const { text, uid, photoURL, displayName, createdAt } = props.message;
  const messageClass = auth.currentUser && uid === auth.currentUser.uid ? "ml-auto" : "";
  const [showActions, setShowActions] = useState(false);

  function getTimeFromDate(timestamp: { seconds: number; }) {
    if (!timestamp) return "";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const handleReaction = async (emoji: string) => {
    const messageRef = firestore.collection("messages").doc(props.message.id);
    await messageRef.update({
      reactions: firebase.firestore.FieldValue.arrayUnion({
        emoji,
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName
      })
    });
  };

  return (
    <motion.div
      className={`group flex items-start space-x-3 max-w-2xl hover:bg-[#2E3035] rounded p-2 ${messageClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src={photoURL}
        alt="avatar"
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1">
        <div className="flex items-baseline space-x-2">
          <span className="font-medium text-[#5865F2]">{displayName}</span>
          <span className="text-xs text-gray-400">
            {createdAt ? getTimeFromDate(createdAt) : ""}
          </span>
        </div>
        <p className="text-gray-300 mt-1 break-words">{text}</p>
        {props.message.reactions && (
          <div className="flex gap-1 mt-2">
            {props.message.reactions.map((reaction: { emoji: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
              <span key={index} className="bg-[#2B2D31] text-sm px-2 py-1 rounded-full">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
      {showActions && (
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleReaction('👍')}
            className="p-1 hover:bg-[#2B2D31] rounded"
          >
            👍
          </button>
          <button
            onClick={() => handleReaction('❤️')}
            className="p-1 hover:bg-[#2B2D31] rounded"
          >
            ❤️
          </button>
          <button className="text-gray-400 hover:text-gray-100">
            <AtSign className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default App;