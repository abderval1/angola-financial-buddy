import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";
import { MobileNav } from "./MobileNav";
import { NotificationCenter } from "./NotificationCenter";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useTranslation } from "react-i18next";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { t } = useTranslation();
  const displayTitle = title || t("Dashboard");
  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-sidebar-border lg:border-border bg-sidebar lg:bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Menu - Matches sidebar background on mobile */}
        <div className="lg:hidden -ml-2 sm:-ml-4">
          <MobileNav />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-white lg:text-foreground truncate">{displayTitle}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-white/70 lg:text-muted-foreground truncate hidden sm:block">{subtitle}</p>
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
