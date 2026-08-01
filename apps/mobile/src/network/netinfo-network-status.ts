import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { mapConnectivity, type NetworkStatus, type NetworkStatusSource } from "./network-status";

const fromState = (state: NetInfoState): NetworkStatus =>
  mapConnectivity(state.isConnected, state.isInternetReachable);

export class NetInfoNetworkStatus implements NetworkStatusSource {
  async current(): Promise<NetworkStatus> {
    return fromState(await NetInfo.fetch());
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    return NetInfo.addEventListener((state) => {
      listener(fromState(state));
    });
  }
}
