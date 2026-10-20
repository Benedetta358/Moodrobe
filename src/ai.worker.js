import { pipeline, env } from "@huggingface/transformers";
import {
  MODEL_INFO,
  normalize,
  cosine,
  fitPreferenceHead,
  describeItem,
  describeIntent,
  assembleCandidates,
  selectDiverse,
} from "./engine";
env.allowRemoteModels = false;
// Avoid browser HTTP-cache write failures on large ONNX assets. The model
// library still caches successful responses explicitly through Cache Storage.
env.fetch = (url, options) => fetch(url, { ...options, cache: "no-store" });
env.allowLocalModels = true;
env.localModelPath = "/models/";
env.backends.onnx.wasm.wasmPaths = {
  mjs: "/ort/ort-wasm-simd-threaded.mjs",
  wasm: "/ort/ort-wasm-simd-threaded.wasm",
};
env.backends.onnx.wasm.numThreads = 1;
let extractor, loading;
const cache = new Map();
async function getModel(id) {
  if (extractor) return extractor;
  if (!loading)
    loading = pipeline("feature-extraction", "minilm", {
      dtype: "q8",
      device: "wasm",
      progress_callback: (p) => {
        self.postMessage({
          id,
          type: "progress",
          stage: p.status,
          file: p.file,
          progress: p.progress,
        });
      },
    })
      .then((m) => (extractor = m))
      .catch((e) => {
        loading = null;
        throw e;
      });
  return loading;
}
async function embeddings(texts, id) {
  const model = await getModel(id);
  const missing = [...new Set(texts.filter((t) => !cache.has(t)))];
  for (let i = 0; i < missing.length; i += 8) {
    const batch = missing.slice(i, i + 8),
      out = await model(batch, { pooling: "mean", normalize: true });
    const vectors = out.tolist();
    batch.forEach((t, k) => cache.set(t, vectors[k]));
    self.postMessage({
      id,
      type: "progress",
      stage: "encoding",
      progress: Math.round(Math.min(1, (i + 8) / missing.length) * 100),
    });
  }
  return texts.map((t) => cache.get(t));
}
self.onmessage = async ({ data }) => {
  const { id, items, context, feedback = [], requiredId } = data;
  try {
    const started = performance.now();
    const candidates = assembleCandidates(items, context, requiredId);
    if (!candidates.length)
      throw Error(
        "Add a top, a bottom and shoes — or a dress and shoes — to build a complete outfit.",
      );
    const descriptions = items.map(describeItem),
      texts = [describeIntent(context), ...descriptions];
    const vectors = await embeddings(texts, id),
      query = vectors[0],
      itemMap = new Map(
        items.map((i, k) => [i.id, { ...i, vector: vectors[k + 1] }]),
      ),
      head = fitPreferenceHead(feedback);
    const ranks = candidates
      .map((c) => {
        const garments = c.itemIds.map((id) => itemMap.get(id));
        const vector = normalize(
          Array.from(
            { length: 384 },
            (_, k) =>
              garments.reduce((s, i) => s + i.vector[k], 0) / garments.length,
          ),
        );
        const semantic = cosine(query, vector),
          personal = cosine(head.weights, vector);
        const reuse =
          garments.reduce(
            (s, i) =>
              s +
              Math.min(
                1,
                Math.max(
                  0,
                  (Date.now() - new Date(i.lastWorn).getTime()) / 86400000,
                ) / 90,
              ),
            0,
          ) / garments.length;
        const target =
          context.occasion === "Work / campus"
            ? 2
            : context.occasion === "An occasion"
              ? 3
              : 1;
        const occasion =
          garments.reduce(
            (s, i) => s + Math.abs((i.formality || 1) - target),
            0,
          ) / garments.length;
        const score =
          semantic * 0.78 +
          Math.tanh(personal) * 0.14 +
          reuse * 0.04 -
          occasion * 0.025;
        return {
          ...c,
          baseIds: garments
            .filter((i) =>
              ["Tops", "Trousers", "Skirts", "Dresses"].includes(i.category),
            )
            .map((i) => i.id),
          vector,
          score,
          semantic,
          personal,
          reuse,
          engine: "neural",
          model: MODEL_INFO.name,
        };
      })
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const selected = selectDiverse(ranks);
    self.postMessage({
      id,
      type: "result",
      looks: selected,
      meta: {
        model: MODEL_INFO.name,
        dimensions: 384,
        candidates: candidates.length,
        trainedExamples: head.samples,
        trainingLoss: head.loss,
        elapsedMs: Math.round(performance.now() - started),
        source: "neural",
      },
    });
  } catch (e) {
    self.postMessage({
      id,
      type: "error",
      error: e.message || "The model could not run on this device.",
    });
  }
};
