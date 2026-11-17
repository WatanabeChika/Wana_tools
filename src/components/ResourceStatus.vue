<script setup>
defineProps({ loading: Boolean, error: String, label: { type: String, default: '资源' } });
defineEmits(['retry']);
</script>

<template>
  <div v-if="loading || error" class="resource-status" :class="{ failed: error }" role="status" aria-live="polite">
    <span v-if="loading">正在加载{{ label }}，首次加载可能需要一些时间…</span>
    <template v-else>
      <span>{{ label }}加载失败：{{ error }}</span>
      <button type="button" @click="$emit('retry')">重试加载</button>
    </template>
  </div>
</template>

<style scoped>
.resource-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
  box-sizing: border-box;
  color: var(--muted);
  font-size: 13px;
  text-align: left;
  margin: 12px 0;
  padding: 10px 12px;
  background: var(--surface-soft);
  border-left: 2px solid #cbd2d9;
  line-height: 1.7;
}

.failed {
  color: var(--danger);
  background: var(--danger-soft);
  border-left-color: var(--danger);
}

.resource-status button {
  min-height: 32px;
  padding: 4px 10px;
  font-size: 13px;
}
</style>
