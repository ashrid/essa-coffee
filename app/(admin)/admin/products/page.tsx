"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  images: string[];
  category: Category;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete");
      }
      toast.success(`"${name}" deleted`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-forest-600 hover:bg-forest-700 text-cream-50 text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No products yet.{" "}
          <Link href="/admin/products/new" className="text-forest-600 hover:underline">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-12"></th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{product.category.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatPrice(Number(product.price))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      product.isAvailable
                        ? "bg-sage-100 text-sage-500"
                        : "bg-forest-100 text-forest-500"
                    }`}>
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-forest-600 hover:text-forest-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
