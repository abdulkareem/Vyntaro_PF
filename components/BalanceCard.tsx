export default function BalanceCard({ title, amount }: { title: string; amount: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-1">{amount}</h2>
    </div>
  );
}
