import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadProblemImage(file: File, wallId: string, userId: string) {
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}.${extension}`;
  const filePath = `problems/${wallId}/${userId}/${fileName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function uploadWallImage(file: File, userId: string) {
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}.${extension}`;
  const filePath = `walls/${userId}/${fileName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}