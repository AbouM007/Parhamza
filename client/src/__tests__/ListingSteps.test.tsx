import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CategoryStep } from "@/components/create-listing/CategoryStep";
import { ListingTypeStep } from "@/components/create-listing/ListingTypeStep";
import { VehicleDetailsStep } from "@/components/create-listing/VehicleDetailsStep";
import { CATEGORIES } from "@/data/categories";

describe("Listing step components", () => {
  it("allows choosing a listing type", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<ListingTypeStep value="" onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /je vends/i }));

    expect(onSelect).toHaveBeenCalledWith("sale");
  });

  it("renders categories and triggers selection", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <CategoryStep
        categories={CATEGORIES}
        listingType="sale"
        selectedCategoryId=""
        onSelect={onSelect}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /voitures - utilitaires/i }),
    );

    expect(onSelect).toHaveBeenCalledWith("voiture-utilitaire");
  });

  it("renders subcategories and calls onSelect", async () => {
    const category = CATEGORIES[0];
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <VehicleDetailsStep
        category={category}
        selectedSubcategoryId=""
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /voiture/i }));

    expect(onSelect).toHaveBeenCalledWith("voiture");
  });
});
