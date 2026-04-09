'use client';

import { useActionState, useRef, useState, useEffect } from 'react';
import { addProduct, type AddProductState } from './actions';

const initialState: AddProductState = { success: false };
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_TOTAL_SIZE = 95 * 1024 * 1024; // stay under server action body limit
const MAX_SECONDARY = 4;

export default function AddProductPage() {
  const [state, formAction, isPending] = useActionState(addProduct, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [secondaryPreviews, setSecondaryPreviews] = useState<(string | null)[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`Cover image exceeds 15 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB). Please choose a smaller file.`);
        e.target.value = '';
        setPreview(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleSecondaryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const files = Array.from(e.target.files ?? []);

    if (files.length > MAX_SECONDARY) {
      setFileError(`You can upload a maximum of ${MAX_SECONDARY} secondary images. You selected ${files.length}.`);
      e.target.value = '';
      setSecondaryPreviews([]);
      return;
    }

    const oversized = files.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setFileError(`Secondary image "${oversized.name}" exceeds 15 MB limit (${(oversized.size / 1024 / 1024).toFixed(1)} MB).`);
      e.target.value = '';
      setSecondaryPreviews([]);
      return;
    }

    setSecondaryPreviews(files.map(f => URL.createObjectURL(f)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setFileError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    let totalSize = 0;
    for (const value of formData.values()) {
      if (value instanceof File) totalSize += value.size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      e.preventDefault();
      setFileError(`Total upload size (${(totalSize / 1024 / 1024).toFixed(1)} MB) exceeds the ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB limit. Use smaller or fewer images.`);
    }
  }

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // Use setTimeout to defer state update and avoid cascading renders
      const timer = setTimeout(() => {
        setPreview(null);
        setSecondaryPreviews([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl tracking-tight mb-8">ADD PRODUCT</h1>

        {(state.error || fileError) && (
          <div className="mb-6 rounded-md border border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {fileError || state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-6 rounded-md border border-green-400 bg-green-50 px-4 py-3 text-green-700 text-sm">
            Product created successfully!
          </div>
        )}

        <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <label className="block">
            <span className="text-sm font-medium">Name *</span>
            <input
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Description */}
          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Price */}
          <label className="block">
            <span className="text-sm font-medium">Price (£) *</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Stock */}
          <label className="block">
            <span className="text-sm font-medium">Stock</span>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={0}
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Categories */}
          <label className="block">
            <span className="text-sm font-medium">
              Categories{' '}
              <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </span>
            <input
              name="categories"
              type="text"
              placeholder="LANDSCAPE, BW"
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Year */}
          <label className="block">
            <span className="text-sm font-medium">Year</span>
            <input
              name="year"
              type="text"
              defaultValue={new Date().getFullYear().toString()}
              className="mt-1 block w-full rounded-md border border-muted bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </label>

          {/* Image */}
          <label className="block">
            <span className="text-sm font-medium">Cover Image</span>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-80"
            />
          </label>

          {/* Preview */}
          {preview && (
            <div className="relative aspect-4/5 max-w-50 overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Secondary Images (up to 4) */}
          <label className="block">
            <span className="text-sm font-medium">
              Gallery Images{' '}
              <span className="text-muted-foreground font-normal">(up to 4, optional)</span>
            </span>
            <input
              name="secondary"
              type="file"
              accept="image/*"
              multiple
              onChange={handleSecondaryChange}
              className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-80"
            />
          </label>

          {/* Secondary Previews */}
          {secondaryPreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {secondaryPreviews.map((src, i) => (
                <div key={i} className="relative aspect-4/5 w-25 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src!} alt={`Secondary ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
