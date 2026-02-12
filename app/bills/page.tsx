import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";

export default function BillsPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Bills" />

      <div className="p-4 space-y-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
          Electricity – due in 2 days
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
