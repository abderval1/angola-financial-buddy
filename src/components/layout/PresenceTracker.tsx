
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

export function PresenceTracker() {
    useOnlinePresence();
    return null; // This component doesn't render anything visually
}
