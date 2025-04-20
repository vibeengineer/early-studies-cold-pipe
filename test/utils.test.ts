import { describe, expect, it } from "vitest";
import { convertToSnakeCase } from "../src/utils";

describe("convertToCamelCase", () => {
  it("should convert simple object keys from snake_case and spaces to camelCase", () => {
    const input = {
      first_name: "John",
      "last name": "Doe",
      user_age: 30,
    };
    const expected = {
      firstName: "John",
      lastName: "Doe",
      userAge: 30,
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle nested objects recursively", () => {
    const input = {
      user_profile: {
        "display name": "Johnny D",
        contact_info: {
          email_address: "john.doe@example.com",
          "phone number": "123-456-7890",
        },
      },
      account_status: "active",
    };
    const expected = {
      userProfile: {
        displayName: "Johnny D",
        contactInfo: {
          emailAddress: "john.doe@example.com",
          phoneNumber: "123-456-7890",
        },
      },
      accountStatus: "active",
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle arrays of objects recursively", () => {
    const input = [
      { item_id: 1, "item name": "Gadget" },
      {
        item_id: 2,
        "item name": "Widget",
        specs_detail: { material_type: "Metal", "color option": "Blue" },
      },
    ];
    const expected = [
      { itemId: 1, itemName: "Gadget" },
      {
        itemId: 2,
        itemName: "Widget",
        specsDetail: { materialType: "Metal", colorOption: "Blue" },
      },
    ];
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle arrays with mixed primitive types", () => {
    const input = {
      mixed_array: [1, "string", { key_name: "value" }, ["nested_item"]],
    };
    const expected = {
      mixedArray: [1, "string", { keyName: "value" }, ["nested_item"]], // Note: array elements themselves are not converted unless they are objects
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should return non-object types as is", () => {
    expect(convertToSnakeCase("string")).toBe("string");
    expect(convertToSnakeCase(123)).toBe(123);
    expect(convertToSnakeCase(null)).toBeNull();
    expect(convertToSnakeCase(undefined)).toBeUndefined();
  });

  it("should handle empty objects and arrays", () => {
    expect(convertToSnakeCase({})).toEqual({});
    expect(convertToSnakeCase([])).toEqual([]);
    const input = { empty_obj: {}, empty_array: [] };
    const expected = { emptyObj: {}, emptyArray: [] };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });
});
