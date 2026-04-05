"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  images: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
      fetch("/api/admin/categories").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    ])
      .then(([prod, cats]) => {
        setProduct(prod);
        setCategories(cats);
      })
      .catch(() => toast.error("Failed to load product"));
  }, [id]);

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
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update product");
      }
      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
      setIsLoading(false);
    }
  }

  if (!product) {
    return (
      <div className="p-6 text-center text-gray-400">Loading product...</div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProductForm
          onSubmit={handleSubmit}
          defaultValues={{
            name: product.name,
            description: product.description ?? "",
            price: Number(product.price),
            categoryId: product.categoryId,
            isAvailable: product.isAvailable,
            isFeatured: product.isFeatured,
            images: [
              ...(product.images ?? []),
              ...Array(5 - Math.min(5, product.images?.length ?? 0)).fill(""),
            ].slice(0, 5),
          }}
          categories={categories}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
