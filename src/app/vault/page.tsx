import VaultRender from "@/components/vault/VaultRender";

export default function VaultPage() {
  return (
    <VaultRender
      modelPath="/models/beer.glb"
      pricePerBar={30}
      raider="McDonald"
    />
  );
}
