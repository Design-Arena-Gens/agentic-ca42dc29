'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState(3);
  const [effect, setEffect] = useState('zoom-in');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;

    setIsGenerating(true);
    try {
      // Create video using canvas and MediaRecorder API
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Load image
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => { img.onload = resolve; });

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Set up MediaRecorder
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsGenerating(false);
      };

      mediaRecorder.start();

      // Animate based on effect
      const fps = 30;
      const totalFrames = duration * fps;
      let frame = 0;

      const animate = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        const progress = frame / totalFrames;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        switch (effect) {
          case 'zoom-in':
            const scale = 1 + progress * 0.5;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;

          case 'zoom-out':
            const scaleOut = 1.5 - progress * 0.5;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scaleOut, scaleOut);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;

          case 'pan-left':
            const panLeft = -progress * canvas.width * 0.3;
            ctx.translate(panLeft, 0);
            ctx.scale(1.3, 1.3);
            break;

          case 'pan-right':
            const panRight = progress * canvas.width * 0.3;
            ctx.translate(panRight, 0);
            ctx.scale(1.3, 1.3);
            break;

          case 'pan-up':
            const panUp = -progress * canvas.height * 0.3;
            ctx.translate(0, panUp);
            ctx.scale(1.3, 1.3);
            break;

          case 'pan-down':
            const panDown = progress * canvas.height * 0.3;
            ctx.translate(0, panDown);
            ctx.scale(1.3, 1.3);
            break;

          case 'rotate':
            const rotation = progress * Math.PI * 2;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;

          case 'fade':
            ctx.globalAlpha = progress < 0.5 ? progress * 2 : 2 - progress * 2;
            break;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        frame++;
        setTimeout(animate, 1000 / fps);
      };

      animate();

    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to generate video');
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = 'generated-video.webm';
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          Image to Video Generator
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Transform your static images into dynamic videos with animated effects
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {!image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-white/30 rounded-xl p-16 text-center cursor-pointer hover:border-white/50 transition-all duration-300 hover:bg-white/5"
            >
              <svg
                className="w-20 h-20 mx-auto mb-4 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xl text-white/80 mb-2">Click to upload an image</p>
              <p className="text-sm text-white/50">PNG, JPG, GIF up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt="Uploaded"
                  className="w-full h-auto max-h-96 object-contain mx-auto bg-black/20"
                />
                <button
                  onClick={() => {
                    setImage(null);
                    setVideoUrl(null);
                  }}
                  className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Duration (seconds)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-white/70 text-sm mt-1">{duration}s</p>
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Effect
                  </label>
                  <select
                    value={effect}
                    onChange={(e) => setEffect(e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="zoom-in">Zoom In</option>
                    <option value="zoom-out">Zoom Out</option>
                    <option value="pan-left">Pan Left</option>
                    <option value="pan-right">Pan Right</option>
                    <option value="pan-up">Pan Up</option>
                    <option value="pan-down">Pan Down</option>
                    <option value="rotate">Rotate</option>
                    <option value="fade">Fade In/Out</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Video...
                  </span>
                ) : (
                  'Generate Video'
                )}
              </button>

              {videoUrl && (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-auto max-h-96 mx-auto"
                    />
                  </div>
                  <button
                    onClick={downloadVideo}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg"
                  >
                    Download Video
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">🎬</div>
            <h3 className="text-white font-bold mb-2">Multiple Effects</h3>
            <p className="text-white/60 text-sm">Choose from 8 dynamic animation effects</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-white font-bold mb-2">Instant Generation</h3>
            <p className="text-white/60 text-sm">Create videos in seconds with browser-based processing</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-3">💾</div>
            <h3 className="text-white font-bold mb-2">Easy Download</h3>
            <p className="text-white/60 text-sm">Download your generated videos instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
