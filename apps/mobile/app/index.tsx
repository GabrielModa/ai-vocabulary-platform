import { FoundationScreen } from "../src/components/foundation-screen";
import { useNetworkStatus } from "../src/network/use-network-status";

export default function IndexRoute() {
  return <FoundationScreen networkStatus={useNetworkStatus()} />;
}
