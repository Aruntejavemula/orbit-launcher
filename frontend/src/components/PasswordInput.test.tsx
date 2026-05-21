import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PasswordInput from "./PasswordInput";

describe("PasswordInput", () => {
  it("toggles visibility with eye button", () => {
    render(<PasswordInput value="secret" onChange={() => {}} placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
