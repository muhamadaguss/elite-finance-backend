import { Request, Response } from "express";
import * as analyticsService from "../services/analyticsService";

export async function getMonthlySummary(req: Request, res: Response) {
  return analyticsService.getMonthlySummary(req, res);
}

export async function getSpendingByCategory(req: Request, res: Response) {
  return analyticsService.getSpendingByCategory(req, res);
}

export async function getMonthlyTrend(req: Request, res: Response) {
  return analyticsService.getMonthlyTrend(req, res);
}
