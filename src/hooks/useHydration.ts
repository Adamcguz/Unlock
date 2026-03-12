import { useState, useEffect } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useTaskStore } from '../store/useTaskStore';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { useGoalStore } from '../store/useGoalStore';

function allHydrated() {
  return (
    useUserStore.persist.hasHydrated() &&
    useTaskStore.persist.hasHydrated() &&
    usePayPeriodStore.persist.hasHydrated() &&
    useHistoryStore.persist.hasHydrated() &&
    useRecurringTaskStore.persist.hasHydrated() &&
    useGoalStore.persist.hasHydrated()
  );
}

export function useHydration() {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    if (hydrated) return;

    function onHydrate() {
      if (allHydrated()) setHydrated(true);
    }

    const unsubs = [
      useUserStore.persist.onFinishHydration(onHydrate),
      useTaskStore.persist.onFinishHydration(onHydrate),
      usePayPeriodStore.persist.onFinishHydration(onHydrate),
      useHistoryStore.persist.onFinishHydration(onHydrate),
      useRecurringTaskStore.persist.onFinishHydration(onHydrate),
      useGoalStore.persist.onFinishHydration(onHydrate),
    ];

    // Check again in case it finished between useState init and effect
    onHydrate();

    return () => unsubs.forEach((fn) => fn());
  }, [hydrated]);

  return hydrated;
}
