const ActivityItem = ({ title, time }) => {
  return (
    <div className="mb-2 rounded-lg bg-gray-100 p-3">
      <p className="text-sm">{title}</p>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
};

export default ActivityItem;
