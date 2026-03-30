import { Request, Response } from "express";
import * as transactionRepository from "../repositories/transactionRepository";

export async function listTransactions(req: Request, res: Response) {
  return transactionRepository.listTransactions(req, res);
}

export async function createTransaction(req: Request, res: Response) {
  return transactionRepository.createTransaction(req, res);
}

export async function getTransaction(req: Request, res: Response) {
  return transactionRepository.getTransaction(req, res);
}

export async function updateTransaction(req: Request, res: Response) {
  return transactionRepository.updateTransaction(req, res);
}

export async function deleteTransaction(req: Request, res: Response) {
  return transactionRepository.deleteTransaction(req, res);
}
