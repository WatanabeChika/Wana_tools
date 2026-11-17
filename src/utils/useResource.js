import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useResource(loader, onReady = () => { }) {
  const ready = ref(false);
  const loading = ref(false);
  const error = ref('');
  let disposed = false;
  async function retry() {
    if (loading.value || disposed) return;
    loading.value = true;
    error.value = '';
    try {
      const resource = await loader();
      if (disposed) return;
      ready.value = true;
      await onReady(resource);
    } catch (cause) {
      if (!disposed) error.value = cause.message || '加载失败，请重试';
    } finally {
      if (!disposed) loading.value = false;
    }
  }
  onMounted(retry);
  onBeforeUnmount(() => { disposed = true; });
  return { ready, loading, error, retry };
}
