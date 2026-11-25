import { validPhotoFilename,validPhotoData } from '../utils/photoIdentity';
import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';

function photoDirectory() {
  return new Directory(Paths.document, 'product-photos');
}

// Armazena apenas o nome relativo no banco, não o caminho temporário da galeria.
export function getProductPhotoUri(filename: string | null): string | null {
  if (!validPhotoFilename(filename)) return null;
  const file = new File(photoDirectory(), filename);
  if(file.exists && file.size > 0)return file.uri;
  // O arquivo remoto é sempre JPEG, mesmo quando a foto original era HEIC/PNG.
  const restored=new File(photoDirectory(),filename+'.jpg');
  return restored.exists&&restored.size>0?restored.uri:null;
}

export async function pickProductPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export async function saveProductPhoto(uri: string): Promise<string> {
  const directory = photoDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = /^\.[a-zA-Z0-9]{1,8}$/.test(source.extension) ? source.extension : '.jpg';
  const filename = randomUUID() + extension;
  const target = new File(directory, filename);
  try {
    await source.copy(target);
    return filename;
  } catch (error) {
    if (target.exists) target.delete();
    throw error;
  }
}

export function deleteProductPhoto(filename: string | null) {
  if (!validPhotoFilename(filename)) return;
  try {
    const file = new File(photoDirectory(), filename);
    if (file.exists) file.delete();
    const restored=new File(photoDirectory(),filename+'.jpg');
    if(restored.exists)restored.delete();
  } catch (error) {
    console.warn('Não foi possível limpar a foto local:', error);
  }
}

export async function restoreProductPhoto(filename:string,base64:string){
  if(!validPhotoFilename(filename)||!validPhotoData(base64))throw new Error('Foto remota inválida.');
  const directory=photoDirectory();
  directory.create({idempotent:true,intermediates:true});
  if(getProductPhotoUri(filename))return false;
  const target=new File(directory,filename+'.jpg');
  if(target.exists&&target.size>0)return false;
  const temporary=new File(directory,randomUUID()+'.tmp');
  try{
    temporary.create();
    await temporary.write(base64,{encoding:'base64'});
    if(!temporary.exists||temporary.size<=0)throw new Error('Foto incompleta.');
    if(target.exists)target.delete();
    await temporary.move(target);
    return true;
  }finally{if(temporary.exists&&temporary.uri!==target.uri)temporary.delete();}
}
