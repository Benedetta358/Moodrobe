import { useEffect, useRef, useState } from "react";
export function useLocalAI() {
  const worker = useRef(),
    sequence = useRef(0);
  const [state, setState] = useState({
    status: "idle",
    looks: [],
    meta: null,
    error: null,
    progress: 0,
    stage: "",
  });
  useEffect(() => () => worker.current?.terminate(), []);
  function generate(items, context, feedback, requiredId) {
    if (!worker.current) {
      worker.current = new Worker(new URL("./ai.worker.js", import.meta.url), {
        type: "module",
      });
      worker.current.onmessage = ({ data }) => {
        if (data.id !== sequence.current) return;
        if (data.type === "progress")
          setState((s) => ({
            ...s,
            stage: data.stage,
            progress: Math.round(data.progress || 0),
          }));
        if (data.type === "result")
          setState({
            status: "ready",
            looks: data.looks,
            meta: data.meta,
            error: null,
            progress: 100,
            stage: "ready",
          });
        if (data.type === "error")
          setState((s) => ({
            ...s,
            status: "error",
            error: data.error,
            looks: [],
          }));
      };
      worker.current.onerror = () =>
        setState((s) => ({
          ...s,
          status: "error",
          error:
            "The local AI could not start. Try a current Chrome, Edge, Firefox or Safari browser. You can still use the starter suggestions.",
          looks: [],
        }));
    }
    sequence.current++;
    setState((s) => ({
      ...s,
      status: "loading",
      error: null,
      stage: "Preparing local model",
      progress: 0,
    }));
    worker.current.postMessage({
      id: sequence.current,
      items,
      context,
      feedback,
      requiredId,
    });
  }
  function clear() {
    sequence.current++;
    setState((s) => ({
      ...s,
      status: "idle",
      looks: [],
      meta: null,
      error: null,
    }));
  }
  return { ...state, generate, clear };
}
