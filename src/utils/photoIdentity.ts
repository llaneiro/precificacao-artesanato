// Nomes relativos imutáveis: nenhuma URL ou caminho fornecido pelo servidor.
export const MAX_PHOTO_BASE64 = 280000;
export function validPhotoFilename(value:unknown):value is string {
  return typeof value==='string'&&/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\.[a-zA-Z0-9]{1,8}$/.test(value);
}
export function validPhotoData(value:unknown):value is string {
  return typeof value==='string'&&value.length<=MAX_PHOTO_BASE64&&value.length%4===0&&value.startsWith('/9j/')&&/^[A-Za-z0-9+/]+={0,2}$/.test(value);
}
