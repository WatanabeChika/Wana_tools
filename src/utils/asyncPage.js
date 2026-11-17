import { defineComponent, h, shallowRef, markRaw } from 'vue';
import { useResource } from './useResource';
import ResourceStatus from '../components/ResourceStatus.vue';

export function asyncPage(loader) {
  return defineComponent({
    setup() {
      const page = shallowRef(null);
      const state = useResource(loader, module => { page.value = markRaw(module.default); });
      return () => page.value ? h(page.value) : h(ResourceStatus, {
        loading: state.loading.value, error: state.error.value, label: '页面', onRetry: state.retry,
      });
    },
  });
}
