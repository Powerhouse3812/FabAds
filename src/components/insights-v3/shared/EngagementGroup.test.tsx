import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { EngagementGroup } from "./EngagementGroup";

describe("EngagementGroup (ad drawer)", () => {
  it("starts expanded with every count plus the KPIs derived from them", () => {
    render(<EngagementGroup engagement={{ likes: 1000, comments: 50, shares: 20 }} daysLive={10} />);
    expect(screen.getByRole("button", { name: /Engagement/ })).toHaveAttribute("aria-expanded", "true");
    const kpis = within(screen.getByLabelText("Engagement KPIs"));
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(kpis.getByText("Total engagements").nextElementSibling).toHaveTextContent("1,070");
    expect(kpis.getByText("Per day live").nextElementSibling).toHaveTextContent("107");
    expect(kpis.getByText("Comments per 100 likes").nextElementSibling).toHaveTextContent("5");
    expect(kpis.getByText("Shares per 100 likes").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Only some ads report engagement.")).toBeInTheDocument();
  });

  it("the header toggles the body open and closed", () => {
    render(<EngagementGroup engagement={{ likes: 1000, comments: 50, shares: 20 }} daysLive={10} />);
    const toggle = screen.getByRole("button", { name: /Engagement/ });
    const bodyId = toggle.getAttribute("aria-controls")!;
    expect(document.getElementById(bodyId)).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(bodyId)).not.toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(bodyId)).toBeVisible();
  });

  it("partial: shows only the metrics that exist, derives only what it can, never says 'Not reported'", () => {
    render(<EngagementGroup engagement={{ likes: null, comments: 12, shares: null }} daysLive={null} />);
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.queryByText("Likes")).toBeNull();
    expect(screen.queryByText("Shares")).toBeNull();
    expect(screen.getByText("Total engagements")).toBeInTheDocument();
    expect(screen.queryByText("Per day live")).toBeNull();
    expect(screen.queryByText(/per 100 likes/)).toBeNull();
    expect(screen.queryByText(/not reported/i)).toBeNull();
    expect(screen.queryByText(/No engagement data/)).toBeNull();
  });

  it("a reported zero is a number and stays visible", () => {
    render(<EngagementGroup engagement={{ likes: 0, comments: 0, shares: 0 }} daysLive={5} />);
    expect(screen.queryByText(/not reported/i)).toBeNull();
    expect(screen.getByText("Likes")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByText("Shares")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("button", { name: /Engagement/ })).not.toBeDisabled();
  });

  it("nothing reported: disabled collapsed header + a warning, no cells, no KPI strip, no 'Not reported'", () => {
    render(<EngagementGroup engagement={{ likes: null, comments: null, shares: null }} daysLive={30} />);
    const toggle = screen.getByRole("button", { name: /Engagement/ });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).not.toHaveAttribute("aria-controls");
    expect(screen.getByText("No engagement data for this ad.")).toBeInTheDocument();
    expect(toggle).toHaveAccessibleDescription("No engagement data for this ad.");
    expect(screen.queryByText(/not reported/i)).toBeNull();
    expect(screen.queryByText("Likes")).toBeNull();
    expect(screen.queryByText("Total engagements")).toBeNull();
    expect(screen.queryByText(/Only some ads report engagement/)).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
