import { Request, Response } from "express";
import * as importService from "../services/importService";

export async function parseImport(req: Request, res: Response) {
  return importService.parseImport(req, res);
}

export async function confirmImport(req: Request, res: Response) {
  return importService.confirmImport(req, res);
}
