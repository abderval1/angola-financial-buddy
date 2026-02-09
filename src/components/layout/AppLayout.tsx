import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { WhatsAppButton } from "../support/WhatsAppButton";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <div className="lg:pl-64 transition-all duration-300">
        <AppHeader title={title} subtitle={subtitle} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
        <WhatsAppButton />
      </div>
    </div>
  );
}
