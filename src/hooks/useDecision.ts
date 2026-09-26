import { useLocalSearchParams } from 'expo-router';

import { useForkStore } from '../store/useForkStore';

export function useDecisionParam() {
  const params = useLocalSearchParams<{ id: string; sid?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const sid = Array.isArray(params.sid) ? params.sid[0] : params.sid;
  const decision = useForkStore((s) => s.decisions.find((d) => d.id === id));
  return { id, sid, decision };
}
