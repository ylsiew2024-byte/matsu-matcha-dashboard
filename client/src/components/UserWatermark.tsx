import { useSecurity } from "@/contexts/SecurityContext";

export function UserWatermark() {
  const { userWatermark } = useSecurity();
  const watermarkText = userWatermark;
  
  return (
    <>
      {/* Diagonal watermark pattern across the entire screen */}
      <div 
        className="fixed inset-0 pointer-events-none z-[90] select-none"
        style={{
          opacity: 0.03,
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 100.5px
            )`,
          }}
        />
        {/* Repeating watermark text */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, rowIndex) => (
            <div 
              key={rowIndex}
              className="whitespace-nowrap"
              style={{
                transform: `rotate(-30deg) translateX(-50%)`,
                marginTop: `${rowIndex * 150}px`,
                marginLeft: '-100%',
                width: '300%',
              }}
            >
              {Array.from({ length: 10 }).map((_, colIndex) => (
                <span 
                  key={colIndex}
                  className="inline-block text-xs font-mono tracking-wider mx-16"
                  style={{ opacity: 0.5 }}
                >
                  {watermarkText}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Corner watermark - more visible */}
      <div className="fixed bottom-2 right-2 z-[91] pointer-events-none select-none">
        <div className="text-[10px] font-mono text-muted-foreground/30 text-right">
          <p>{watermarkText}</p>
        </div>
      </div>
    </>
  );
}

export default UserWatermark;
