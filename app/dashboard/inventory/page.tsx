import { getLocations, getInventoryLevels } from "@/lib/actions/inventory";
import { getProducts } from "@/lib/actions/products";
import { InventoryView } from "@/components/inventory/inventory-view";
import { Location, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const [locations, products, inventoryLevels] = await Promise.all([
        getLocations(),
        getProducts(),
        getInventoryLevels()
    ]);

    return (
        <InventoryView
            locations={locations as Location[]}
            products={products as Product[]}
            inventoryLevels={inventoryLevels}
        />
    );
}
