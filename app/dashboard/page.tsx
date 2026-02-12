import MobileHeader from "../components/MobileHeader";
import BottomNav from "../components/BottomNav";
import BalanceCard from "../components/BalanceCard";

export default function DashboardPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Dashboard" />

      <div className="p-4 space-y-4">
        <BalanceCard />

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Income</p>
            <p className="text-lg font-bold text-green-500">₹50,000</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Expense</p>
            <p className="text-lg font-bold text-red-500">₹18,000</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
