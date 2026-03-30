import { Request, Response } from "express";
import * as transactionService from "../services/transactionService";

export async function listTransactions(req: Request, res: Response) {
  return transactionService.listTransactions(req, res);
}

export async function createTransaction(req: Request, res: Response) {
  return transactionService.createTransaction(req, res);
}

export async function getTransaction(req: Request, res: Response) {
  return transactionService.getTransaction(req, res);
}

export async function updateTransaction(req: Request, res: Response) {
  return transactionService.updateTransaction(req, res);
}

export async function deleteTransaction(req: Request, res: Response) {
  return transactionService.deleteTransaction(req, res);
}
