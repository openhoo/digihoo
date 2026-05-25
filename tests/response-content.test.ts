import { describe, expect, it } from "bun:test";
import type { operations as MyListsOperations } from "../src/generated/mylists-v1";
import type { ResponseContent } from "../src/types";

describe("ResponseContent", () => {
  it("types content-less responses as undefined", () => {
    const noContent = undefined satisfies ResponseContent<MyListsOperations["DeleteList"], 204>;

    expect(noContent).toBeUndefined();
  });
});
