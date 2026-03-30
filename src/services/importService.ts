import { Request, Response } from "express";
import * as importRepository from "../repositories/importRepository";
import { ParseImportBody, ConfirmImportBody } from "../validation";

export async function parseImport(req: Request, res: Response) {
  const body = ParseImportBody.parse(req.body);
  const userId = req.user!.id;
  const result = await importRepository.parseImport(
    userId,
    body.content,
    body.format,
  );
  res.json(result);
}

export async function confirmImport(req: Request, res: Response) {
  const body = ConfirmImportBody.parse(req.body);
  const userId = req.user!.id;
  const result = await importRepository.confirmImport(
    userId,
    body.transactions,
  );
  res.json(result);
}
