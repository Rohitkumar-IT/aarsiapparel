import { ProductGridSkeleton } from "@/components/ProductCard";
export default function Loading() {
  return <div className="container-x py-14"><div className="skeleton mb-10 h-12 w-64 rounded" /><ProductGridSkeleton n={8} /></div>;
}
