/** Wraps /launchv2 routes in the provider; runs full-height (ownsLayout). */
import { Outlet } from "react-router-dom";
import { LaunchV2Provider } from "./state/LaunchV2Context";

export default function LaunchV2Layout() {
  return (
    <LaunchV2Provider>
      <div className="flex h-full min-h-0 flex-col">
        <Outlet />
      </div>
    </LaunchV2Provider>
  );
}
