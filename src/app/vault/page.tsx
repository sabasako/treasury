import VaultRender from "@/components/vault/VaultRender";

export interface PendingAnimationTransaction {
  id: number;
  senderId: number;
  receiverId: number;
  amount: number;
  isAnimated: boolean;
  timestamp: string;
}

export default async function VaultPage() {
  let data: PendingAnimationTransaction[];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Transaction/pending-animations`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjMiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic3RyaW5ndGVzdCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlVzZXIiLCJleHAiOjE3NjU3NjgxNzksImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcwMDAiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MDAwIn0.hIdD-fqO-xz6IGRvzN8oouEcQ9eQe-SXBM6Et5eGgK4`,
        },
      }
    );

    data = await res.json();
  } catch (err) {
    console.error(err);

    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-sm text-gray-500">
          {err instanceof Error ? err.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const notAnimatedTransactions = data.filter((item) => !item.isAnimated);
  console.log("Not animated transactions:", notAnimatedTransactions);

  return (
    <VaultRender
      modelPath="/models/kfc.glb"
      pricePerBar={30}
      notAnimatedTransactions={notAnimatedTransactions}
    />
  );
}
