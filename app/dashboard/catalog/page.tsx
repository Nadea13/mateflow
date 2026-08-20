import { getProducts } from "@/lib/actions/products";
import { getCustomers } from "@/lib/actions/customers";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getLocations, getInventoryLevels } from "@/lib/actions/inventory";
import { CatalogView } from "@/components/registry/CatalogView";
import { Customer, Supplier, Location, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
    const [products, customers, suppliers, locations, inventoryLevels] = await Promise.all([
        getProducts(),
        getCustomers(),
        getSuppliers(),
        getLocations(),
        getInventoryLevels()
    ]);

    return (
        <CatalogView
            products={products || []}
            customers={(customers || []) as Customer[]}
            suppliers={(suppliers || []) as Supplier[]}
            locations={(locations || []) as Location[]}
            inventoryLevels={inventoryLevels || []}
        />
    );
}
