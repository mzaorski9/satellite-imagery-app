// src/pages/HistoryPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.js";

const rowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid #eee",
};

const thumbStyle = {
  width: 120,
  height: 80,
  objectFit: "cover",
  background: "#f3f3f3",
  display: "block",
};


export default function HistoryPage() {
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleDownload = async (resultUrl) => {
            // create and click an anchor to trigger browser download / open
        const url = `${API_BASE}${resultUrl}`;
        const a = document.createElement("a");
        a.href = url;
        // attempt to force download; leave empty so browser decides filename
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleDelete = async (taskId) => {

        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/tasks/delete_task/${taskId}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
        
            alert("Task deleted successfully");
            setTasks(prev => prev.filter(pos => pos.task_id !== taskId));
        } catch (err) {
            console.error(err);
            alert("Error deleting task");
        }
    };

    useEffect(() => {
        let mounted = true;
        let intervalId = null;

        const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tasks/show_tasks/`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();

            if (!mounted) return;
            setTasks(data);
            setError(null);

            // if every task is SUCCESS or FAILED, we can stop polling
            const stillRunning = data.some(
            (t) => t.status !== "SUCCESS" && t.status !== "FAILED"
            );
            if (!stillRunning && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            }
        } catch (err) {
            console.error("Polling error:", err);
            if (mounted) setError(err.message || "Unknown error");
        }
        };

        // immediate fetch then poll every 5s
        fetchTasks();
        intervalId = setInterval(fetchTasks, 5000);

        return () => {
        mounted = false;
        if (intervalId) clearInterval(intervalId);
        };
    }, []); 

    if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
    if (!tasks) return <div style={{ padding: 20 }}>Loading task history...</div>;
    if (tasks.length === 0) return <div style={{ padding: 20 }}>No tasks yet.</div>;

    return (
        <div style={{ padding: 16 }}>
        <h2>Task history</h2>
        <div style={{ border: "1px solid #e6e6e6", borderRadius: 6, overflow: "hidden" }}>
            {tasks.map((task) => {
            // fields your view returned: task_id, analysis_type, status, result_url, created_at
            const id = task.task_id ?? task.id ?? task.taskId;
            const thumbnail =
                task.result_url && task.status === "SUCCESS"
                ? `${API_BASE}${task.result_url}`
                : null;

            return (
                <div key={id} style={rowStyle}>
                <div style={{ width: 140 }}>
                    {thumbnail ? (
                    <img src={thumbnail} alt={`task-${id}`} style={thumbStyle} />
                    ) : (
                    <div style={{ ...thumbStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#777" }}>
                        {task.status === "PENDING" ? "Queued" : task.status === "RUNNING" ? "Processing" : "No preview"}
                    </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                    {(task.analysis_type ? task.analysis_type.toUpperCase() : "TASK")}{task.comparison ? " • HEATMAP" : ""}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>{new Date(task.created_at).toLocaleString()}</div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>Status: <strong>{task.status}</strong></div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button
                    onClick={() => navigate(`/dashboard/task_status/${id}`)}
                    style={{ padding: "8px 12px", cursor: "pointer" }}
                    >
                        Show
                    </button>

                    {task.result_url ? (
                        <button
                            onClick={() => handleDownload(task.result_url)}
                            style={{ padding: "8px 12px", cursor: "pointer" }}
                        >
                            Download
                        </button>
                    ) : (
                        <button disabled style={{ padding: "8px 12px", opacity: 0.6 }}>
                            Download
                        </button>
                    )}
                    <button 
                        onClick={() => handleDelete(task.task_id)}
                        style={{ padding: "8px 12px", cursor: "pointer" }}
                    >
                        Delete
                    </button>
                </div>
                </div>
            );
            })}
        </div>
        </div>
    );
}
