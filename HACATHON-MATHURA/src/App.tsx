import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Send, Loader2, X, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeImage } from './lib/gemini';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        setMimeType(file.type);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !prompt) return;

    setIsLoading(true);
    setError(null);
    try {
      const base64Data = image.split(',')[1];
      const response = await analyzeImage(base64Data, mimeType, prompt);
      setResult(response || 'No analysis available.');
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setMimeType('');
    setResult(null);
    setError(null);
    setPrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Suvidha AI</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="hidden sm:inline">Powered by Suvidha AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left Column: Upload & Input */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-2">Analyze your image</h2>
              <p className="text-gray-500 mb-6 text-sm">Upload a photo and ask anything about it.</p>

              <div
                onClick={() => !image && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer
                  ${image ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {!image ? (
                    <motion.div
                      key="upload-prompt"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP (max. 10MB)</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="image-preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm"
                    >
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            <section className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What's in this image? Describe it in detail..."
                  className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none bg-white shadow-sm"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    disabled={!image || !prompt || isLoading}
                    onClick={handleAnalyze}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100"
                >
                  <Info className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Analysis Result
              </h3>
              {result && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Copy text
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {!result && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <ImageIcon className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-sm">Results will appear here after analysis</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                </div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
                >
                  {result}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200 mt-12 text-center text-sm text-gray-400">
        <p>&copy; 2026 Suvidha AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
