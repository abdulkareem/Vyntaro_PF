import MobileHeader from "../components/MobileHeader";
import BottomNav from "../components/BottomNav";

const data = [
  { name: "Swiggy", amt: -800 },
  { name: "Amazon", amt: -3200 },
  { name: "Salary", amt: 50000 },
];

export default function TransactionsPage() {
  return (
    <div className="pb-20">
      <MobileHeader title="Transactions" />

      <div className="p-4 space-y-3">
        {data.map((t, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl flex justify-between"
          >
            <span>{t.name}</span>
            <span className={t.amt < 0 ? "text-red-500" : "text-green-500"}>
              ₹{Math.abs(t.amt)}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
