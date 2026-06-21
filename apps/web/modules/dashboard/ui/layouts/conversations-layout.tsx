"use client";

import { usePathname } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ConversationsPanel } from "../components/conversations-panel";

export const ConversationsLayout = ({
  children
}: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  const isDetailActive = pathname && pathname !== "/conversations" && pathname !== "/";

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex h-full w-full md:hidden overflow-hidden">
        {isDetailActive ? (
          <div className="h-full w-full flex flex-col min-w-0 bg-background">
            {children}
          </div>
        ) : (
          <div className="h-full w-full flex flex-col min-w-0 bg-background">
            <ConversationsPanel />
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full w-full overflow-hidden">
        <ResizablePanelGroup className="h-full flex-1" direction="horizontal">
          <ResizablePanel defaultSize={30} maxSize={30} minSize={20}>
            <ConversationsPanel />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="h-full" defaultSize={70}>
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
};
