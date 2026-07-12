'use server'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notifications, postBookmarks, postComments, postLikes, posts, reports } from '@/lib/db/schema'
export async function createPostAction(form:FormData){const session=await requireSession();if(!session.user.emailVerified)throw new Error('Verify your email before publishing.');const data=z.object({title:z.string().trim().min(5).max(160),body:z.string().trim().min(20).max(10000)}).parse(Object.fromEntries(form));const[post]=await db.insert(posts).values({authorId:session.user.id,...data,isImpactStory:form.get('isImpactStory')==='on',status:'published'}).returning({id:posts.id});redirect(`/community/${post.id}`)}
export async function interactPostAction(form:FormData){const session=await requireSession();const postId=z.string().uuid().parse(form.get('postId'));const action=z.enum(['like','bookmark']).parse(form.get('action'));const table=action==='like'?postLikes:postBookmarks;await db.insert(table).values({userId:session.user.id,postId}).onConflictDoNothing();revalidatePath(`/community/${postId}`)}
export async function commentAction(form:FormData){const session=await requireSession();const data=z.object({postId:z.string().uuid(),body:z.string().trim().min(2).max(2000)}).parse(Object.fromEntries(form));const[post]=await db.select({authorId:posts.authorId}).from(posts).where(eq(posts.id,data.postId));await db.insert(postComments).values({userId:session.user.id,...data});if(post&&post.authorId!==session.user.id)await db.insert(notifications).values({userId:post.authorId,type:'post_comment',title:'New comment',body:'Someone commented on your post.',href:`/community/${data.postId}`});revalidatePath(`/community/${data.postId}`)}
export async function reportPostAction(form:FormData){const session=await requireSession();const data=z.object({postId:z.string().uuid(),reason:z.string().trim().min(10).max(1000)}).parse(Object.fromEntries(form));await db.insert(reports).values({reporterId:session.user.id,entityType:'post',entityId:data.postId,reason:data.reason});revalidatePath(`/community/${data.postId}`)}
