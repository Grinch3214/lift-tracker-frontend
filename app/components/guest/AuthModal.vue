<template>
  <van-popup
    :show="show"
    round
    class="auth-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="auth-modal__header">
      <span class="auth-modal__title">{{
        mode === 'register' ? t('guest.registerTitle') : t('guest.loginTitle')
      }}</span>
    </div>

    <van-field
      v-model="email"
      type="email"
      :placeholder="t('guest.emailLabel')"
      class="auth-modal__input"
    />
    <van-field
      v-model="password"
      type="password"
      :placeholder="t('guest.passwordLabel')"
      class="auth-modal__input"
    />

    <van-button
      type="primary"
      size="large"
      block
      round
      class="auth-modal__submit"
      @click="submit"
    >
      {{
        mode === 'register' ? t('guest.registerSubmit') : t('guest.loginSubmit')
      }}
    </van-button>

    <button type="button" class="auth-modal__switch" @click="toggleMode">
      {{
        mode === 'register'
          ? t('guest.switchToLogin')
          : t('guest.switchToRegister')
      }}
    </button>
  </van-popup>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const { t } = useI18n();

const mode = ref<'register' | 'login'>('register');
const email = ref('');
const password = ref('');

watch(
  () => props.show,
  (shown) => {
    if (shown) {
      mode.value = 'register';
      email.value = '';
      password.value = '';
    }
  },
);

function toggleMode() {
  mode.value = mode.value === 'register' ? 'login' : 'register';
}

function submit() {
  // TODO(cloud-sync, v1.3): wire to POST /auth/register / POST /auth/login once the
  // HTTP client + auth store exist — see lift-tracker-backend/API.md. UI-only for now.
  emit('update:show', false);
}
</script>

<style scoped lang="scss">
.auth-modal {
  width: min(320px, 90vw);
  padding: 20px 16px;

  &__header {
    display: flex;
    justify-content: center;
    padding: 0 0 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__input {
    border: 1px solid var(--van-border-color);
    border-radius: 10px;
    margin-block-end: 12px;
  }

  &__submit {
    margin-block-start: 8px;
  }

  &__switch {
    display: block;
    width: 100%;
    margin-block-start: 14px;
    border: none;
    background: none;
    color: var(--van-primary-color);
    font-size: 13px;
    text-align: center;
    cursor: pointer;
  }
}
</style>
