import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config.js";
import { apiFetch } from "../apiFetch.js";


function TaskStatus() {
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const { tid } = useParams();
  const intervalRef = useRef(null);
  
  // Server-side error messages mapped by error code
  const errorViews = (pollOnce) => ({
    API_REMOTE_ERROR: (
      <div className="space-y-2">
        <p>An error occurred while downloading the image.</p>
        <button
          onClick={() => pollOnce()}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Check status
        </button>
      </div>
    ),
    INTERNAL_ERROR: (
      <p>Internal service error.</p>
    ),
    QC_FAILED: (
      <p>{task?.error_msg?.split("|")[0] ?? "Quality control failed."}</p>
    ),
    WORKER_TIMEOUT: (
      <p>{task?.error_msg ?? "The task could not be processed."}</p>
    ),
  });
  
  // Fetch task status from API
  const fetchTaskStatus = useCallback(async (taskId) => {
    const res = await apiFetch(`/api/tasks/check_task/${taskId}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return res.json();
  }, []);

  // Poll task status once and update state
  const pollOnce = useCallback(async () => {
    try {
      const data = await fetchTaskStatus(tid);
      setTask(data);
      setError(null);

      if (process.env.NODE_ENV === "development" && data.status === "FAILED" && data.error_msg) {
        console.error(`Task ${data.id} failed.`, data.error_code, data.error_msg);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [tid, fetchTaskStatus]);

  // get error views object
  const views = errorViews(pollOnce);

  // Initial fetch and setup polling interval
  useEffect(() => {
    if (!tid) return;

    if (!intervalRef.current) {
      pollOnce();
      intervalRef.current = setInterval(pollOnce, 5000);
    }

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [tid, pollOnce]);

  // Stop polling when task is complete or waiting for AI insight
  useEffect(() => {
    if (!tid || !task) return;

    const stillRunning = task.status !== "SUCCESS" && task.status !== "FAILED";
    const waitingForInsight = task.status === "SUCCESS" && !task.ai_insight;

    if (!stillRunning && !waitingForInsight) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [tid, task]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading task status…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-white-50">
      <div className="w-full max-w-3xl p-6">
        <div className="rounded-lg bg-white shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">
            {task.analysis_type.toUpperCase()} Analysis
          </h2>

          <div className="text-left text-sm">
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

          {task.status === "PENDING" && (
            <p className="text-center text-gray-600">
              Your request is queued…
            </p>
          )}

          {task.status === "RUNNING" && (
            <p className="text-center text-gray-600">
              Processing — this may take a minute.
            </p>
          )}

          {/* Server-side/API errors */}
          {task.status === "FAILED" && (
            <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-red-800">
              <p className="font-semibold">Task failed</p>
              <div className="mt-1 text-sm">
                {views[task.error_code] ?? (
                  <p>
                    Something went wrong. Try filling out the form again and submit.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success state with result image and AI insight */}
          {task.status === "SUCCESS" && task.result_url && (
            <div className="space-y-4">
              {task.qc_warning && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 px-4 py-3 text-yellow-600 text-sm">
                  {task.qc_warning.split("|")[0]}
                </div>
              )}
              <div className="flex justify-center">
                <img
                  src={`${API_BASE}${task.result_url}`}
                  alt="Result"
                  className="max-w-full rounded border shadow-sm"
                />
              </div>

              {/* AI insight — displayed when ready */}
              {task.ai_insight ? (
                <div className="border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-blue-800 text-sm">
                  <p className="font-semibold mb-1">AI Analysis:</p>
                  <p>{task.ai_insight}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center">
                  Generating analysis…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskStatus;
