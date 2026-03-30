// src/pages/HistoryPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.js";
import { apiFetch } from "../apiFetch.js";

export default function HistoryPage({ tz }) {
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notice, setNotice] = useState(null);
    const navigate = useNavigate();

    const handleDownload = async (resultUrl) => {
        // Create and click an anchor to trigger browser download / open
        const url = `${API_BASE}${resultUrl}`;
        const a = document.createElement("a");
        a.href = url;
        // Attempt to force download; leave empty so browser decides filename
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const res = await apiFetch(`/api/tasks/delete_task/${deleteId}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");

            setTasks((prev) => prev.filter((pos) => pos.task_id !== deleteId));
            setNotice({
                type: "success",
                note: "Task deleted successfully!",
            });
        } catch (err) {
            setNotice({
                type: "fail",
                note: "Error deleting task",
            });
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const fetchLocalTime = (task) => {
        return new Date(task.created_at).toLocaleString("en-GB", {
            timeZone: tz,
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    useEffect(() => {
        let mounted = true;
        let intervalId = null;

        const fetchTasks = async () => {
            try {
                const res = await apiFetch(`/api/tasks/show_tasks/`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data = await res.json();

                if (!mounted) return;
                setTasks(data);
                setError(null);
                // Stop polling if every task is SUCCESS or FAILED
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

        // Immediate fetch then poll every 5s
        fetchTasks();
        intervalId = setInterval(fetchTasks, 5000);

        return () => {
            mounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Clear notice after 3 seconds
    useEffect(() => {
        if (!notice) return;

        const timeoutId = setTimeout(() => {
            setNotice(null);
        }, 3000);

        return () => clearTimeout(timeoutId);
    }, [notice]);

    if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
    if (!tasks) return <div style={{ padding: 20 }}>Loading task history...</div>;
    if (tasks.length === 0)
        return <div style={{ padding: 20 }}>No tasks yet.</div>;

    return (
        <div className="flex min-h-screen justify-center bg-white-100">
            <div className="w-full max-w-4xl p-6 shadow-md">
                {/* Delete confirmation modal */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-[360px] shadow-lg">
                            <h3 className="text-lg font-semibold mb-2">Delete task?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This action cannot be undone.
                            </p>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="px-3 py-1.5 border rounded cursor-pointer"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete()}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification toast */}
                {notice && (
                    <div className="fixed top-6 right-6 z-50">
                        <div
                            className={`rounded-lg px-4 py-3 shadow-lg text-sm flex items-center gap-2 ${
                                notice.type === "success"
                                    ? "bg-green-600 text-white"
                                    : "bg-red-600 text-white"
                            }`}
                        >
                            <span>{notice.note}</span>
                            <button
                                onClick={() => setNotice(null)}
                                className="ml-2 text-white/80 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <h2 className="text-2xl font-bold mb-4 text-center">Task history</h2>
                <div className="border border-gray-200 rounded overflow-hidden bg-white">
                    {tasks.map((task) => {
                        // Fields: task_id, analysis_type, status, result_url, created_at
                        const id = task.task_id ?? task.id ?? task.taskId;
                        const thumbnail =
                            task.result_url && task.status === "SUCCESS"
                                ? `${API_BASE}${task.result_url}`
                                : null;

                        return (
                            <div
                                key={id}
                                className="flex items-center gap-4 p-4 border-b last:border-b-0"
                            >
                                {/* Thumbnail */}
                                <div className="w-[140px] h-[90px] flex-shrink-0">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt={`task-${id}`}
                                            className="w-full h-full object-cover border rounded"
                                        />
                                    ) : (
                                        <div className="w-full h-full border rounded flex items-center justify-center text-gray-500 text-sm">
                                            {task.status === "PENDING"
                                                ? "Queued"
                                                : task.status === "RUNNING"
                                                ? "Processing"
                                                : "No preview"}
                                        </div>
                                    )}
                                </div>

                                {/* Task info */}
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {(task.analysis_type
                                            ? task.analysis_type.toUpperCase()
                                            : "TASK")}
                                        {task.comparison && " • HEATMAP"}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        {fetchLocalTime(task)}
                                    </div>

                                    <div className="mt-1 text-sm">
                                        Status:{" "}
                                        <span
                                            className={
                                                task.status === "SUCCESS"
                                                    ? "font-semibold text-green-600"
                                                    : task.status === "FAILED"
                                                    ? "font-semibold text-red-600"
                                                    : "font-semibold text-yellow-600"
                                            }
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/dashboard/task_status/${id}`)}
                                        className="px-3 py-1.5 rounded border text-sm hover:bg-gray-100 cursor-pointer"
                                    >
                                        Show
                                    </button>

                                    {task.result_url ? (
                                        <button
                                            onClick={() => handleDownload(task.result_url)}
                                            className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700 cursor-pointer"
                                        >
                                            Download
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="px-3 py-1.5 rounded bg-gray-300 text-gray-600 text-sm cursor-not-allowed"
                                        >
                                            Download
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setDeleteId(id)}
                                        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
