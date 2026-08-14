<template>
  <div class="empty-state">
    <van-empty :image="noDataImg" :description="t('workout.emptyState')" />
  </div>
</template>

<script setup lang="ts">
import noDataImg from '@/assets/images/no-data.svg';

const { t } = useI18n();
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block: auto;
  text-align: center;
}
</style>
