import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';

function photoDirectory() {
  return new Directory(Paths.document, 'product-photos');
}

// Armazena apenas o nome relativo no banco, não o caminho temporário da galeria.
export function getProductPhotoUri(filename: string | null): string | null {
  return filename ? new File(photoDirectory(), filename).uri : null;
}

export async function pickProductPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export function saveProductPhoto(uri: string): string {
  const directory = photoDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = /^\.[a-zA-Z0-9]{1,8}$/.test(source.extension) ? source.extension : '.jpg';
  const filename = randomUUID() + extension;
  const target = new File(directory, filename);
  try {
    source.copy(target);
    return filename;
  } catch (error) {
    if (target.exists) target.delete();
    throw error;
  }
}

export function deleteProductPhoto(filename: string | null) {
  if (!filename) return;
  try {
    const file = new File(photoDirectory(), filename);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Não foi possível limpar a foto local:', error);
  }
}
