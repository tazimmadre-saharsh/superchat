import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, requestNotificationPermission } from './lib/firebase';
import { useTheme } from './hooks/useTheme';
import { ServerList } from './components/ServerList';
import { ChannelList } from './components/ChannelList';
import { Chat } from './components/Chat';
import firebase from './lib/firebase';
function App() {
  const [user, loading] = useAuthState(auth);
  const { theme, setTheme } = useTheme();
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#313338]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#5865f2]"></div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="flex h-screen">
      <Toaster position="top-right" />

      <ServerList
        selectedServer={selectedServer}
        onSelectServer={setSelectedServer}
      />

      {selectedServer && (
        <ChannelList
          serverId={selectedServer}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      )}

      <div className="flex-1 flex flex-col">
        <header className="h-12 bg-[var(--bg-primary)] border-b border-[#1e1f22] flex items-center justify-between px-4">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {selectedChannel ? '#general' : 'Select a channel'}
          </h2>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2e3035]"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </header>

        {selectedChannel ? (
          <Chat channelId={selectedChannel} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#313338] text-gray-400">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#313338]">
      <div className="bg-[#2b2d31] p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Welcome to Discord Clone
        </h1>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-[#5865f2] text-white py-3 px-4 rounded-md font-medium hover:bg-[#4752c4] transition-colors flex items-center justify-center space-x-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

export default App;