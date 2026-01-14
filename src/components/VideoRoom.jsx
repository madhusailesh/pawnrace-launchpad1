import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react';
import { 
  Settings, Mic, MicOff, Video, VideoOff, 
  MonitorUp, X, Image as ImageIcon, Sparkles, Ban 
} from 'lucide-react';
import '@livekit/components-styles';
import { BackgroundProcessor } from '@livekit/track-processors'; 
import apiClient from '../lib/api'; 
import { Loader2 } from 'lucide-react';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

const VideoRoom = ({ roomId }) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await apiClient.get(`/livekit/token?roomId=${roomId}`);
        setToken(res.data.token);
      } catch (error) {
        console.error("Failed to connect to video:", error);
      }
    };
    if (roomId) fetchToken();
  }, [roomId]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-900 text-zinc-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span className="text-xs font-medium tracking-wide">CONNECTING...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 rounded-lg group">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
      >
        {/* DEFAULT LIVEKIT CONTROLS DISABLED */}
        <VideoConference controls={false} />
        <RoomAudioRenderer />

        {/* ALL FEATURES LIVE INSIDE SETTINGS */}
        <CustomControlOverlay />
      </LiveKitRoom>
    </div>
  );
};

// ---------------- SETTINGS OVERLAY ----------------

const CustomControlOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const [bgType, setBgType] = useState('none');
  const [processor, setProcessor] = useState(null);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled
    );
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(
      !localParticipant.isCameraEnabled
    );
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(
      !localParticipant.isScreenShareEnabled
    );
    setIsOpen(false);
  };

  const handleBackgroundChange = async (type) => {
    const videoTrack =
      localParticipant.videoTrackPublications.values().next().value?.track;
    if (!videoTrack) return;

    try {
      setBgType(type);

      if (type === 'none') {
        if (processor) {
          await videoTrack.stopProcessor();
          setProcessor(null);
        }
        return;
      }

      let newProcessor;

      if (type === 'blur') {
        newProcessor = BackgroundProcessor({
          mode: 'background-blur',
          blurRadius: 15,
        });
      }

      if (type === 'image') {
        newProcessor = BackgroundProcessor({
          mode: 'virtual-background',
          imagePath:
            'src\assets\background.png',
        });
      }

      await videoTrack.setProcessor(newProcessor);
      setProcessor(newProcessor);
    } catch (err) {
      console.error("Failed to apply background effect:", err);
    }
  };

  return (
    <>
      {/* SETTINGS BUTTON */}
      <div className="absolute bottom-6 right-6 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-full shadow-xl transition-all transform hover:scale-105 border border-white/10 ${
            isOpen
              ? 'bg-white text-black'
              : 'bg-zinc-900/90 text-white hover:bg-zinc-800 backdrop-blur-md'
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </button>
      </div>

      {/* SETTINGS PANEL */}
      {isOpen && (
        <div className="absolute bottom-20 right-6 w-72 bg-[#18181B] border border-white/10 rounded-2xl shadow-2xl p-5 z-[59] animate-in slide-in-from-bottom-5 fade-in duration-200">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
            Controls
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MenuButton
                active={localParticipant.isCameraEnabled}
                onClick={toggleCam}
                icon={localParticipant.isCameraEnabled ? Video : VideoOff}
                label={localParticipant.isCameraEnabled ? 'Cam On' : 'Cam Off'}
              />
              <MenuButton
                active={localParticipant.isMicrophoneEnabled}
                onClick={toggleMic}
                icon={localParticipant.isMicrophoneEnabled ? Mic : MicOff}
                label={
                  localParticipant.isMicrophoneEnabled ? 'Mic On' : 'Muted'
                }
              />
            </div>

            <button
              onClick={toggleScreenShare}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                localParticipant.isScreenShareEnabled
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-zinc-800/50 text-zinc-300 border-white/5 hover:bg-zinc-800'
              }`}
            >
              <MonitorUp className="w-4 h-4" />
              {localParticipant.isScreenShareEnabled
                ? 'Stop Sharing'
                : 'Share Screen'}
            </button>

            <div className="pt-4 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                Background
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <BgOption
                  active={bgType === 'none'}
                  onClick={() => handleBackgroundChange('none')}
                  icon={Ban}
                  label="None"
                />
                <BgOption
                  active={bgType === 'blur'}
                  onClick={() => handleBackgroundChange('blur')}
                  icon={Sparkles}
                  label="Blur"
                />
                <BgOption
                  active={bgType === 'image'}
                  onClick={() => handleBackgroundChange('image')}
                  icon={ImageIcon}
                  label="Image"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---------------- HELPERS ----------------

const MenuButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all border ${
      active
        ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-900/20'
        : 'bg-zinc-800/50 text-red-400 border-red-500/10 hover:bg-zinc-800'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-bold uppercase tracking-wide">
      {label}
    </span>
  </button>
);

const BgOption = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg transition-all border ${
      active
        ? 'bg-zinc-700 text-white border-white/20'
        : 'bg-zinc-900 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

export default VideoRoom;
