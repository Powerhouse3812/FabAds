import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { EngagementGroup } from "./EngagementGroup";

describe("EngagementGroup (ad drawer)", () => {
  it("shows every count plus the KPIs derived from them", () => {
    render(<EngagementGroup engagement={{ likes: 1000, comments: 50, shares: 20 }} daysLive={10} />);
    const kpis = within(screen.getByLabelText("Engagement KPIs"));
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(kpis.getByText("Total engagements").nextElementSibling).toHaveTextContent("1,070");
    expect(kpis.getByText("Per day live").nextElementSibling).toHaveTextContent("107");
    expect(kpis.getByText("Comments per 100 likes").nextElementSibling).toHaveTextContent("5");
    expect(kpis.getByText("Shares per 100 likes").nextElementSibling).toHaveTextContent("2");
  });

  it("only derives what can be derived: no likes → no per-100 KPIs; unknown start → no per-day KPI", () => {
    render(<EngagementGroup engagement={{ likes: null, comments: 12, shares: null }} daysLive={null} />);
    expect(screen.getByText("Total engagements")).toBeInTheDocument();
    expect(screen.queryByText("Per day live")).toBeNull();
    expect(screen.queryByText(/per 100 likes/)).toBeNull();
    expect(screen.getAllByText("Not reported")).toHaveLength(2);
  });

  it("a reported zero is a number, not 'Not reported'", () => {
    render(<EngagementGroup engagement={{ likes: 0, comments: 0, shares: 0 }} daysLive={5} />);
    expect(screen.queryByText("Not reported")).toBeNull();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
  });

  it("nothing reported: three 'Not reported' cells and no KPI strip", () => {
    render(<EngagementGroup engagement={{ likes: null, comments: null, shares: null }} daysLive={30} />);
    expect(screen.getAllByText("Not reported")).toHaveLength(3);
    expect(screen.queryByText("Total engagements")).toBeNull();
  });
});
