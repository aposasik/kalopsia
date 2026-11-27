import { Injectable } from '@angular/core';
import { Camera, CameraDirection } from '@capacitor/camera';

/** Από πού έρχεται μια φωτογραφία. Η σελίδα ζητά από εδώ και δεν ξέρει τίποτα για κάμερες. */
export abstract class PhotoSource {
  /** Ανοίγει την κάμερα. null αν ο χρήστης το ακύρωσε. */
  abstract take(): Promise<Blob | null>;
  /** Ανοίγει τις φωτογραφίες της συσκευής. null αν ο χρήστης το ακύρωσε. */
  abstract choose(): Promise<Blob | null>;
}

@Injectable()
export class CapacitorPhotoSource extends PhotoSource {
  async take(): Promise<Blob | null> {
    try {
      const photo = await Camera.takePhoto({
        cameraDirection: CameraDirection.Front,
        webUseInput: true,
      });
      return toBlob(photo.webPath);
    } catch {
      return null; // το plugin πετάει σφάλμα όταν ο χρήστης πατήσει «άκυρο»
    }
  }

  async choose(): Promise<Blob | null> {
    try {
      const { results } = await Camera.chooseFromGallery({ webUseInput: true });
      return toBlob(results[0]?.webPath);
    } catch {
      return null;
    }
  }
}

/** Το webPath είναι διεύθυνση που διαβάζεται με fetch, και στο κινητό και στον browser. */
async function toBlob(webPath: string | undefined): Promise<Blob | null> {
  return webPath ? (await fetch(webPath)).blob() : null;
}
