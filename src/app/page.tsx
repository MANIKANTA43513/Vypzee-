"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, ShoppingCart } from "lucide-react";

// ID generator using Web Crypto where available; no external deps
function safeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type Item = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  createdAt: number;
};

const CATEGORIES = [
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Pantry",
  "Beverages",
  "Snacks",
  "Household",
  "Personal Care",
];

export default function ShoppingListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<string>("produce");

  // Edit state
  const [editing, setEditing] = useState<Item | null>(null);

  // Load from localStorage with a tiny delay to demonstrate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("shopping-items");
        if (raw) setItems(JSON.parse(raw));
      } catch (e) {
        setError("Failed to load items. Local storage might be unavailable.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("shopping-items", JSON.stringify(items));
    } catch {
      // ignore persistence errors
    }
  }, [items]);

  const resetForm = () => {
    setName("");
    setQuantity(1);
    setCategory("produce");
    setError(null);
  };

  const addItem = () => {
    setError(null);
    if (!name.trim()) return setError("Please enter an item name.");
    if (!Number.isFinite(quantity) || quantity <= 0)
      return setError("Quantity must be a positive number.");
    if (!category) return setError("Please select a category.");

    const newItem: Item = {
      id: safeId(),
      name: name.trim(),
      quantity: Math.floor(quantity),
      category,
      completed: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
  };

  const toggleCompleted = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const startEdit = (item: Item) => setEditing(item);

  const saveEdit = (updates: Partial<Item>) => {
    if (!editing) return;
    const nextName = updates.name ?? editing.name;
    const nextQty = updates.quantity ?? editing.quantity;
    const nextCat = updates.category ?? editing.category;

    if (!nextName.trim()) return setError("Item name cannot be empty.");
    if (!Number.isFinite(nextQty) || (nextQty ?? 0) <= 0)
      return setError("Quantity must be a positive number.");

    setItems((prev) =>
      prev.map((it) =>
        it.id === editing.id
          ? { ...it, name: nextName.trim(), quantity: Math.floor(nextQty), category: nextCat }
          : it
      )
    );
    setEditing(null);
  };

  const remainingCount = useMemo(() => items.filter((i) => !i.completed).length, [items]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-6" />
            <h1 className="text-2xl font-semibold tracking-tight">Shopping List</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            {remainingCount} remaining
          </Badge>
        </header>

        <p className="text-sm text-muted-foreground mt-2">
          Add items to your list, mark them as completed, edit, or remove them. Your data is saved in your browser.
        </p>

        <Separator className="my-6" />

        {/* Add Item Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add item</CardTitle>
            <CardDescription>Quickly add items with name, quantity, and category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <Label htmlFor="name">Item name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Apples"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="qty">Qty</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={Number.isNaN(quantity) ? 1 : quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || "1", 10))}
                />
              </div>
              <div className="md:col-span-4">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger aria-label="Category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="pantry">Pantry</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="household">Household</SelectItem>
                    <SelectItem value="personal-care">Personal Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-12 flex flex-col sm:flex-row gap-3 sm:items-end">
                {error && (
                  <div className="text-sm text-destructive" role="alert">
                    {error}
                  </div>
                )}
                <div className="flex-1" />
                <Button onClick={addItem} className="sm:w-auto w-full">Add to list</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border p-4 bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleCompleted(item.id)}
                        aria-label={item.completed ? "Mark as not completed" : "Mark as completed"}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.name}
                          </p>
                          <Badge variant="outline">x{item.quantity}</Badge>
                          <Badge className="capitalize" variant="secondary">
                            {item.category.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Dialog onOpenChange={(open) => !open && setEditing(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit item</DialogTitle>
                            <DialogDescription>Update the item details and save your changes.</DialogDescription>
                          </DialogHeader>
                          {editing && (
                            <EditForm
                              key={editing.id}
                              item={editing}
                              onCancel={() => setEditing(null)}
                              onSave={saveEdit}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0">
        <img
          src="https://images.unsplash.com/photo-1586201375781-4c1d4d08ef1b?q=80&w=1200&auto=format&fit=crop"
          alt="Groceries in a basket"
          className="h-48 md:h-full w-full object-cover"
        />
        <div className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Your list is empty</CardTitle>
            <CardDescription>Start by adding a few items you need to buy.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4 text-sm text-muted-foreground">
            Pro tip: Use clear names (e.g., "Whole milk") and group by category for faster shopping.
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: Item;
  onSave: (updates: Partial<Item>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [category, setCategory] = useState<string>(item.category);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <Label htmlFor="edit-name">Item name</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="edit-qty">Qty</Label>
          <Input
            id="edit-qty"
            type="number"
            min={1}
            value={Number.isNaN(quantity) ? 1 : quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value || "1", 10))}
          />
        </div>
        <div className="md:col-span-4">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produce">Produce</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
              <SelectItem value="bakery">Bakery</SelectItem>
              <SelectItem value="meat">Meat</SelectItem>
              <SelectItem value="pantry">Pantry</SelectItem>
              <SelectItem value="beverages">Beverages</SelectItem>
              <SelectItem value="snacks">Snacks</SelectItem>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="personal-care">Personal Care</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ name, quantity, category })}>Save changes</Button>
      </div>
    </div>
  );
}