/**
 * Other Flows — barrel. Genie 2.0 §7.
 *
 * Route pages for the wiring agent:
 *   OtherFlows        → /iq/genie6/flows
 *   FlowModuleDetail  → /iq/genie6/flows/:moduleKey
 *
 * Reusable pieces for other agents:
 *   FlowBanner        → mounted by Studio on every step once resolveFlowContext(sp) is non-null
 *   SendToGenieMenu   → mounted by Reports / Industry Insights / Video Sage (§6 Rule 6)
 */
export { OtherFlows } from "./OtherFlows";
export { FlowModuleDetail } from "./FlowModuleDetail";
export { FlowBanner } from "./FlowBanner";
export { SendToGenieMenu } from "./SendToGenieMenu";
