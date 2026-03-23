"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  async function handleSubmit(data: {
    name: string;
    price: number;
    categoryId: string;
    isAvailable: boolean;
    isFeatured: boolean;
    images: string[];
    description: string;
  }) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create product");
      }
      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create product");
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProductForm
          onSubmit={handleSubmit}
          categories={categories}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
