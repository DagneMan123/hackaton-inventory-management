const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-4">
      <div>
        <p className="text-sm text-gray-500 mb-5">{title}</p>
        <h2 className="font-semibold">{value}</h2>

      </div>

      <div className={`rounded-lg p-3`}>{icon}</div>
    </div>
  );
};

export default StatsCard;
