import React, { useState, useRef, useEffect } from 'react';

export interface VerificationViewProps {
  imageUrl: string;
  initialReading: string;
  onConfirm: (finalValue: string) => void;
  onRetake: () => void;
}

const VerificationView: React.FC<VerificationViewProps> = ({
  imageUrl,
  initialReading,
  onConfirm,
  onRetake,
}) => {
  const [displayValue, setDisplayValue] = useState(initialReading);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(initialReading);
  }, [initialReading]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleConfirm = () => {
    onConfirm(displayValue.trim() || initialReading);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full min-h-screen w-full bg-[#0a0a0a] text-[#39FF14] font-mono overflow-auto box-border"
      style={{
        paddingLeft: 'max(20px, env(safe-area-inset-left))',
        paddingRight: 'max(20px, env(safe-area-inset-right))',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
      }}
    >
      {/* 证据大图：荧光绿边框 */}
      <div className="flex-shrink-0 w-full max-w-lg mx-auto mt-4">
        <div
          className="relative w-full rounded-lg overflow-hidden border-2 border-[#39FF14]"
          style={{ boxShadow: '0 0 12px rgba(57, 255, 20, 0.5)' }}
        >
          <img
            src={imageUrl}
            alt="Evidence capture"
            className="w-full h-auto block object-contain max-h-[40vh]"
          />
        </div>
      </div>

      {/* 数据展示区 */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 min-h-0">
        <h2
          className="text-xs uppercase tracking-widest mb-4 text-[#39FF14] font-mono"
          style={{ textShadow: '0 0 8px rgba(57, 255, 20, 0.6)' }}
        >
          AI DATA EXTRACTION
        </h2>

        <div className="w-full max-w-xs flex justify-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => setDisplayValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              className="w-full text-center text-4xl md:text-5xl font-mono bg-[#0a0a0a] text-[#39FF14] border-2 border-[#39FF14] rounded px-3 py-2 outline-none"
              style={{ boxShadow: '0 0 16px rgba(57, 255, 20, 0.4)' }}
              aria-label="Edit extracted value"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full min-h-[3rem] text-4xl md:text-5xl font-mono text-[#39FF14] bg-transparent border-2 border-transparent rounded px-3 py-2 transition-all duration-200 hover:border-[#39FF14] hover:shadow-[0_0_16px_rgba(57,255,20,0.3)] active:scale-[0.98] cursor-pointer"
              style={{ textShadow: '0 0 12px rgba(57, 255, 20, 0.5)' }}
              aria-label="Click to edit value"
            >
              {displayValue || '—'}
            </button>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex-shrink-0 flex gap-4 justify-center items-center py-6">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 max-w-[160px] py-3 px-4 font-mono text-sm uppercase tracking-wider rounded border-2 border-amber-500 text-amber-500 bg-transparent transition-all duration-200 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer"
        >
          RETAKE
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 max-w-[160px] py-3 px-4 font-mono text-sm uppercase tracking-wider rounded border-2 border-[#39FF14] text-[#39FF14] bg-[rgba(57,255,20,0.08)] transition-all duration-200 hover:bg-[rgba(57,255,20,0.15)] active:scale-95 cursor-pointer"
          style={{ boxShadow: '0 0 14px rgba(57, 255, 20, 0.4)' }}
        >
          SYNC TO CLOUD
        </button>
      </div>
    </div>
  );
};

export default VerificationView;
