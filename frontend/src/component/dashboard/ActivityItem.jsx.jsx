const ActivityItem = ({ title, time }) => {
  return (
    <div className="p-3 bg-gray-100 rounded-lg mb-2">
      <p className="text-sm">{title}</p>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
};

export default ActivityItem;