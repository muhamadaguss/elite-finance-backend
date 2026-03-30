import { Request, Response } from "express";
import * as assetRepository from "../repositories/assetRepository";
import {
  CreateAssetBody,
  UpdateAssetBody,
  UpdateAssetParams,
  DeleteAssetParams,
} from "../validation";

export async function listAssets(req: Request, res: Response) {
  const userId = req.user!.id;
  const assets = await assetRepository.listAssets(userId);
  res.json(assets);
}

export async function createAsset(req: Request, res: Response) {
  const userId = req.user!.id;
  const body = CreateAssetBody.parse(req.body);
  const created = await assetRepository.createAsset(userId, body);
  res.status(201).json(created);
}

export async function updateAsset(req: Request, res: Response): Promise<void> {
  const { id } = UpdateAssetParams.parse(req.params);
  const userId = req.user!.id;
  const body = UpdateAssetBody.parse(req.body);
  const updated = await assetRepository.updateAsset(userId, String(id), body);
  if (!updated) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(updated);
}

export async function deleteAsset(req: Request, res: Response) {
  const { id } = DeleteAssetParams.parse(req.params);
  const userId = req.user!.id;
  await assetRepository.deleteAsset(userId, String(id));
  res.status(204).send();
}

export async function getNetWorthHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  const result = await assetRepository.getNetWorthHistory(userId);
  res.json(result);
}
