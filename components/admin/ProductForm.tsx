"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  images: string[];
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  defaultValues?: Partial<ProductFormData>;
  categories: Category[];
  isLoading: boolean;
}

function TiptapEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  return (
    <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-forest-500 focus-within:border-forest-500">
      {editor && (
        <div className="flex gap-1 p-1 border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 text-xs rounded hover:bg-gray-200 ${editor.isActive("bold") ? "bg-gray-200 font-bold" : ""}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 text-xs rounded hover:bg-gray-200 ${editor.isActive("italic") ? "bg-gray-200 italic" : ""}`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 text-xs rounded hover:bg-gray-200 ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 text-xs rounded hover:bg-gray-200 ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}
          >
            1. List
          </button>
        </div>
      )}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}

export function ProductForm({
  onSubmit,
  defaultValues,
  categories,
  isLoading,
}: ProductFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [price, setPrice] = useState(
    defaultValues?.price !== undefined ? String(defaultValues.price) : ""
  );
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");
  const [isAvailable, setIsAvailable] = useState(defaultValues?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(defaultValues?.isFeatured ?? false);
  const [images, setImages] = useState<string[]>(
    defaultValues?.images ?? ["", "", "", "", ""]
  );

  const handleDescriptionChange = useCallback((html: string) => {
    setDescription(html);
  }, []);

  function handleImageChange(index: number, value: string) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanImages = images.filter((url) => url.trim() !== "");
    await onSubmit({
      name,
      description,
      price: parseFloat(price),
      categoryId,
      isAvailable,
      isFeatured,
      images: cleanImages,
    });
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className={labelClass}>Product Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
          placeholder="e.g. Espresso Blend"
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>Category *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div>
        <label className={labelClass}>Price (AED) *</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0.01"
          step="0.01"
          className={inputClass}
          placeholder="9.99"
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <TiptapEditor
          content={description}
          onChange={handleDescriptionChange}
          placeholder="Product description..."
        />
      </div>

      {/* Images */}
      <div>
        <label className={labelClass}>Images (up to 5 URLs)</label>
        <div className="space-y-2">
          {images.map((url, i) => (
            <input
              key={i}
              type="url"
              value={url}
              onChange={(e) => handleImageChange(i, e.target.value)}
              className={inputClass}
              placeholder={`Image URL ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isAvailable"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
        />
        <label htmlFor="isAvailable" className={labelClass}>
          Available for purchase
        </label>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isFeatured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
        />
        <label htmlFor="isFeatured" className={labelClass}>
          Feature on homepage
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-forest-600 hover:bg-forest-700 text-cream-50 font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
