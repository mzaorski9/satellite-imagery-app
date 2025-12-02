import { useEffect, useState} from "react";
import { useParams } from "react-router-dom"
import { API_BASE } from "../config.js"

function TaskStatus() {
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const params = useParams();

  const tid = params.tid

  useEffect(() => {
    if (!tid) return;

    let mounted = true;
    let intervalId = null;

    // single poll + repeated interval (ensures immediate first fetch)
    const pollOnce = async () => {
      try {
    
        const res = await fetch(`${API_BASE}/api/tasks/check_task/${tid}/`);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setTask(data);
        setError(null);

        // if finished or failed, stop polling
        if (["SUCCESS", "FAILED"].includes(data.status)) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        console.error("Polling error:", err);
        if (mounted) setError(err.message);
      }
    };

    // do immediate poll then, set interval
    pollOnce();
    intervalId = setInterval(pollOnce, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tid]);

  if (error) return <div>Error: {error}</div>;
  if (!task) return <div>Loading task status...</div>;

  return (
    <div>
      <h3>Task {task.id}</h3>
      <p>Status: {task.status}</p>
      
      {task.status === "PENDING" && <p>Your request is queued...</p>}
      {task.status === "RUNNING" && <p>Processing — this may take a minute.</p>}
      {task.status === "FAILED" && (
        <>
          <p>Task failed. Check server logs or try again.</p>
          {task.error_message && <pre>{task.error_message}</pre>}
        </>
      )}

      {task.status === "SUCCESS" && task.result_url && (
        <>
          <p>Result ready:</p>
          <img
            src={`${API_BASE}${task.result_url}`}
            alt="Result"
            style={{ maxWidth: "90%", height: "auto", border: "1px solid #ccc" }}
          />
        </>
      )}
    </div>
  );
}

export default TaskStatus;



