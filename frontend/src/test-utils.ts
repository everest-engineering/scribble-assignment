export async function flushRender() {
  // allow pending microtasks/macrotasks to complete for React 18 createRoot
  await new Promise((resolve) => setTimeout(resolve, 0));
}
