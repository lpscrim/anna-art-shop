/**
 * Race-condition test for reserve_stock.
 *
 * 1. Picks the first in-stock product (with a stripe_price_id).
 * 2. Sets its stock_level to 1.
 * 3. Fires 5 concurrent reserve_stock calls for qty=1.
 * 4. Checks that exactly ONE returned reserved:true and stock is now 0.
 * 5. Restores original stock level.
 *
 * The new reserve_stock function locks rows before checking, so only one
 * concurrent caller should ever win the reservation.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency required)
const envPath = resolve(process.cwd(), ".env.local");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim();
  }
} catch {
  // .env.local not found — rely on env vars already being set
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE env vars. Check .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

// --- Pick a product with a stripe_price_id ---
const { data: product, error: fetchErr } = await supabase
  .from("products")
  .select("id, name, stripe_price_id, stock_level")
  .not("stripe_price_id", "is", null)
  .limit(1)
  .single();

if (fetchErr || !product) {
  console.error("No products with stripe_price_id found:", fetchErr?.message);
  process.exit(1);
}

const originalStock = product.stock_level;
console.log(`\nUsing product: "${product.name}"`);
console.log(`  stripe_price_id: ${product.stripe_price_id}`);
console.log(`  Original stock:  ${originalStock}`);

// --- Set stock to 1 so only one caller can win ---
await supabase
  .from("products")
  .update({ stock_level: 1 })
  .eq("id", product.id);

console.log("\nStock set to 1");
console.log("Firing 5 concurrent reserve_stock(qty=1) calls...\n");

// --- Fire 5 concurrent calls ---
const results = await Promise.all(
  Array.from({ length: 5 }, (_, i) =>
    supabase
      .rpc("reserve_stock", {
        items: [{ stripe_price_id: product.stripe_price_id, qty: 1 }],
      })
      .then(({ data, error }) => {
        const row = Array.isArray(data) ? data[0] : null;
        const reserved = row?.reserved === true;
        console.log(
          `  Call ${i + 1}: ${reserved ? "✅ RESERVED" : "⛔ BLOCKED (no stock)"}` +
          (error ? ` [error: ${error.message}]` : "")
        );
        return reserved;
      })
  )
);

const successCount = results.filter(Boolean).length;

// --- Check final stock ---
const { data: after } = await supabase
  .from("products")
  .select("stock_level")
  .eq("id", product.id)
  .single();

console.log(`\n--- Results ---`);
console.log(`Calls that reserved:  ${successCount} / 5`);
console.log(`Final stock_level:    ${after?.stock_level}`);

if (successCount === 1 && after?.stock_level === 0) {
  console.log("\n✅ PASS — Exactly 1 caller got the stock. No double purchase.");
} else if (successCount === 0) {
  console.log("\n⚠️  UNEXPECTED — No caller reserved stock (function may not be deployed yet).");
} else {
  console.log(`\n❌ FAIL — ${successCount} callers reserved the same item. Race condition!`);
}

// --- Restore original stock ---
// Also call restore_stock for each successful reservation to keep things clean
if (successCount > 0) {
  await supabase.rpc("restore_stock", {
    items: Array.from({ length: successCount }, () => ({
      stripe_price_id: product.stripe_price_id,
      qty: 1,
    })),
  });
}
await supabase
  .from("products")
  .update({ stock_level: originalStock })
  .eq("id", product.id);

console.log(`\nStock restored to ${originalStock}.`);
