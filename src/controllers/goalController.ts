import { Request, Response } from "express";
import * as goalService from "../services/goalService";

// Task 4.1: Goals Controller

export async function createGoal(req: Request, res: Response) {
  return goalService.createGoal(req, res);
}

export async function getGoal(req: Request, res: Response) {
  return goalService.getGoal(req, res);
}

export async function listGoals(req: Request, res: Response) {
  return goalService.listGoals(req, res);
}

export async function updateGoal(req: Request, res: Response) {
  return goalService.updateGoal(req, res);
}

export async function deleteGoal(req: Request, res: Response) {
  return goalService.deleteGoal(req, res);
}

export async function addAssetLink(req: Request, res: Response) {
  return goalService.addAssetLink(req, res);
}

export async function updateAssetLink(req: Request, res: Response) {
  return goalService.updateAssetLink(req, res);
}

export async function removeAssetLink(req: Request, res: Response) {
  return goalService.removeAssetLink(req, res);
}

export async function addContribution(req: Request, res: Response) {
  return goalService.addContribution(req, res);
}

export async function updateContribution(req: Request, res: Response) {
  return goalService.updateContribution(req, res);
}

export async function deleteContribution(req: Request, res: Response) {
  return goalService.deleteContribution(req, res);
}
