import { Request, Response } from "express";
import * as categoryService from "../services/categoryService";

export async function listCategories(req: Request, res: Response) {
  return categoryService.listCategories(req, res);
}

export async function createCategory(req: Request, res: Response) {
  return categoryService.createCategory(req, res);
}

export async function getCategory(req: Request, res: Response) {
  return categoryService.getCategory(req, res);
}

export async function updateCategory(req: Request, res: Response) {
  return categoryService.updateCategory(req, res);
}

export async function deleteCategory(req: Request, res: Response) {
  return categoryService.deleteCategory(req, res);
}
