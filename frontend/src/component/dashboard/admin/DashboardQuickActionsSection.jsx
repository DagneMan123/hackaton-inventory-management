import QuickAction from "../QuickAction.jsx";
import SectionCard from "../SectionCard.jsx";

const DashboardQuickActionsSection = ({ actions }) => {
  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => (
          <QuickAction
            key={action.label}
            icon={action.icon}
            label={action.label}
            path={action.path}
          />
        ))}
      </div>
    </SectionCard>
  );
};

export default DashboardQuickActionsSection;
