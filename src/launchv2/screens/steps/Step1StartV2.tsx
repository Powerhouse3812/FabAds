import type { UseFlowV2 } from "../../state/useFlowV2";
import GoalFirstLayout from "./Step1GoalFirstLayout";

interface Step1StartV2Props {
  flow: UseFlowV2;
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}

export default function Step1StartV2({ flow }: Step1StartV2Props) {
  return <GoalFirstLayout flow={flow} />;
}
