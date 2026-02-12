import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Settings" />

      <div className="p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
          Profile
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
          Theme
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
          Logout (later)
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
