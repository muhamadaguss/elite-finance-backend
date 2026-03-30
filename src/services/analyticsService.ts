import { Request, Response } from "express";
import * as analyticsRepository from "../repositories/analyticsRepository";
import {
  GetMonthlySummaryQueryParams,
  GetSpendingByCategoryQueryParams,
  GetMonthlyTrendQueryParams,
} from "../validation";

export async function getMonthlySummary(req: Request, res: Response) {
  const { month } = GetMonthlySummaryQueryParams.parse(req.query);
  const userId = req.user!.id;
  const summary = await analyticsRepository.getMonthlySummary(userId, month);
  res.json(summary);
}

export async function getSpendingByCategory(req: Request, res: Response) {
  const { month } = GetSpendingByCategoryQueryParams.parse(req.query);
  const userId = req.user!.id;
  const result = await analyticsRepository.getSpendingByCategory(userId, month);
  res.json(result);
}

export async function getMonthlyTrend(req: Request, res: Response) {
  const { months: monthsParam } = GetMonthlyTrendQueryParams.parse(req.query);
  const months = monthsParam ?? 12;
  const userId = req.user!.id;
  const result = await analyticsRepository.getMonthlyTrend(userId, months);
  res.json(result);
}
