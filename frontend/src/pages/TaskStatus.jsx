import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom"
import { API_BASE } from "../config.js"

function TaskStatus() {
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const params = useParams();
  const tid = params.tid

  const errorViews = {
    API_REMOTE_ERROR: (
      <div>
        <p>An error occured while downloading the image.</p>
        <button onClick={() => pollOnce()} style={{ padding: '10px', marginTop: '10px' }}>
        Check Status
        </button>
      </div>
    ),
    INTERNAL_ERROR: <p> {task?.error_code} Internal service error.</p>,
    QC_FAILED: (
      <div>
        {task?.error_msg ? (
          <p>{task.error_msg}</p> 
        ) : (
          <p> Quality control failed.</p> 
        )}
      </div>
    )
  };
  
  const fetchTaskStatus = useCallback(async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/check_task/${taskId}`
      );
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      return data; 
    } catch (err) {  
      console.error("Fetch error:", err);
      throw err; // Re-throw to be caught by the caller
    }
  }, []);
  const pollOnce = useCallback(async () => {

    try {
      const data = await fetchTaskStatus(tid);

      //if (!mounted) return;
      setTask(data);
      setError(null);

      // if task failed, log to the console
      if (data.status === "FAILED" && data.error_msg) {
        console.error(`Task ${data.id} failed. Code: ${data.error_code || 'N/A'} Message:`, data.error_msg)
      }
    } catch (err) {
      console.error("Polling error:", err);
      setError(err.message);
    }
  }, [tid, fetchTaskStatus]);
  
  
  useEffect(() => {
    // single poll + repeated interval (ensures immediate first fetch)
    if (!tid) return;
    // if finished or failed, stop polling
    if (task && ["SUCCESS", "FAILED"].includes(task.status)) {
      return;
    }
    let mounted = true;
    let intervalId = null;
    // do immediate poll then, set interval
    pollOnce();
    intervalId = setInterval(pollOnce, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tid, fetchTaskStatus]); // re-run when one of these args change

  if (error) return <div>Error: {error}</div>;
  if (!task) return <div>Loading task status...</div>;

  return (
    <div>
      <h3>Task {task.id}</h3>
      <p>Status: {task.status}</p>
      
      {task.status === "PENDING" && <p>Your request is queued...</p>}
      {task.status === "RUNNING" && <p>Processing — this may take a minute.</p>}
      {task.status === "FAILED" && (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
            <h4>Task Failed</h4>
            {errorViews[task.error_code] ??
              <p>Something went wrong. Try filling out the form again.</p>
            }
        </div>
      )}

      {task.status === "SUCCESS" && task.result_url && (
        <>
          <p>Result ready:</p>
          {task.qc_warning && (
            <div style={{ color: 'orange', border: '1px solid orange', padding: '10px' }}>
              <p> {task.qc_warning} : {task.qc_notes} </p>
            </div>
          )}
          <img
            src={`${API_BASE}${task.result_url}`}
            alt="Result"
            style={{ maxWidth: "90%", height: "auto", border: "1px solid #ccc" }}
          />
        </>
      )}
    </div>
  )
}

export default TaskStatus;



