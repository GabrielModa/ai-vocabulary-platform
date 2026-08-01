import { useEffect, useState } from "react";
import { NetInfoNetworkStatus } from "./netinfo-network-status";
import type { NetworkStatus, NetworkStatusSource } from "./network-status";

const defaultSource = new NetInfoNetworkStatus();

export function useNetworkStatus(source: NetworkStatusSource = defaultSource): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>("unknown");

  useEffect(() => {
    let active = true;
    void source.current().then((next) => {
      if (active) setStatus(next);
    });
    const unsubscribe = source.subscribe(setStatus);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [source]);

  return status;
}
