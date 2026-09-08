"use client";

import { usePathname } from "next/navigation";
import { ChatProvider } from "@/components/AiChat/ChatContext";

export default function ChatOptional({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return <ChatProvider>{children}</ChatProvider>;
}
