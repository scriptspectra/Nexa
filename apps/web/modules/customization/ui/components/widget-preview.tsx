import { BotIcon, MicIcon, SendIcon } from "lucide-react";
import { FormSchema } from "../../types";

interface WidgetPreviewProps {
  values: Partial<FormSchema>;
  hasVapiPlugin: boolean;
}

export const WidgetPreview = ({ values, hasVapiPlugin }: WidgetPreviewProps) => {
  const primaryColor = values.primaryColor || "#3b82f6";
  const gradientEndColor = values.gradientEndColor || "";
  const backgroundColor = values.backgroundColor || "#ffffff";
  const greetMessage = values.greetMessage || "Hi! How can I help you today?";

  const headerBackground = gradientEndColor 
    ? `linear-gradient(to bottom, ${primaryColor}, ${gradientEndColor})`
    : primaryColor;

  return (
    <div className="w-full max-w-[360px] h-[600px] border rounded-xl overflow-hidden shadow-2xl flex flex-col mx-auto relative sticky top-8" style={{ backgroundColor }}>
      <div 
        className="p-4 text-white flex flex-col gap-2 relative shadow-sm z-10"
        style={{ background: headerBackground }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div className="font-medium text-lg">Chat</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-slate-800">
        <div className="flex gap-2 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1" style={{ color: primaryColor }}>
             <BotIcon className="w-5 h-5" />
          </div>
          <div className="bg-white border rounded-2xl rounded-tl-none p-3 text-sm shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            {greetMessage}
          </div>
        </div>

        <div className="flex gap-2 max-w-[85%] self-end flex-row-reverse">
          <div className="text-white rounded-2xl rounded-tr-none p-3 text-sm shadow-sm" style={{ background: headerBackground }}>
            I need help finding something.
          </div>
        </div>
        
        <div className="flex flex-col gap-2 items-end mt-4">
          {Object.values(values.defaultSuggestions || {}).map((suggestion, idx) => (
             suggestion ? (
               <div key={idx} className="text-xs bg-white border px-3 py-2 rounded-full cursor-pointer hover:bg-slate-50 transition-colors shadow-sm" style={{ borderColor: primaryColor, color: primaryColor }}>
                 {suggestion}
               </div>
             ) : null
          ))}
        </div>
      </div>

      <div className="p-3 bg-white border-t mt-auto flex flex-col gap-3">
        {hasVapiPlugin && values.vapiSettings?.assistantId && values.vapiSettings.assistantId !== "none" && (
           <div className="flex items-center justify-center border rounded-xl p-3 gap-2 bg-slate-50 text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors text-sm">
             <MicIcon className="w-4 h-4" /> Start Voice Call
           </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full border px-4 py-2 text-sm text-slate-400 flex items-center">
            Type your message...
          </div>
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm" style={{ background: headerBackground }}>
            <SendIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
