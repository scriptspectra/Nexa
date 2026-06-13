import { cn } from "@workspace/ui/lib/utils";
import { useAtomValue } from "jotai";
import { widgetSettingsAtom } from "../../atoms/widget-atoms";

export const WidgetHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const primary = widgetSettings?.primaryColor || "var(--primary)";
  const gradientEnd = widgetSettings?.gradientEndColor;
  
  const background = gradientEnd 
    ? `linear-gradient(to bottom, ${primary}, ${gradientEnd})`
    : primary;

  return (
    <header 
      className={cn(
        "p-4 text-primary-foreground",
        className,
      )}
      style={{ background }}
    >
      {children}
    </header>
  );
};
