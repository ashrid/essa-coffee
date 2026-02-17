"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategorySidebarProps {
  categories: Category[];
}

export default function CategorySidebar({ categories }: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const inStockOnly = searchParams.get("inStock") === "true";
  const sortBy = searchParams.get("sort") || "default";

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "default") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newUrl = params.toString()
      ? `/shop?${params.toString()}`
      : "/shop";
    router.push(newUrl, { scroll: false });
  };

  const handleCategoryClick = (slug: string) => {
    updateSearchParams({
      category: slug === activeCategory ? null : slug,
    });
  };

  const handleInStockToggle = (checked: boolean) => {
    updateSearchParams({
      inStock: checked ? "true" : null,
    });
  };

  const handleSortChange = (value: string) => {
    updateSearchParams({
      sort: value === "default" ? null : value,
    });
  };

  return (
    <aside className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="font-semibold text-forest-900 mb-3">Sort By</h3>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full bg-white border-cream-200">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-forest-900 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryClick("")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeCategory === ""
                ? "bg-forest-600 text-cream-50"
                : "text-forest-700 hover:bg-cream-100"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeCategory === category.slug
                  ? "bg-forest-600 text-cream-50"
                  : "text-forest-700 hover:bg-cream-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <h3 className="font-semibold text-forest-900 mb-3">Filters</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={handleInStockToggle}
          />
          <label
            htmlFor="in-stock"
            className="text-sm text-forest-700 cursor-pointer"
          >
            In stock only
          </label>
        </div>
      </div>
    </aside>
  );
}
