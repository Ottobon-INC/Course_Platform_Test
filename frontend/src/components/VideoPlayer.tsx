
import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  SkipBack,
  Settings
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  timestamp: number;
}

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  chapters?: Chapter[];
  autoPlay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  title,
  chapters = [],
  autoPlay = false,
  onProgress,
  onComplete
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const isSeekingRef = useRef(false);
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (onProgress && duration > 0) {
      onProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration, onProgress]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current);
      }
    };
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Clear any pending toggle
    if (toggleTimeoutRef.current) {
      clearTimeout(toggleTimeoutRef.current);
      toggleTimeoutRef.current = null;
    }
    
    // Immediately toggle the state
    setIsPlaying(prev => !prev);
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current || !isReady) return;

    isSeekingRef.current = true;
    const newTime = (value[0] / 100) * duration;
    playerRef.current.seekTo(newTime, 'seconds');
    setCurrentTime(newTime);
    
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 200);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    if (!playerRef.current || !isReady) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    playerRef.current.seekTo(newTime, 'seconds');
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const playerWrapper = playerRef.current?.wrapper;
    if (!playerWrapper) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerWrapper.requestFullscreen();
    }
  };

  const handlePlaybackRateChange = (rate: string) => {
    const newRate = parseFloat(rate);
    setPlaybackRate(newRate);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!isSeekingRef.current) {
      setCurrentTime(state.playedSeconds);
    }
  };

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onComplete?.();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChapterMarkers = () => {
    if (!chapters.length || !duration) return [];
    
    return chapters.map(chapter => ({
      ...chapter,
      position: (chapter.timestamp / duration) * 100
    }));
  };

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-testid="container-video-player"
    >
      <div className="w-full aspect-video">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onReady={(player) => {
            handleReady();
            setDuration(player.getDuration());
          }}
          onEnded={handleEnded}
          width="100%"
          height="100%"
          progressInterval={1000}
          config={{
            youtube: {
              playerVars: { 
                showinfo: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                origin: window.location.origin
              }
            },
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
          data-testid="video-element"
        />
      </div>

      {/* Chapter Markers */}
      {getChapterMarkers().map(marker => (
        <div
          key={marker.id}
          className="absolute top-0 w-0.5 h-1 bg-white/60"
          style={{ left: `${marker.position}%` }}
          title={marker.title}
          data-testid={`chapter-marker-${marker.id}`}
        />
      ))}

      {/* Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Button
          size="icon"
          variant="ghost"
          className={`w-16 h-16 bg-black/50 hover:bg-black/70 text-white pointer-events-auto transition-opacity ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => togglePlay(e)}
          data-testid="button-play-pause-overlay"
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`} data-testid="container-video-controls">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[duration ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={!isReady}
            data-testid="slider-video-progress"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span data-testid="text-current-time">{formatTime(currentTime)}</span>
            <span data-testid="text-duration">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => skip(-10)}
              disabled={!isReady}
              data-testid="button-skip-back"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={(e) => togglePlay(e)}
              disabled={!isReady}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => skip(10)}
              disabled={!isReady}
              data-testid="button-skip-forward"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
                data-testid="button-mute"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                className="w-20"
                data-testid="slider-volume"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
              <SelectTrigger className="w-20 h-8 text-white border-white/20 bg-transparent" data-testid="select-playback-rate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              data-testid="button-fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
