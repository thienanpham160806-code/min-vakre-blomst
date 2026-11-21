import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { Flower, FLOWER_KINDS } from "./Flower";

beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

function render(kind: string) {
  return renderToStaticMarkup(React.createElement(Flower, {
    kind: kind as React.ComponentProps<typeof Flower>["kind"],
    color: "#f7a8c4",
  }));
}

it.each([...new Set([...FLOWER_KINDS.map(f => f.kind), "peony", "camellia", "poppy"])])("vẽ được loại hoa %s từ dữ liệu mới hoặc cũ", kind => {
  expect(render(kind)).toContain("<svg");
});

it.each(["unknown-flower", "__proto__", "constructor"])("loại chưa hỗ trợ %s dùng tulip dự phòng", kind => {
  expect(render(kind)).toBe(render("tulip"));
});
