import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon
} from "lucide-react";

interface MediaPlayerProps {
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  language: 'ar' | 'en';
}

const MediaPlayer = ({ imageUrl, videoUrl, audioUrl, language }: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoUrl && videoRef.current) {
      videoRef.current.muted = !isMuted;
    } else if (audioUrl && audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // If no media is provided, don't render anything
  if (!imageUrl && !videoUrl && !audioUrl) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Image Display */}
          {imageUrl && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white/80">
                  {language === 'ar' ? 'صورة السؤال' : 'Question Image'}
                </span>
              </div>
              <img 
                src={imageUrl} 
                alt={language === 'ar' ? 'صورة السؤال' : 'Question Image'}
                className="w-full max-h-64 object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Video Player */}
          {videoUrl && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <VideoIcon className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white/80">
                  {language === 'ar' ? 'فيديو السؤال' : 'Question Video'}
                </span>
              </div>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-h-64 object-contain rounded-lg shadow-lg"
                  onEnded={handleVideoEnded}
                  onError={(e) => {
                    console.error('Video error:', e);
                  }}
                >
                  <source src={videoUrl} type="video/mp4" />
                  {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support video playback'}
                </video>
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePlayPause}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleMute}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleFullscreen}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <AudioIcon className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-white/80">
                  {language === 'ar' ? 'صوت السؤال' : 'Question Audio'}
                </span>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <audio
                  ref={audioRef}
                  onEnded={handleAudioEnded}
                  onError={(e) => {
                    console.error('Audio error:', e);
                  }}
                >
                  <source src={audioUrl} type="audio/mpeg" />
                  {language === 'ar' ? 'متصفحك لا يدعم تشغيل الصوت' : 'Your browser does not support audio playback'}
                </audio>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePlayPause}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span className="mr-2">
                      {isPlaying 
                        ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause')
                        : (language === 'ar' ? 'تشغيل' : 'Play')
                      }
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleMute}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="mr-2">
                      {isMuted 
                        ? (language === 'ar' ? 'إلغاء كتم الصوت' : 'Unmute')
                        : (language === 'ar' ? 'كتم الصوت' : 'Mute')
                      }
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPlayer;
