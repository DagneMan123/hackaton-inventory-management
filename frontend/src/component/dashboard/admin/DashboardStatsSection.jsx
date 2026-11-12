import { useContext } from "react";
import StatsCard from "../StatsCard.jsx";
import { UserContext } from "../../../context/UserContext.jsx";

const DashboardStatsSection = () => {
  const { stats } = useContext(UserContext);

  const dashboardStats = [
    {
      title: "Total Employees",
      value: stats.total || 0,
      color: "bg-blue-500",
    },
    {
      title: "Active Employees",
      value: stats.active || 0,
      color: "bg-green-500",
    },
    {
      title: "Full Time",
      value: stats.fullTime || 0,
      color: "bg-purple-500",
    },
    {
      title: "Part Time",
      value: stats.partTime || 0,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          color={stat.color}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};

export default DashboardStatsSection;
