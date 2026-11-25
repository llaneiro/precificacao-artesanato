import { doc,getDoc,getFirestore } from 'firebase/firestore/lite';
import { manipulateAsync,SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import app,{auth} from './firebaseConfig';
import { getProductPhotoUri,restoreProductPhoto } from './productPhoto';
import { validPhotoFilename,validPhotoData } from '../utils/photoIdentity';
const firestore=getFirestore(app);
export function photoRef(uid:string,filename:string){
  if(auth.currentUser?.uid!==uid||!validPhotoFilename(filename))throw new Error('Referência de foto inválida.');
  return doc(firestore,'users',uid,'productPhotos',filename);
}
async function compressedPhoto(uri:string){
  // A primeira operação normaliza orientação/formato; em seguida reduz
  // proporcionalmente a maior dimensão e comprime até caber no limite.
  const first=await manipulateAsync(uri,[],{format:SaveFormat.JPEG,compress:0.8});
  try{
    for(const [max,quality] of [[1200,0.72],[900,0.65],[640,0.6],[400,0.5]]){
      const scale=Math.min(1,max/Math.max(first.width,first.height));
      const result=await manipulateAsync(first.uri,[{resize:{width:Math.max(1,Math.round(first.width*scale)),height:Math.max(1,Math.round(first.height*scale))}}],{format:SaveFormat.JPEG,compress:quality,base64:true});
      try{if(validPhotoData(result.base64))return result.base64;}
      finally{try{new File(result.uri).delete()}catch{}}
    }
    throw new Error('Não foi possível compactar a foto.');
  }finally{try{new File(first.uri).delete()}catch{}}
}
export async function prepareCloudPhoto(filename:string){
  const uri=getProductPhotoUri(filename);
  if(!uri)throw new Error('Foto local indisponível.');
  return compressedPhoto(uri);
}
export async function downloadCloudPhoto(uid:string,filename:string){
  if(getProductPhotoUri(filename))return false;
  const ref=photoRef(uid,filename);
  const snapshot=await getDoc(ref);
  if(auth.currentUser?.uid!==uid)throw new Error('Sessão alterada.');
  const data=snapshot.data();
  if(!data||data.schemaVersion!==1||data.mimeType!=='image/jpeg'||!validPhotoData(data.base64))throw new Error('Foto remota indisponível.');
  return restoreProductPhoto(filename,data.base64);
}
