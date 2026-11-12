import ActivityItem from "../ActivityItem.jsx";
import SectionCard from "../SectionCard.jsx";

const DashboardActivitySection = ({ activities }) => {
  return (
    <SectionCard title="Recent Activities" action="View All">
      {activities.map((activity) => (
        <ActivityItem
          key={`${activity.title}-${activity.time}`}
          title={activity.title}
          time={activity.time}
        />
      ))}
    </SectionCard>
  );
};

export default DashboardActivitySection;
