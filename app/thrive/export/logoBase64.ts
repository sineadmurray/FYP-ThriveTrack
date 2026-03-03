import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export async function getLogoBase64(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(require("../../../assets/logo.png")); // adjust path
    await asset.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
  encoding: "base64",
});
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}