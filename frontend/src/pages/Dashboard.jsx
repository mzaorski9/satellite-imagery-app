import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="flex flex-col gap-4 items-center">
        <button
          onClick={() => navigate("new_task")}
          className="px-5 py-3 rounded-lg bg-blue-700 text-white font-semibold text-base hover:bg-blue-800 active:scale-[0.98] transition-all cursor-pointer"
        >
          Generate New Task
        </button>
        <button
          onClick={() => navigate("history")}
          className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 active:scale-[0.98] transition-all cursor-pointer"
        >
          Get Task History
        </button>
      </div>
    </div>
  );
}

export default Dashboard;