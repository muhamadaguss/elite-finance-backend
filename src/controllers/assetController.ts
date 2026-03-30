import { Request, Response } from "express";
import * as assetService from "../services/assetService";

export async function listAssets(req: Request, res: Response) {
  return assetService.listAssets(req, res);
}

export async function createAsset(req: Request, res: Response) {
  return assetService.createAsset(req, res);
}

export async function updateAsset(req: Request, res: Response) {
  return assetService.updateAsset(req, res);
}

export async function deleteAsset(req: Request, res: Response) {
  return assetService.deleteAsset(req, res);
}

export async function getNetWorthHistory(req: Request, res: Response) {
  return assetService.getNetWorthHistory(req, res);
}
