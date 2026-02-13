import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";
import { MobileNav } from "./MobileNav";
import { NotificationCenter } from "./NotificationCenter";
import { GlobalSearch } from "@/components/search/GlobalSearch";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title = "Dashboard", subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Menu */}
        <MobileNav />

        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <GlobalSearch />
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
