<template>
  <van-popup
    :show="uiStore.authModal.show"
    round
    teleport="body"
    class="auth-modal"
    @update:show="uiStore.authModal.show = $event"
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

    <p v-if="errorMessage" class="auth-modal__error">{{ errorMessage }}</p>

    <van-button
      type="primary"
      size="large"
      block
      round
      :loading="loading"
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
import { useUiStore } from '@/stores/ui';
import { registerUser, loginUser } from '@/utils/authApi';
import { ApiError } from '@/utils/api';

const { t } = useI18n();
const uiStore = useUiStore();

const mode = ref<'register' | 'login'>('register');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

watch(
  () => uiStore.authModal.show,
  (shown) => {
    if (shown) {
      mode.value = uiStore.authModal.initialMode;
      email.value = '';
      password.value = '';
      errorMessage.value = '';
    }
  },
);

function toggleMode() {
  mode.value = mode.value === 'register' ? 'login' : 'register';
  errorMessage.value = '';
}

function errorMessageFor(status: number): string {
  if (status === 409) return t('guest.errorEmailTaken');
  if (status === 401) return t('guest.errorInvalidCredentials');
  if (status === 429) return t('guest.errorRateLimited');
  if (status === 400) return t('guest.errorValidation');
  return t('guest.errorGeneric');
}

async function submit() {
  const trimmedEmail = email.value.trim();
  if (!trimmedEmail || !password.value) return;

  errorMessage.value = '';
  loading.value = true;
  try {
    if (mode.value === 'register') {
      await registerUser(trimmedEmail, password.value);
    } else {
      await loginUser(trimmedEmail, password.value);
    }
    uiStore.authModal.show = false;
  } catch (err) {
    errorMessage.value =
      err instanceof ApiError ? errorMessageFor(err.status) : t('guest.errorGeneric');
  } finally {
    loading.value = false;
  }
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

  &__error {
    margin: -4px 0 12px;
    color: var(--van-danger-color, #ee0a24);
    font-size: 13px;
    text-align: center;
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
