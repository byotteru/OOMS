import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders correctly with label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders primary variant by default", () => {
    const { container } = render(<Button>Primary Button</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("button-primary");
  });

  it("renders secondary variant", () => {
    const { container } = render(
      <Button variant="secondary">Secondary Button</Button>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("button-secondary");
  });

  it("renders danger variant", () => {
    const { container } = render(
      <Button variant="danger">Danger Button</Button>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("button-danger");
  });

  it("renders warning variant", () => {
    const { container } = render(
      <Button variant="warning">Warning Button</Button>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("button-warning");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    const { container } = render(
      <Button onClick={mockOnClick}>Click me</Button>
    );

    const button = container.querySelector("button");
    if (button) {
      await user.click(button);
    }

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    const { container } = render(
      <Button onClick={mockOnClick} disabled>
        Disabled Button
      </Button>
    );

    const button = container.querySelector("button");
    if (button) {
      await user.click(button);
    }

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("renders with custom className", () => {
    const { container } = render(
      <Button className="custom-class">Custom Button</Button>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards additional props", () => {
    render(<Button data-testid="test-button">Test Button</Button>);
    expect(screen.getByTestId("test-button")).toBeInTheDocument();
  });
});
