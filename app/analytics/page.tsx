import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

export default function AnalyticsPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Analytics" />

      <div className="p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl text-center">
          Analytics coming soon
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
