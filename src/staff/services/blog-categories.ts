"use client";
import { slugify } from "@/lib/format";
export interface BlogCategory { id:string; name:string; slug:string; description:string; createdAt:string; deletedAt?:string|null; }
export type BlogCategoryInput = Omit<BlogCategory,"id"|"createdAt"|"deletedAt">;
export interface BlogCategoryWithCount extends BlogCategory { postCount:number; }
async function request<T>(url:string, init?:RequestInit):Promise<T>{ const res=await fetch(url,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})}}); const json=await res.json(); if(!res.ok) throw new Error(json.error||"Category request failed"); return json.data as T; }
export const listBlogCategories=(o?:{trash?:boolean})=>request<BlogCategoryWithCount[]>(`/api/store/blog/categories${o?.trash?"?trash=1":""}`);
export const getBlogCategory=(id:string)=>request<BlogCategoryWithCount>(`/api/store/blog/categories/${id}`);
export const countTrashedBlogCategories=async()=> (await request<BlogCategoryWithCount[]>("/api/store/blog/categories?trash=1")).length;
export const createBlogCategory=(input:BlogCategoryInput)=>request<BlogCategory>("/api/store/blog/categories",{method:"POST",body:JSON.stringify({action:"create",...input,slug:input.slug||slugify(input.name)})});
export const updateBlogCategory=(id:string,input:Partial<BlogCategoryInput>)=>request<BlogCategory>(`/api/store/blog/categories/${id}`,{method:"PATCH",body:JSON.stringify(input)});
export const trashBlogCategory=(id:string)=>request<void>(`/api/store/blog/categories/${id}`,{method:"DELETE"});
export const restoreBlogCategory=(id:string)=>request<void>(`/api/store/blog/categories/${id}`,{method:"POST"});
export const permanentlyDeleteBlogCategory=(id:string)=>request<void>(`/api/store/blog/categories/${id}?permanent=1`,{method:"DELETE"});
