import React, { useState } from 'react';
import { Hash, Volume2, Plus } from 'lucide-react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { firestore, createChannel } from '../lib/firebase';
import toast from 'react-hot-toast';
import { Modal } from './Modal';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
}

export function ChannelList({ serverId, selectedChannel, onSelectChannel }: {
  serverId: string;
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);

  const [channels] = useCollectionData<Channel>(
    firestore.collection('channels').where('serverId', '==', serverId),
    { idField: 'id' }
  );

  // Select first channel by default
  React.useEffect(() => {
    if (channels?.length && !selectedChannel) {
      onSelectChannel(channels[0].id);
    }
    // on serverId change select first channel
    if (channels?.length && selectedChannel) {
      const selectedChannelIndex = channels.findIndex((channel) => channel.id === selectedChannel);
      if (selectedChannelIndex === -1) {
        onSelectChannel(channels[0].id);
      }
    }
  }, [channels, selectedChannel, onSelectChannel, serverId]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setLoading(true);
    try {
      await createChannel(serverId, channelName, channelType);
      toast.success('Channel created successfully!');
      setIsModalOpen(false);
      setChannelName('');
      setChannelType('text');
    } catch (error) {
      toast.error('Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-60 bg-[#2b2d31] h-screen p-3 bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Channels</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {channels?.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-[#76828a] transition-colors
                ${selectedChannel === channel.id ? 'bg-[#a7b7c2] text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}
            >
              {channel.type === 'text' ? (
                <Hash className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span>{channel.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setChannelName('');
          setChannelType('text');
        }}
        title="Create Channel"
      >
        <form onSubmit={handleCreateChannel}>
          <div className="space-y-4">
            <div>
              <label htmlFor="channelName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                CHANNEL NAME
              </label>
              <input
                type="text"
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                placeholder="new-channel"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                CHANNEL TYPE
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="text"
                    checked={channelType === 'text'}
                    onChange={(e) => setChannelType(e.target.value as 'text' | 'voice')}
                    className="text-[#5865f2] focus:ring-[#5865f2]"
                  />
                  <span className="text-[var(--text-primary)]">Text Channel</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="voice"
                    checked={channelType === 'voice'}
                    onChange={(e) => setChannelType(e.target.value as 'text' | 'voice')}
                    className="text-[#5865f2] focus:ring-[#5865f2]"
                  />
                  <span className="text-[var(--text-primary)]">Voice Channel</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={!channelName.trim() || loading}
              className="w-full bg-[#5865f2] text-white py-2 px-4 rounded-md font-medium hover:bg-[#4752c4] transition-colors"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}