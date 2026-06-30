import { useEffect } from 'react';

export default function ExperimentsCookieIsland() {
 useEffect(() => {
 // Legacy experiments cookie removed; keep hook to avoid breaking hydration order
 }, []);

 return null;
}
