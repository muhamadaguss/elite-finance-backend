import { Request, Response } from "express";
import * as categoryRepository from "../repositories/categoryRepository";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "../validation";

export async function listCategories(req: Request, res: Response) {
  const userId = req.user!.id;
  const categories = await categoryRepository.listCategoriesWithMeta(userId);
  res.json(categories);
}

export async function createCategory(req: Request, res: Response) {
  const userId = req.user!.id;
  const body = CreateCategoryBody.parse(req.body);
  const created = await categoryRepository.createCategory(userId, body);
  res.status(201).json(created);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { id } = UpdateCategoryParams.parse(req.params);
  const userId = req.user!.id;
  const body = UpdateCategoryBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.parentId !== undefined) updateData.parentId = body.parentId;

  const updated = await categoryRepository.updateCategory(
    userId,
    String(id),
    updateData,
  );
  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(updated);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = DeleteCategoryParams.parse(req.params);
  const userId = req.user!.id;
  await categoryRepository.deleteCategory(userId, String(id));
  res.status(204).send();
}

// Placeholder for getCategory (not implemented in original routes)
export async function getCategory(req: Request, res: Response) {
  res.status(501).json({ error: "Not implemented" });
}
