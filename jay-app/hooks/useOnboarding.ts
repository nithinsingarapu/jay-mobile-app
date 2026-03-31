import { useUserStore } from '../stores/userStore';

export function useOnboarding() {
  const { onboardingComplete, setOnboardingComplete } = useUserStore();
  return { onboardingComplete, setOnboardingComplete };
}
