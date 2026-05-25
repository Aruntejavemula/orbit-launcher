import { useApps } from "../context/AppsContext";
import RemioLoading from "./RemioLoading";

export default function LaunchHandoffOverlay() {
  const { launching } = useApps();
  return <RemioLoading active={launching} variant="screen" label="Opening app" />;
}
