import React, { useState } from 'react';
import { Plus, Hash } from 'lucide-react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { firestore, auth, createServer } from '../lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from './Modal';

interface Server {
  id: string;
  name: string;
  ownerId: string;
}

export function ServerList({ selectedServer, onSelectServer }: {
  selectedServer: string | null;
  onSelectServer: (serverId: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverName, setServerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [servers] = useCollectionData<Server>(
    firestore.collection('servers'),
    // .where('members', 'array-contains', auth.currentUser?.uid),
    { idField: 'id' }
  );

  // Select first server by default
  React.useEffect(() => {
    if (servers?.length && !selectedServer) {
      onSelectServer(servers[0].id);
    }
  }, [servers, selectedServer, onSelectServer]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !serverName.trim()) return;

    setLoading(true);
    try {
      const serverId = await createServer(serverName, auth.currentUser.uid);
      onSelectServer(serverId);
      toast.success('Server created successfully!');
      setIsModalOpen(false);
      setServerName('');
    } catch (error) {
      toast.error('Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-[72px] h-screen flex flex-col items-center py-3 space-y-2 bg-[var(--bg-primary)]">
        {servers?.map((server) => (
          <motion.button
            key={server.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectServer(server.id)}
            className={`w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-white hover:bg-[#5865f2] transition-colors
              ${selectedServer === server.id ? 'bg-[#5865f2]' : ''}`}
          >
            {server.name[0].toUpperCase()}
          </motion.button>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-[#3ba55c] hover:bg-[#3ba55c] hover:text-white transition-all border-white border-[0.1rem]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServerName('');
        }}
        title="Create a Server"
      >
        <form onSubmit={handleCreateServer}>
          <div className="space-y-4">
            <div>
              <label htmlFor="serverName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                SERVER NAME
              </label>
              <input
                type="text"
                id="serverName"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                placeholder="Enter server name"
                maxLength={100}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !serverName.trim()}
              className="w-full bg-[#5865f2] text-white py-2 px-4 rounded-md font-medium hover:bg-[#4752c4] transition-colors"
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}