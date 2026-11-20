import { Suspense } from "react";
import DocClient from "./DocClient";

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="page">
          <main className="container">
            <p className="empty-text">Loading...</p>
          </main>
        </div>
      }
    >
      <DocClient params={params} />
    </Suspense>
  );
}
