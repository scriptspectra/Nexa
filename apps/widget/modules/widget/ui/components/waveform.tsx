import { cn } from "@workspace/ui/lib/utils";

interface VoiceWaveformProps {
  isSpeaking: boolean;
  className?: string;
}

export const VoiceWaveform = ({ isSpeaking, className }: VoiceWaveformProps) => {
  return (
    <div className={cn("flex items-center gap-1 h-6", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-primary transition-all duration-300",
            isSpeaking ? "" : "h-1.5"
          )}
          style={
            isSpeaking
              ? {
                  animation: `waveform 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  height: "16%",
                }
              : undefined
          }
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes waveform {
            0%, 100% { height: 16%; }
            50% { height: 100%; }
          }
        `
      }} />
    </div>
  );
};
