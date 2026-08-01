export type NetworkStatus = "online" | "offline" | "unknown";

export interface NetworkStatusSource {
  current(): Promise<NetworkStatus>;
  subscribe(listener: (status: NetworkStatus) => void): () => void;
}

export function mapConnectivity(
  isConnected: boolean | null,
  isInternetReachable: boolean | null,
): NetworkStatus {
  if (isConnected === false || isInternetReachable === false) return "offline";
  if (isConnected === true) return "online";
  return "unknown";
}
