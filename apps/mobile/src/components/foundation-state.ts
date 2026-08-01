import type { NetworkStatus } from "../network/network-status";

export const statusCopy: Record<NetworkStatus, string> = {
  offline: "Offline — saved learning will remain available",
  online: "Mobile foundation ready",
  unknown: "Checking connection",
};

export function getFoundationAccessibility(
  networkStatus: NetworkStatus,
  reduceMotionEnabled: boolean,
) {
  return {
    statusLabel: `Application status: ${statusCopy[networkStatus]}`,
    motionHint: reduceMotionEnabled
      ? "Animations are reduced"
      : "Animations follow system settings",
  };
}
