import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export interface MailProvider{send(message:{to:string;subject:string;text:string}):Promise<void>}
export class LocalOutboxMail implements MailProvider{async send(message:{to:string;subject:string;text:string}){if(process.env.NODE_ENV==='production')throw new Error('Local mail outbox is disabled in production.');const root=process.env.LOCAL_STORAGE_ROOT??'.runtime/storage';const dir=join(root,'mail-outbox');await mkdir(dir,{recursive:true});await writeFile(join(dir,`${Date.now()}-${crypto.randomUUID()}.json`),JSON.stringify({...message,createdAt:new Date().toISOString()},null,2),{mode:0o600})}}
export const mailProvider:MailProvider=new LocalOutboxMail()
