import MobileHeader from "../components/MobileHeader";
import BottomNav from "../components/BottomNav";

const bills = [
  { name: "Electricity", due: "2 days" },
  { name: "Netflix", due: "5 days" },
];

export default function BillsPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Bills" />

      <div className="p-4 space-y-3">
        {bills.map((b, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl flex justify-between"
          >
            <span>{b.name}</span>
            <span className="text-sm text-gray-500">
              Due in {b.due}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
