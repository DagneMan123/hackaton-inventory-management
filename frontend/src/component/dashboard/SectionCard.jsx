const SectionCard = ({ title, action, children }) => {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-950">{title}</h3>
        {action ? (
          <button className="text-sm font-medium text-gray-500 hover:text-gray-950">
            {action}
          </button>
        ) : null}
      </div>

      {children}
    </div>
  );
};

export default SectionCard;
