import { useRef, useEffect } from 'react';

interface TeleprompterDisplayProps {
  content: string;
  fontSize: number;
  scrollPosition: number;
  onMaxScroll: (max: number) => void;
}

export function TeleprompterDisplay({
  content,
  fontSize,
  scrollPosition,
  onMaxScroll,
}: TeleprompterDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      onMaxScroll(Math.max(maxScroll, 0));
    }
  }, [content, fontSize, onMaxScroll]);

  return (
    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
      {/* Scroll container */}
      <div
        ref={contentRef}
        className="w-full h-full px-8 py-12 text-white text-center overflow-hidden"
        style={{
          transform: `translateY(-${scrollPosition}px)`,
          fontSize: `${fontSize}px`,
          lineHeight: '1.6',
          transition: 'transform 0.05s linear',
        }}
      >
        {content ? (
          <div className="whitespace-pre-wrap break-words">
            {content}
          </div>
        ) : (
          <div className="text-gray-500 text-2xl">
            Enter your script to begin
          </div>
        )}
      </div>

      {/* Fade overlays */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
