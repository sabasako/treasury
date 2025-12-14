import VaultRender from "@/components/vault/VaultRender";

export default function VaultPage() {
  return (
    <VaultRender
      modelPath="/models/mcdonalds.glb"
      pricePerBar={30}
      raider="McDonald"
    />
  );
}
