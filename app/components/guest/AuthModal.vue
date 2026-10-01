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
      v-for="field in FIELDS"
      :key="field.key"
      v-model="form[field.key]"
      :type="field.key === 'password' ? passwordInputType : field.type"
      :placeholder="t(field.placeholderKey)"
      :right-icon="field.key === 'password' ? passwordToggleIcon : undefined"
      class="auth-modal__input"
      @click-right-icon="showPassword = !showPassword"
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
import { isValidEmail, isValidPassword } from '@/utils/validation';

const { t } = useI18n();
const uiStore = useUiStore();

const ERROR_KEYS: Record<number, string> = {
  400: 'guest.errorValidation',
  401: 'guest.errorInvalidCredentials',
  409: 'guest.errorEmailTaken',
  429: 'guest.errorRateLimited',
};

const FIELDS = [
  { key: 'email', type: 'email', placeholderKey: 'guest.emailLabel' },
  { key: 'password', type: 'password', placeholderKey: 'guest.passwordLabel' },
] as const;

const mode = ref<'register' | 'login'>('register');
const form = reactive({ email: '', password: '' });
const loading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'));
const passwordToggleIcon = computed(() =>
  showPassword.value ? 'eye-o' : 'closed-eye',
);

watch(
  () => uiStore.authModal.show,
  (shown) => {
    if (shown) {
      mode.value = uiStore.authModal.initialMode;
      form.email = '';
      form.password = '';
      showPassword.value = false;
      errorMessage.value = '';
    }
  },
);

function toggleMode() {
  mode.value = mode.value === 'register' ? 'login' : 'register';
  errorMessage.value = '';
}

function errorMessageFor(status: number): string {
  return t(ERROR_KEYS[status] ?? 'guest.errorGeneric');
}

function validationErrorKey(email: string): string | null {
  if (!isValidEmail(email)) return 'guest.errorInvalidEmail';
  if (mode.value === 'register') {
    return isValidPassword(form.password) ? null : 'guest.errorWeakPassword';
  }
  return form.password ? null : 'guest.errorPasswordRequired';
}

async function submit() {
  const trimmedEmail = form.email.trim();
  const validationError = validationErrorKey(trimmedEmail);
  if (validationError) {
    errorMessage.value = t(validationError);
    return;
  }

  errorMessage.value = '';
  loading.value = true;
  try {
    if (mode.value === 'register') {
      await registerUser(trimmedEmail, form.password);
    } else {
      await loginUser(trimmedEmail, form.password);
    }
    uiStore.authModal.show = false;
  } catch (err) {
    errorMessage.value =
      err instanceof ApiError
        ? errorMessageFor(err.status)
        : t('guest.errorGeneric');
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
