import { validPhotoFilename } from './photoIdentity';
import { SYNC_TABLES, syncTables, type SyncTable } from '../database/syncSchema';

export const CLOUD_PATHS: Record<SyncTable, string> = {
  materials:'materials', products:'products', product_materials:'productMaterials',
  material_cost_history:'materialCostHistory', fixed_expenses:'fixedExpenses',
  additional_expenses:'additionalExpenses', product_additional_expenses:'productAdditionalExpenses',
  pricing_history:'pricingHistory', pricing_settings:'settings', onboarding_state:'settings', dashboard_settings:'settings',
};
const settingsIds: Partial<Record<SyncTable,string>> = {
  pricing_settings:'pricing', onboarding_state:'onboarding', dashboard_settings:'dashboard',
};
export function cloudPath(table:SyncTable,id:string):[string,string] {
  if(!syncTables.includes(table))throw new Error('Tabela inválida.');
  const settingsId=settingsIds[table];
  if(settingsId ? id!=='account' : !/^[a-f0-9]{32}$/.test(id))throw new Error('Identidade inválida.');
  return [CLOUD_PATHS[table],settingsId??id];
}
export function structuredFields(table:SyncTable,payload:string,deleted:boolean):Record<string,unknown> {
  const data=JSON.parse(payload);
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Registro inválido.');
  const fields=SYNC_TABLES[table].columns.split(',').filter(k=>k!=='id');
  if(deleted){if(Object.keys(data).length)throw new Error('Exclusão inválida.');return {};}
  // Documentos anteriores às fotos não têm este campo; ausência não significa remoção.
  const expected=table==='products'&&!Object.prototype.hasOwnProperty.call(data,'photoFilename')?fields.filter(k=>k!=='photoFilename'):fields;
  if(Object.keys(data).length!==expected.length||expected.some(k=>!Object.prototype.hasOwnProperty.call(data,k)))throw new Error('Campos incompatíveis.');
  if(table==='products'&&'photoFilename' in data&&data.photoFilename!==null&&!validPhotoFilename(data.photoFilename))throw new Error('Nome de foto inválido.');
  if(table==='pricing_history'){
    data.snapshot=JSON.parse(data.snapshot);
    if(!data.snapshot||typeof data.snapshot!=='object'||Array.isArray(data.snapshot))throw new Error('Histórico inválido.');
  }
  return data;
}
export function canonical(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value!==null&&typeof value==='object'){
    const obj=value as Record<string,unknown>;
    return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';
  }
  return JSON.stringify(value);
}
export function sameFields(data:Record<string,unknown>,fields:Record<string,unknown>,table:SyncTable,id:string,deleted:boolean){
  if(data.schemaVersion!==2||data.tableName!==table||data.globalId!==id||data.deleted!==deleted)return false;
  const actual={...data};
  for(const key of ['schemaVersion','tableName','globalId','revision','deleted','updatedAt'])delete actual[key];
  return canonical(actual)===canonical(fields);
}
