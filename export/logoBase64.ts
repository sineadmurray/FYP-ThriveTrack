import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

export async function getLogoBase64(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(require("../assets/images/ThriveTrack Logo.png")); 
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.log("getLogoBase64 failed:", e);
    return null;
  }
}